"""Business logic for medical documents, versions, and uploads."""

import hashlib
import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import delete, func, select, update
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.errors import NotFoundError
from app.db.models import (
    DocumentProcessingJob,
    DocumentVersion,
    FamilyMember,
    MedicalDocument,
    ShareLink,
)
from app.integrations.supabase.storage import storage_service
from app.modules.records.schemas import (
    DocumentCompleteUploadRequest,
    DocumentData,
    DocumentInitRequest,
    DocumentUpdateRequest,
    DocumentVersionData,
)
from app.services.audit_service import record_audit_event


def _to_document_data(
    doc: MedicalDocument, current_version: DocumentVersion | None = None
) -> DocumentData:
    member_name = (
        doc.family_member.display_name if doc.family_member else "Unknown Member"
    )
    version_data = None
    if current_version:
        version_data = DocumentVersionData(
            id=current_version.id,
            versionNumber=current_version.version_number,
            originalFilename=current_version.original_filename,
            mimeType=current_version.mime_type,
            fileSizeBytes=current_version.file_size_bytes,
            sha256=current_version.sha256,
            isCurrent=current_version.is_current,
            createdAt=current_version.created_at,
        )

    return DocumentData(
        id=doc.id,
        workspaceId=doc.workspace_id,
        familyMemberId=doc.family_member_id,
        familyMemberName=member_name,
        title=doc.title,
        category=doc.category,
        documentDate=doc.document_date,
        notes=doc.notes,
        currentVersion=version_data,
        deletedAt=doc.deleted_at,
        purgeAfter=doc.purge_after,
        createdAt=doc.created_at,
        updatedAt=doc.updated_at,
    )


def init_document_upload(
    db: Session,
    workspace_id: uuid.UUID,
    user_id: uuid.UUID,
    payload: DocumentInitRequest,
    request_id: str | None = None,
) -> tuple[DocumentData, uuid.UUID, str, str]:
    """Initialize a document upload session, generating a presigned PUT URL."""
    # Validate family member belongs to caller's workspace
    member = db.scalar(
        select(FamilyMember).where(
            FamilyMember.id == payload.memberId,
            FamilyMember.workspace_id == workspace_id,
            FamilyMember.deleted_at.is_(None),
        )
    )
    if not member:
        raise NotFoundError("Family member not found in this workspace.")

    now = datetime.now(UTC)
    doc_id = uuid.uuid4()
    version_id = uuid.uuid4()

    storage_key = storage_service.generate_storage_key(
        workspace_id=workspace_id,
        document_id=doc_id,
        version_id=version_id,
        filename=payload.originalFilename,
    )

    doc = MedicalDocument(
        id=doc_id,
        workspace_id=workspace_id,
        family_member_id=payload.memberId,
        title=payload.title,
        category=payload.category,
        document_date=payload.documentDate,
        notes=payload.notes,
        created_at=now,
        updated_at=now,
    )
    db.add(doc)

    # Initial placeholder version (is_current=False until upload completed)
    placeholder_sha = hashlib.sha256(version_id.bytes).hexdigest()
    version = DocumentVersion(
        id=version_id,
        document_id=doc_id,
        version_number=1,
        storage_bucket=get_settings().SUPABASE_STORAGE_BUCKET,
        storage_key=storage_key,
        original_filename=payload.originalFilename,
        mime_type=payload.mimeType,
        file_size_bytes=payload.fileSizeBytes,
        sha256=placeholder_sha,
        is_current=False,
        uploaded_by_user_id=user_id,
        created_at=now,
    )
    db.add(version)
    db.flush()

    upload_url = storage_service.create_signed_upload_url(storage_key)

    record_audit_event(
        db,
        action="DOCUMENT_INIT_UPLOAD",
        outcome="SUCCESS",
        actor_user_id=user_id,
        workspace_id=workspace_id,
        document_id=doc_id,
        request_id=request_id,
        metadata={"filename": payload.originalFilename, "size": payload.fileSizeBytes},
    )

    doc_data = _to_document_data(doc, version)
    return doc_data, version_id, upload_url, storage_key


