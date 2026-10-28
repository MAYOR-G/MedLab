"""Business service for secure expiring share links and public recipient viewer."""

import hashlib
import secrets
import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import desc, select
from sqlalchemy.orm import Session, joinedload

from app.core.config import get_settings
from app.core.errors import NotFoundError
from app.db.models.ai_summaries import AISummary
from app.db.models.document_versions import DocumentVersion
from app.db.models.documents import MedicalDocument
from app.db.models.share_links import ShareLink
from app.integrations.supabase.storage import storage_service
from app.modules.assistant.prompts import MANDATORY_DISCLAIMER
from app.modules.sharing.schemas import (
    CreateShareLinkRequest,
    PublicShareDocumentResponse,
    PublicShareSummary,
    ShareLinkCreatedResponse,
    ShareLinkItem,
    ShareLinkListResponse,
)
from app.services.audit_service import record_audit_event

settings = get_settings()


def _hash_token(token: str) -> str:
    """Compute deterministic SHA-256 hash of token."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _is_expired(expires_at: datetime) -> bool:
    """Safe check for expiration across offset-aware and offset-naive datetimes."""
    if expires_at.tzinfo is None:
        return expires_at <= datetime.now(UTC).replace(tzinfo=None)
    return expires_at <= datetime.now(UTC)


def create_share_link(
    db: Session,
    document_id: uuid.UUID,
    user_id: uuid.UUID,
    workspace_id: uuid.UUID,
    req: CreateShareLinkRequest,
    web_base_url: str | None = None,
) -> ShareLinkCreatedResponse:
    """Generate high-entropy token and persist revocable share link."""
    doc = db.execute(
        select(MedicalDocument).where(
            MedicalDocument.id == document_id,
            MedicalDocument.workspace_id == workspace_id,
            MedicalDocument.deleted_at.is_(None),
        )
    ).scalar_one_or_none()

    if not doc:
        raise NotFoundError(message="Medical document not found in your workspace.")

    current_version = db.execute(
        select(DocumentVersion).where(
            DocumentVersion.document_id == document_id,
            DocumentVersion.is_current.is_(True),
        )
    ).scalar_one_or_none()

    if not current_version:
        raise NotFoundError(message="Current document version not found.")

    raw_token = secrets.token_urlsafe(32)
    token_hash = _hash_token(raw_token)

    now = datetime.now(UTC)
    expires_at = now + timedelta(hours=req.expires_in_hours)

    link = ShareLink(
        document_version_id=current_version.id,
        created_by_user_id=user_id,
        token_hash=token_hash,
        include_original=req.include_original,
        include_summary=req.include_summary,
        expires_at=expires_at,
        created_at=now,
    )
    db.add(link)
    db.commit()
    db.refresh(link)

    base = (web_base_url or settings.FRONTEND_ORIGINS.split(",")[0]).rstrip("/")
    share_url = f"{base}/share/{raw_token}"

    record_audit_event(
        db=db,
        action="create_share_link",
        outcome="success",
        actor_user_id=user_id,
        workspace_id=workspace_id,
        document_id=doc.id,
        share_link_id=link.id,
        metadata={
            "expires_at": expires_at.isoformat(),
            "include_original": req.include_original,
            "include_summary": req.include_summary,
        },
    )

    return ShareLinkCreatedResponse(
        id=link.id,
        documentId=doc.id,
        documentTitle=doc.title,
        token=raw_token,
        shareUrl=share_url,
        expiresAt=link.expires_at,
        includeOriginal=link.include_original,
        includeSummary=link.include_summary,
        createdAt=link.created_at,
    )


def revoke_share_link(
    db: Session,
    share_link_id: uuid.UUID,
    user_id: uuid.UUID,
    workspace_id: uuid.UUID,
) -> ShareLinkItem:
    """Revoke an active share link immediately."""
    stmt = (
        select(ShareLink, DocumentVersion, MedicalDocument)
        .join(DocumentVersion, ShareLink.document_version_id == DocumentVersion.id)
        .join(MedicalDocument, DocumentVersion.document_id == MedicalDocument.id)
        .where(
            ShareLink.id == share_link_id,
            MedicalDocument.workspace_id == workspace_id,
        )
    )
    result = db.execute(stmt).first()

    if not result:
        raise NotFoundError(message="Share link not found in your workspace.")

    link, version, doc = result
    link.revoked_at = datetime.now(UTC)
    db.commit()
    db.refresh(link)

    record_audit_event(
        db=db,
        action="revoke_share_link",
        outcome="success",
        actor_user_id=user_id,
        workspace_id=workspace_id,
        document_id=doc.id,
        share_link_id=link.id,
    )

    return ShareLinkItem(
        id=link.id,
        documentId=doc.id,
        documentTitle=doc.title,
        versionNumber=version.version_number,
        expiresAt=link.expires_at,
        revokedAt=link.revoked_at,
        isExpired=_is_expired(link.expires_at),
        isRevoked=link.revoked_at is not None,
        includeOriginal=link.include_original,
        includeSummary=link.include_summary,
        createdAt=link.created_at,
    )


def list_document_shares(
    db: Session,
    document_id: uuid.UUID,
    workspace_id: uuid.UUID,
) -> ShareLinkListResponse:
    """List all share links generated for a specific document."""
    stmt = (
        select(ShareLink, DocumentVersion, MedicalDocument)
        .join(DocumentVersion, ShareLink.document_version_id == DocumentVersion.id)
        .join(MedicalDocument, DocumentVersion.document_id == MedicalDocument.id)
        .where(
            MedicalDocument.id == document_id,
            MedicalDocument.workspace_id == workspace_id,
            MedicalDocument.deleted_at.is_(None),
        )
        .order_by(desc(ShareLink.created_at))
    )
    rows = db.execute(stmt).all()

    items: list[ShareLinkItem] = []
    for link, version, doc in rows:
        items.append(
            ShareLinkItem(
                id=link.id,
                documentId=doc.id,
                documentTitle=doc.title,
                versionNumber=version.version_number,
                expiresAt=link.expires_at,
                revokedAt=link.revoked_at,
                isExpired=_is_expired(link.expires_at),
                isRevoked=link.revoked_at is not None,
                includeOriginal=link.include_original,
                includeSummary=link.include_summary,
                createdAt=link.created_at,
            )
        )

    return ShareLinkListResponse(items=items, total=len(items))


def list_workspace_shares(
    db: Session,
    workspace_id: uuid.UUID,
) -> ShareLinkListResponse:
    """List all active and recent share links across the entire workspace."""
    stmt = (
        select(ShareLink, DocumentVersion, MedicalDocument)
        .join(DocumentVersion, ShareLink.document_version_id == DocumentVersion.id)
        .join(MedicalDocument, DocumentVersion.document_id == MedicalDocument.id)
        .where(
            MedicalDocument.workspace_id == workspace_id,
            MedicalDocument.deleted_at.is_(None),
        )
        .order_by(desc(ShareLink.created_at))
    )
    rows = db.execute(stmt).all()

    items: list[ShareLinkItem] = []
    for link, version, doc in rows:
        items.append(
            ShareLinkItem(
                id=link.id,
                documentId=doc.id,
                documentTitle=doc.title,
                versionNumber=version.version_number,
                expiresAt=link.expires_at,
                revokedAt=link.revoked_at,
                isExpired=_is_expired(link.expires_at),
                isRevoked=link.revoked_at is not None,
                includeOriginal=link.include_original,
                includeSummary=link.include_summary,
                createdAt=link.created_at,
            )
        )

    return ShareLinkListResponse(items=items, total=len(items))


def access_public_share(
    db: Session,
    token: str,
) -> PublicShareDocumentResponse:
    """Validate bearer token and resolve shared document content for recipient."""
    token_hash = _hash_token(token)

    stmt = (
        select(ShareLink)
        .options(
            joinedload(ShareLink.version).joinedload(DocumentVersion.document)
        )
        .where(ShareLink.token_hash == token_hash)
    )
    link = db.execute(stmt).scalar_one_or_none()

    if not link:
        raise NotFoundError(message="Share link does not exist or is invalid.")

    if link.revoked_at is not None:
        raise NotFoundError(message="This share link has been revoked by the owner.")

    if _is_expired(link.expires_at):
        raise NotFoundError(message="This share link has expired.")

    version = link.version
    if not version or not version.document or version.document.deleted_at is not None:
        raise NotFoundError(message="The shared medical document is no longer available.")

    doc = version.document

    # Generate short-lived signed download URL if original file is included
    download_url: str | None = None
    if link.include_original:
        try:
            download_url = storage_service.create_signed_download_url(
                version.storage_key,
                expires_in=900,  # 15 minutes
            )
        except Exception:
            download_url = None

    # Load approved AI summary if summary is included
    summary_payload: PublicShareSummary | None = None
    if link.include_summary:
        summary_rec = db.execute(
            select(AISummary)
            .where(
                AISummary.document_version_id == version.id,
                AISummary.status == "succeeded",
            )
            .order_by(desc(AISummary.created_at))
        ).scalar_one_or_none()

        if summary_rec and summary_rec.summary_text:
            citations = summary_rec.source_reference_metadata.get("citations", [])
            summary_payload = PublicShareSummary(
                summaryText=summary_rec.summary_text,
                citations=citations,
                createdAt=summary_rec.created_at,
            )

    # Log public access audit event
    record_audit_event(
        db=db,
        action="public_share_accessed",
        outcome="success",
        workspace_id=doc.workspace_id,
        document_id=doc.id,
        share_link_id=link.id,
    )

    return PublicShareDocumentResponse(
        title=doc.title,
        category=doc.category,
        documentDate=str(doc.document_date) if doc.document_date else None,
        notes=doc.notes,
        originalFilename=version.original_filename if link.include_original else None,
        fileSizeBytes=version.file_size_bytes if link.include_original else None,
        includeOriginal=link.include_original,
        includeSummary=link.include_summary,
        expiresAt=link.expires_at,
        downloadUrl=download_url,
        summary=summary_payload,
        disclaimer=MANDATORY_DISCLAIMER,
    )
