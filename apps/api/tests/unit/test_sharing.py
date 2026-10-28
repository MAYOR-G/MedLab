"""Unit tests for secure document sharing, token hashing, revocation, and public viewer."""

import hashlib
import uuid
from datetime import date
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.security import AuthenticatedUser
from app.db.base import Base
from app.db.models.document_versions import DocumentVersion
from app.db.models.documents import MedicalDocument
from app.db.models.family_members import FamilyMember
from app.db.models.share_links import ShareLink
from app.db.models.workspaces import FamilyWorkspace
from app.dependencies.auth import get_current_user
from app.dependencies.database import get_db
from app.main import app
from app.modules.sharing.schemas import CreateShareLinkRequest
from app.modules.sharing.service import (
    access_public_share,
    create_share_link,
    revoke_share_link,
)


@pytest.fixture
def sharing_db():
    """In-memory SQLite session with sharing tables."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    from app.db.models.ai_summaries import AISummary

    tables = [
        FamilyWorkspace.__table__,
        FamilyMember.__table__,
        MedicalDocument.__table__,
        DocumentVersion.__table__,
        ShareLink.__table__,
        AISummary.__table__,
    ]
    Base.metadata.create_all(bind=engine, tables=tables)
    TestingSession = sessionmaker(bind=engine, autoflush=False)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine, tables=tables)


def test_share_link_creation_and_access(sharing_db: Session):
    """Verify share link creation, high entropy token hashing, and public access."""
    user_id = uuid.uuid4()
    workspace = FamilyWorkspace(name="Share Test Vault", owner_user_id=user_id)
    sharing_db.add(workspace)
    sharing_db.flush()

    member = FamilyMember(
        workspace_id=workspace.id,
        display_name="David Doe",
        relationship_label="self",
    )
    sharing_db.add(member)
    sharing_db.flush()

    doc = MedicalDocument(
        workspace_id=workspace.id,
        family_member_id=member.id,
        title="Thyroid Panel 2026",
        category="lab_result",
        document_date=date(2026, 4, 15),
        notes="Routine checkup",
    )
    sharing_db.add(doc)
    sharing_db.flush()

    version = DocumentVersion(
        document_id=doc.id,
        version_number=1,
        storage_bucket="medical-documents",
        storage_key=f"ws/{workspace.id}/thyroid.pdf",
        original_filename="thyroid_test.pdf",
        mime_type="application/pdf",
        file_size_bytes=4096,
        sha256="c" * 64,
        uploaded_by_user_id=user_id,
    )
    sharing_db.add(version)
    sharing_db.flush()

    req = CreateShareLinkRequest(
        expiresInHours=48,
        includeOriginal=True,
        includeSummary=True,
    )

    with patch("app.modules.sharing.service.record_audit_event"):
        created = create_share_link(
            db=sharing_db,
            document_id=doc.id,
            user_id=user_id,
            workspace_id=workspace.id,
            req=req,
            web_base_url="https://app.medlab.test",
        )

    assert created.token
    assert len(created.token) >= 32
    assert "https://app.medlab.test/share/" in created.share_url

    # Verify token is stored only as SHA-256 hash in DB
    db_link = sharing_db.query(ShareLink).filter(ShareLink.id == created.id).first()
    assert db_link is not None
    assert db_link.token_hash == hashlib.sha256(created.token.encode()).hexdigest()
    assert db_link.token_hash != created.token

    # Public Access
    with patch("app.modules.sharing.service.record_audit_event"):
        public_doc = access_public_share(sharing_db, token=created.token)

    assert public_doc.title == "Thyroid Panel 2026"
    assert public_doc.category == "lab_result"
    assert public_doc.original_filename == "thyroid_test.pdf"
    assert public_doc.include_original is True
    assert "educational purposes" in public_doc.disclaimer

    # Test Revocation
    with patch("app.modules.sharing.service.record_audit_event"):
        revoked = revoke_share_link(
            db=sharing_db,
            share_link_id=created.id,
            user_id=user_id,
            workspace_id=workspace.id,
        )
    assert revoked.is_revoked is True
    assert revoked.revoked_at is not None

    # Revoked link access should fail
    with pytest.raises(Exception) as exc_info:
        access_public_share(sharing_db, token=created.token)
    assert "revoked" in str(exc_info.value).lower()


def test_sharing_api_endpoints(sharing_db: Session):
    """Verify HTTP API endpoints for creating, listing, revoking, and public retrieval."""
    user_id = uuid.uuid4()
    workspace = FamilyWorkspace(name="API Share Vault", owner_user_id=user_id)
    sharing_db.add(workspace)
    sharing_db.flush()

    member = FamilyMember(
        workspace_id=workspace.id,
        display_name="Sarah Doe",
        relationship_label="self",
    )
    sharing_db.add(member)
    sharing_db.flush()

    doc = MedicalDocument(
        workspace_id=workspace.id,
        family_member_id=member.id,
        title="CBC Bloodwork",
        category="lab_result",
    )
    sharing_db.add(doc)
    sharing_db.flush()

    version = DocumentVersion(
        document_id=doc.id,
        version_number=1,
        storage_bucket="medical-documents",
        storage_key=f"ws/{workspace.id}/cbc.pdf",
        original_filename="cbc.pdf",
        mime_type="application/pdf",
        file_size_bytes=2048,
        sha256="d" * 64,
        uploaded_by_user_id=user_id,
    )
    sharing_db.add(version)
    sharing_db.flush()

    app.dependency_overrides[get_db] = lambda: sharing_db
    app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
        user_id=user_id, email="sarah@example.com"
    )

    client = TestClient(app)
    try:
        with patch("app.modules.sharing.service.record_audit_event"):
            # 1. Create share link
            res_create = client.post(
                f"/api/v1/documents/{doc.id}/shares",
                json={
                    "expiresInHours": 24,
                    "includeOriginal": True,
                    "includeSummary": True,
                },
            )
            assert res_create.status_code == 201
            created_data = res_create.json()
            share_token = created_data["token"]
            share_id = created_data["id"]

            # 2. List document shares
            res_list = client.get(f"/api/v1/documents/{doc.id}/shares")
            assert res_list.status_code == 200
            assert res_list.json()["total"] == 1

            # 3. List workspace shares
            res_ws = client.get("/api/v1/shares")
            assert res_ws.status_code == 200
            assert res_ws.json()["total"] == 1

            # 4. Public access endpoint (unauthenticated)
            res_pub = client.get(f"/api/v1/public/shares/{share_token}")
            assert res_pub.status_code == 200
            pub_data = res_pub.json()
            assert pub_data["title"] == "CBC Bloodwork"
            assert "disclaimer" in pub_data

            # 5. Revoke share link
            res_revoke = client.delete(f"/api/v1/shares/{share_id}")
            assert res_revoke.status_code == 200
            assert res_revoke.json()["isRevoked"] is True

            # 6. Verify public access is blocked after revocation
            res_blocked = client.get(f"/api/v1/public/shares/{share_token}")
            assert res_blocked.status_code in (404, 410)
    finally:
        app.dependency_overrides.clear()