def complete_document_upload(
    db: Session,
    workspace_id: uuid.UUID,
    user_id: uuid.UUID,
    document_id: uuid.UUID,
    payload: DocumentCompleteUploadRequest,
    request_id: str | None = None,
) -> DocumentData:
    """Finalize upload, set version as active/current, and enqueue background extraction."""
    doc = db.scalar(
        select(MedicalDocument).where(
            MedicalDocument.id == document_id,
            MedicalDocument.workspace_id == workspace_id,
            MedicalDocument.deleted_at.is_(None),
        )
    )
    if not doc:
        raise NotFoundError("Medical document not found.")

    version = db.scalar(
        select(DocumentVersion).where(
            DocumentVersion.id == payload.versionId,
            DocumentVersion.document_id == document_id,
        )
    )
    if not version:
        raise NotFoundError("Document version not found.")

    # Mark existing current versions as inactive
    db.execute(
        update(DocumentVersion)
        .where(
            DocumentVersion.document_id == document_id,
            DocumentVersion.id != version.id,
            DocumentVersion.is_current.is_(True),
        )
        .values(is_current=False)
    )

    version.is_current = True
    if payload.sha256:
        version.sha256 = payload.sha256

    # Queue background text/OCR extraction job
    job_key = f"extract_{version.id}"
    existing_job = db.scalar(
        select(DocumentProcessingJob).where(
            DocumentProcessingJob.idempotency_key == job_key
        )
    )
    if not existing_job:
        job = DocumentProcessingJob(
            id=uuid.uuid4(),
            document_version_id=version.id,
            job_type="extract",
            status="queued",
            attempt_count=0,
            idempotency_key=job_key,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )
        db.add(job)

    db.flush()

    record_audit_event(
        db,
        action="DOCUMENT_UPLOAD_COMPLETE",
        outcome="SUCCESS",
        actor_user_id=user_id,
        workspace_id=workspace_id,
        document_id=doc.id,
        request_id=request_id,
        metadata={"version_id": str(version.id), "sha256": version.sha256},
    )

    return _to_document_data(doc, version)


def list_documents(
    db: Session,
    workspace_id: uuid.UUID,
    member_id: uuid.UUID | None = None,
    category: str | None = None,
    search: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[DocumentData], int]:
    """List non-deleted medical documents for workspace with optional filtering."""
    query = select(MedicalDocument).where(
        MedicalDocument.workspace_id == workspace_id,
        MedicalDocument.deleted_at.is_(None),
    )

    if member_id:
        query = query.where(MedicalDocument.family_member_id == member_id)

    if category:
        query = query.where(MedicalDocument.category == category.lower().strip())

    if search:
        search_filter = f"%{search.strip()}%"
        query = query.where(
            (MedicalDocument.title.ilike(search_filter))
            | (MedicalDocument.notes.ilike(search_filter))
        )

    total_count = db.scalar(select(func.count()).select_from(query.subquery())) or 0

    docs = db.scalars(
        query.order_by(
            MedicalDocument.document_date.desc().nullslast(),
            MedicalDocument.created_at.desc(),
        )
        .offset(offset)
        .limit(limit)
    ).all()

    items: list[DocumentData] = []
    for doc in docs:
        current_version = db.scalar(
            select(DocumentVersion).where(
                DocumentVersion.document_id == doc.id,
                DocumentVersion.is_current.is_(True),
            )
        )
        items.append(_to_document_data(doc, current_version))

    return items, total_count


def get_document(
    db: Session,
    workspace_id: uuid.UUID,
    document_id: uuid.UUID,
) -> DocumentData:
    """Retrieve details for a single document."""
    doc = db.scalar(
        select(MedicalDocument).where(
            MedicalDocument.id == document_id,
            MedicalDocument.workspace_id == workspace_id,
            MedicalDocument.deleted_at.is_(None),
        )
    )
    if not doc:
        raise NotFoundError("Medical document not found.")

    current_version = db.scalar(
        select(DocumentVersion).where(
            DocumentVersion.document_id == doc.id,
            DocumentVersion.is_current.is_(True),
        )
    )

    return _to_document_data(doc, current_version)


