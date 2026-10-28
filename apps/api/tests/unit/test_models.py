"""Unit tests for SQLAlchemy models and metadata."""

import uuid
from datetime import UTC, date, datetime
from decimal import Decimal

from app.db.base import Base
from app.db.models import (
    DocumentVersion,
    FamilyMember,
    FamilyWorkspace,
    MedicalDocument,
    MedicalMeasurement,
    ShareLink,
    UserProfile,
)


def test_models_metadata_registered() -> None:
    """Verify all 11 application tables are registered in Base metadata."""
    tables = Base.metadata.tables.keys()
    expected_tables = {
        "user_profiles",
        "family_workspaces",
        "family_members",
        "medical_documents",
        "document_versions",
        "document_processing_jobs",
        "document_extractions",
        "ai_summaries",
        "medical_measurements",
        "share_links",
        "audit_events",
    }
    assert expected_tables.issubset(tables)


def test_model_instantiations() -> None:
    """Verify models can be cleanly instantiated."""
    user_id = uuid.uuid4()
    workspace_id = uuid.uuid4()
    member_id = uuid.uuid4()
    doc_id = uuid.uuid4()
    version_id = uuid.uuid4()

    profile = UserProfile(user_id=user_id, display_name="Test User")
    assert profile.user_id == user_id

    workspace = FamilyWorkspace(
        id=workspace_id, owner_user_id=user_id, name="Test Vault"
    )
    assert workspace.name == "Test Vault"

    member = FamilyMember(
        id=member_id,
        workspace_id=workspace_id,
        display_name="Child One",
        relationship_label="child",
        date_of_birth=date(2018, 5, 10),
    )
    assert member.relationship_label == "child"

    doc = MedicalDocument(
        id=doc_id,
        workspace_id=workspace_id,
        family_member_id=member_id,
        title="Routine Lab",
        category="lab_result",
    )
    assert doc.category == "lab_result"

    version = DocumentVersion(
        id=version_id,
        document_id=doc_id,
        version_number=1,
        storage_bucket="medical-documents",
        storage_key="test-key",
        original_filename="lab.pdf",
        mime_type="application/pdf",
        file_size_bytes=1024,
        sha256="a" * 64,
        is_current=True,
        uploaded_by_user_id=user_id,
    )
    assert version.is_current is True

    measurement = MedicalMeasurement(
        document_version_id=version_id,
        test_name="Glucose",
        normalized_test_key="glucose_fasting",
        value_numeric=Decimal("95.5"),
        unit="mg/dL",
    )
    assert measurement.value_numeric == Decimal("95.5")

    share = ShareLink(
        document_version_id=version_id,
        created_by_user_id=user_id,
        token_hash="b" * 64,
        include_original=True,
        include_summary=False,
        expires_at=datetime.now(UTC),
    )
    assert share.include_original is True
