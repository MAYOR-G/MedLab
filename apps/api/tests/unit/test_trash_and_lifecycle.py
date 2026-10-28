"""Unit tests for recoverable trash, retention lifecycle, and account deletion."""

import hashlib
import uuid
from datetime import UTC, datetime

import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.errors import ForbiddenError
from app.db.base import Base
from app.db.models import (
    DocumentProcessingJob,
    DocumentVersion,
    FamilyMember,
    FamilyWorkspace,
    MedicalDocument,
    ShareLink,
)
from app.modules.family.service import soft_delete_family_member
from app.modules.records.service import (
    list_documents,
    list_trash_documents,
    permanent_delete_document,
    restore_document,
    soft_delete_document,
)
from app.modules.sharing.schemas import CreateShareLinkRequest
from app.modules.sharing.service import create_share_link
from app.modules.users.deletion_service import request_workspace_deletion


def _valid_sha256(data: str) -> str:
    return hashlib.sha256(data.encode("utf-8")).hexdigest()


@pytest.fixture
def db_session():
    """In-memory SQLite session with all relevant models."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    from app.db.models.ai_summaries import AISummary
    from app.db.models.audit_events import AuditEvent
    from app.db.models.document_extractions import DocumentExtraction
    from app.db.models.medical_measurements import MedicalMeasurement

    tables = [
        FamilyWorkspace.__table__,
        FamilyMember.__table__,
        MedicalDocument.__table__,
        DocumentVersion.__table__,
        ShareLink.__table__,
        DocumentProcessingJob.__table__,
        AISummary.__table__,
        DocumentExtraction.__table__,
        MedicalMeasurement.__table__,
        AuditEvent.__table__,
    ]
    Base.metadata.create_all(bind=engine, tables=tables)
    TestingSession = sessionmaker(bind=engine, autoflush=False)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine, tables=tables)


@pytest.fixture
def test_setup(db_session: Session):
    owner_id = uuid.uuid4()
    workspace = FamilyWorkspace(
        id=uuid.uuid4(),
        owner_user_id=owner_id,
        name="Smith Family Vault",
        status="active",
    )
    db_session.add(workspace)

    member = FamilyMember(
        id=uuid.uuid4(),
        workspace_id=workspace.id,
        display_name="John Smith",
        relationship_label="self",
    )
    db_session.add(member)
    db_session.commit()

    return {
        "owner_id": owner_id,
        "workspace_id": workspace.id,
        "member_id": member.id,
    }


def test_soft_delete_and_trash_list(db_session: Session, test_setup: dict):
    ws_id = test_setup["workspace_id"]
    member_id = test_setup["member_id"]
    owner_id = test_setup["owner_id"]

    now = datetime.now(UTC)
    doc = MedicalDocument(
        id=uuid.uuid4(),
        workspace_id=ws_id,
        family_member_id=member_id,
        title="Complete Blood Count",
        category="lab_result",
        created_at=now,
        updated_at=now,
    )
    db_session.add(doc)

    ver = DocumentVersion(
        id=uuid.uuid4(),
        document_id=doc.id,
        version_number=1,
        storage_bucket="medlab-records",
        storage_key="test/cbc.pdf",
        original_filename="cbc.pdf",
        mime_type="application/pdf",
        file_size_bytes=1024,
        sha256=_valid_sha256("test-sha-cbc"),
        is_current=True,
        uploaded_by_user_id=owner_id,
        created_at=now,
    )
    db_session.add(ver)
    db_session.commit()

    # Active documents list returns 1
    active_docs, count = list_documents(db_session, workspace_id=ws_id)
    assert count == 1
    assert len(list_trash_documents(db_session, workspace_id=ws_id)) == 0

    # Soft delete document
    soft_delete_document(db_session, workspace_id=ws_id, user_id=owner_id, document_id=doc.id)
    db_session.commit()

    # Verify active list returns 0 and trash returns 1
    active_docs, count = list_documents(db_session, workspace_id=ws_id)
    assert count == 0

    trash_docs = list_trash_documents(db_session, workspace_id=ws_id)
    assert len(trash_docs) == 1
    assert trash_docs[0].id == doc.id
    assert trash_docs[0].deletedAt is not None
    assert trash_docs[0].purgeAfter is not None


def test_soft_delete_revokes_share_links_and_restore_keeps_them_revoked(
    db_session: Session, test_setup: dict
):
    ws_id = test_setup["workspace_id"]
    member_id = test_setup["member_id"]
    owner_id = test_setup["owner_id"]

    now = datetime.now(UTC)
    doc = MedicalDocument(
        id=uuid.uuid4(),
        workspace_id=ws_id,
        family_member_id=member_id,
        title="Thyroid Panel",
        category="lab_result",
        created_at=now,
        updated_at=now,
    )
    db_session.add(doc)

    ver = DocumentVersion(
        id=uuid.uuid4(),
        document_id=doc.id,
        version_number=1,
        storage_bucket="medlab-records",
        storage_key="test/tsh.pdf",
        original_filename="tsh.pdf",
        mime_type="application/pdf",
        file_size_bytes=1024,
        sha256=_valid_sha256("test-sha-tsh"),
        is_current=True,
        uploaded_by_user_id=owner_id,
        created_at=now,
    )
    db_session.add(ver)
    db_session.commit()

    # Create share link
    share_res = create_share_link(
        db_session,
        document_id=doc.id,
        user_id=owner_id,
        workspace_id=ws_id,
        req=CreateShareLinkRequest(
            expiresInHours=24,
            includeOriginal=True,
            includeSummary=True,
        ),
    )
    db_session.commit()

    # Verify share link is active
    share = db_session.scalar(select(ShareLink).where(ShareLink.id == share_res.id))
    assert share.revoked_at is None

    # Soft delete document
    soft_delete_document(db_session, workspace_id=ws_id, user_id=owner_id, document_id=doc.id)
    db_session.commit()

    # Verify share link was immediately revoked
    db_session.refresh(share)
    assert share.revoked_at is not None

    # Now restore document
    restored = restore_document(db_session, workspace_id=ws_id, user_id=owner_id, document_id=doc.id)
    db_session.commit()

    assert restored.id == doc.id
    assert restored.deletedAt is None

    # Security check: share link MUST remain revoked per DATABASE.md Section 5
    db_session.refresh(share)
    assert share.revoked_at is not None


def test_permanent_delete_document(db_session: Session, test_setup: dict):
    ws_id = test_setup["workspace_id"]
    member_id = test_setup["member_id"]
    owner_id = test_setup["owner_id"]

    now = datetime.now(UTC)
    doc = MedicalDocument(
        id=uuid.uuid4(),
        workspace_id=ws_id,
        family_member_id=member_id,
        title="Old ECG",
        category="clinical_report",
        created_at=now,
        updated_at=now,
    )
    db_session.add(doc)

    ver = DocumentVersion(
        id=uuid.uuid4(),
        document_id=doc.id,
        version_number=1,
        storage_bucket="medlab-records",
        storage_key="test/ecg.pdf",
        original_filename="ecg.pdf",
        mime_type="application/pdf",
        file_size_bytes=1024,
        sha256=_valid_sha256("test-sha-ecg"),
        is_current=True,
        uploaded_by_user_id=owner_id,
        created_at=now,
    )
    db_session.add(ver)
    db_session.commit()

    # Permanently delete
    permanent_delete_document(
        db_session, workspace_id=ws_id, user_id=owner_id, document_id=doc.id
    )
    db_session.commit()

    # Document and version must not exist
    assert db_session.scalar(select(MedicalDocument).where(MedicalDocument.id == doc.id)) is None
    assert db_session.scalar(select(DocumentVersion).where(DocumentVersion.id == ver.id)) is None


def test_cascade_soft_delete_family_member(db_session: Session, test_setup: dict):
    ws_id = test_setup["workspace_id"]
    member_id = test_setup["member_id"]
    owner_id = test_setup["owner_id"]

    now = datetime.now(UTC)
    doc = MedicalDocument(
        id=uuid.uuid4(),
        workspace_id=ws_id,
        family_member_id=member_id,
        title="Member Report",
        category="clinical_report",
        created_at=now,
        updated_at=now,
    )
    db_session.add(doc)

    ver = DocumentVersion(
        id=uuid.uuid4(),
        document_id=doc.id,
        version_number=1,
        storage_bucket="medlab-records",
        storage_key="test/report.pdf",
        original_filename="report.pdf",
        mime_type="application/pdf",
        file_size_bytes=1024,
        sha256=_valid_sha256("test-sha-rep"),
        is_current=True,
        uploaded_by_user_id=owner_id,
        created_at=now,
    )
    db_session.add(ver)
    db_session.commit()

    share = create_share_link(
        db_session,
        document_id=doc.id,
        user_id=owner_id,
        workspace_id=ws_id,
        req=CreateShareLinkRequest(
            expiresInHours=24,
            includeOriginal=True,
            includeSummary=True,
        ),
    )
    db_session.commit()

    # Soft-delete family member
    soft_delete_family_member(db_session, workspace_id=ws_id, member_id=member_id)
    db_session.commit()

    # Check member is soft-deleted
    member = db_session.scalar(select(FamilyMember).where(FamilyMember.id == member_id))
    assert member.deleted_at is not None
    assert member.purge_after is not None

    # Check document is soft-deleted
    db_session.refresh(doc)
    assert doc.deleted_at is not None
    assert doc.purge_after is not None

    # Check share is revoked
    share_row = db_session.scalar(select(ShareLink).where(ShareLink.id == share.id))
    assert share_row.revoked_at is not None


def test_workspace_deletion_workflow(db_session: Session, test_setup: dict):
    ws_id = test_setup["workspace_id"]
    owner_id = test_setup["owner_id"]

    # Wrong confirmation throws ForbiddenError
    with pytest.raises(ForbiddenError):
        request_workspace_deletion(
            db_session,
            user_id=owner_id,
            workspace_id=ws_id,
            confirmation="WRONG_NAME",
        )

    # Correct confirmation succeeds
    res = request_workspace_deletion(
        db_session,
        user_id=owner_id,
        workspace_id=ws_id,
        confirmation="Smith Family Vault",
    )
    db_session.commit()

    assert res.status == "pending_deletion"

    workspace = db_session.scalar(select(FamilyWorkspace).where(FamilyWorkspace.id == ws_id))
    assert workspace.status == "pending_deletion"