def update_document(
    db: Session,
    workspace_id: uuid.UUID,
    document_id: uuid.UUID,
    payload: DocumentUpdateRequest,
) -> DocumentData:
    """Update document metadata."""
    doc = db.scalar(
        select(MedicalDocument).where(
            MedicalDocument.id == document_id,
            MedicalDocument.workspace_id == workspace_id,
            MedicalDocument.deleted_at.is_(None),
        )
    )
    if not doc:
        raise NotFoundError("Medical document not found.")

    if payload.familyMemberId is not None:
        member = db.scalar(
            select(FamilyMember).where(
                FamilyMember.id == payload.familyMemberId,
                FamilyMember.workspace_id == workspace_id,
                FamilyMember.deleted_at.is_(None),
            )
        )
        if not member:
            raise NotFoundError("Target family member not found in this workspace.")
        doc.family_member_id = payload.familyMemberId

    if payload.title is not None:
        doc.title = payload.title
    if payload.category is not None:
        doc.category = payload.category
    if payload.documentDate is not None:
        doc.document_date = payload.documentDate
    if payload.notes is not None:
        doc.notes = payload.notes

    doc.updated_at = datetime.now(UTC)
    db.flush()

    current_version = db.scalar(
        select(DocumentVersion).where(
            DocumentVersion.document_id == doc.id,
            DocumentVersion.is_current.is_(True),
        )
    )

    return _to_document_data(doc, current_version)


def soft_delete_document(
    db: Session,
    workspace_id: uuid.UUID,
    user_id: uuid.UUID,
    document_id: uuid.UUID,
    request_id: str | None = None,
) -> None:
    """Soft-delete medical document and revoke active share links."""
    doc = db.scalar(
        select(MedicalDocument).where(
            MedicalDocument.id == document_id,
            MedicalDocument.workspace_id == workspace_id,
            MedicalDocument.deleted_at.is_(None),
        )
    )
    if not doc:
        raise NotFoundError("Medical document not found.")

    now = datetime.now(UTC)
    doc.deleted_at = now
    doc.purge_after = now + timedelta(days=30)

    # Revoke active share links
    versions_subquery = select(DocumentVersion.id).where(
        DocumentVersion.document_id == document_id
    )
    db.execute(
        update(ShareLink)
        .where(
            ShareLink.document_version_id.in_(versions_subquery),
            ShareLink.revoked_at.is_(None),
        )
        .values(revoked_at=now)
    )

    db.flush()

    record_audit_event(
        db,
        action="DOCUMENT_DELETE",
        outcome="SUCCESS",
        actor_user_id=user_id,
        workspace_id=workspace_id,
        document_id=doc.id,
        request_id=request_id,
    )


def restore_document(
    db: Session,
    workspace_id: uuid.UUID,
    user_id: uuid.UUID,
    document_id: uuid.UUID,
    request_id: str | None = None,
) -> DocumentData:
    """Restore a soft-deleted document from trash.

    Revoked share links remain revoked (not reinstated per security policy).
    """
    doc = db.scalar(
        select(MedicalDocument).where(
            MedicalDocument.id == document_id,
            MedicalDocument.workspace_id == workspace_id,
            MedicalDocument.deleted_at.is_not(None),
        )
    )
    if not doc:
        raise NotFoundError("Medical document not found in trash.")

    doc.deleted_at = None
    doc.purge_after = None
    doc.updated_at = datetime.now(UTC)
    db.flush()

    current_version = db.scalar(
        select(DocumentVersion).where(
            DocumentVersion.document_id == doc.id,
            DocumentVersion.is_current.is_(True),
        )
    )

    record_audit_event(
        db,
        action="DOCUMENT_RESTORE",
        outcome="SUCCESS",
        actor_user_id=user_id,
        workspace_id=workspace_id,
        document_id=doc.id,
        request_id=request_id,
    )

    return _to_document_data(doc, current_version)


def list_trash_documents(
    db: Session,
    workspace_id: uuid.UUID,
) -> list[DocumentData]:
    """List all recoverable soft-deleted documents for a workspace."""
    stmt = (
        select(MedicalDocument, DocumentVersion)
        .outerjoin(
            DocumentVersion,
            (DocumentVersion.document_id == MedicalDocument.id)
            & (DocumentVersion.is_current.is_(True)),
        )
        .where(
            MedicalDocument.workspace_id == workspace_id,
            MedicalDocument.deleted_at.is_not(None),
        )
        .order_by(MedicalDocument.deleted_at.desc())
    )
    results = db.execute(stmt).all()
    return [_to_document_data(doc, version) for doc, version in results]


def permanent_delete_document(
    db: Session,
    workspace_id: uuid.UUID,
    user_id: uuid.UUID,
    document_id: uuid.UUID,
    request_id: str | None = None,
) -> None:
    """Permanently delete medical document and purge all associated storage and records."""
    doc = db.scalar(
        select(MedicalDocument).where(
            MedicalDocument.id == document_id,
            MedicalDocument.workspace_id == workspace_id,
        )
    )
    if not doc:
        raise NotFoundError("Medical document not found.")

    versions = db.scalars(
        select(DocumentVersion).where(DocumentVersion.document_id == doc.id)
    ).all()

    for v in versions:
        if v.storage_key:
            try:
                storage_service.delete_file(v.storage_key)
            except Exception:
                pass

    version_ids = [v.id for v in versions]

    # Clean up dependent models
    from app.db.models.ai_summaries import AISummary
    from app.db.models.document_extractions import DocumentExtraction
    from app.db.models.medical_measurements import MedicalMeasurement

    if version_ids:
        db.execute(
            delete(ShareLink).where(ShareLink.document_version_id.in_(version_ids))
        )
        db.execute(
            delete(DocumentExtraction).where(
                DocumentExtraction.document_version_id.in_(version_ids)
            )
        )
        db.execute(
            delete(AISummary).where(AISummary.document_version_id.in_(version_ids))
        )
        db.execute(
            delete(MedicalMeasurement).where(
                MedicalMeasurement.document_version_id.in_(version_ids)
            )
        )

    db.execute(
        delete(DocumentVersion).where(DocumentVersion.document_id == doc.id)
    )
    db.delete(doc)
    db.flush()

    record_audit_event(
        db,
        action="DOCUMENT_PERMANENT_DELETE",
        outcome="SUCCESS",
        actor_user_id=user_id,
        workspace_id=workspace_id,
        document_id=document_id,
        request_id=request_id,
    )


def get_download_url(
    db: Session,
    workspace_id: uuid.UUID,
    user_id: uuid.UUID,
    document_id: uuid.UUID,
    request_id: str | None = None,
) -> tuple[str, int, str]:
    """Generate authorized presigned download URL."""
    doc = db.scalar(
        select(MedicalDocument).where(
            MedicalDocument.id == document_id,
            MedicalDocument.workspace_id == workspace_id,
            MedicalDocument.deleted_at.is_(None),
        )
    )
    if not doc:
        raise NotFoundError("Medical document not found.")

    current_version = db.scalar(
        select(DocumentVersion).where(
            DocumentVersion.document_id == doc.id,
            DocumentVersion.is_current.is_(True),
        )
    )
    if not current_version:
        raise NotFoundError("No current uploaded version found for this document.")

    expires_in_seconds = 300  # 5 minutes
    download_url = storage_service.create_signed_download_url(
        current_version.storage_key,
        expires_in_seconds=expires_in_seconds,
    )

    record_audit_event(
        db,
        action="DOCUMENT_DOWNLOAD",
        outcome="SUCCESS",
        actor_user_id=user_id,
        workspace_id=workspace_id,
        document_id=doc.id,
        request_id=request_id,
        metadata={"version_id": str(current_version.id)},
    )

    return download_url, expires_in_seconds, current_version.original_filename
