"""Unit tests for Document schemas and upload workflow."""

import uuid
from datetime import UTC, date, datetime
from unittest.mock import MagicMock, patch

import pytest
from pydantic import ValidationError

from app.db.models import FamilyMember, MedicalDocument
from app.modules.records.schemas import (
    DocumentInitRequest,
    DocumentUpdateRequest,
)
from app.modules.records.service import (
    get_download_url,
    init_document_upload,
)


def test_document_init_schema_validation() -> None:
    """Verify document initialization request validation."""
    member_id = uuid.uuid4()
    req = DocumentInitRequest(
        memberId=member_id,
        title="Comprehensive Metabolic Panel",
        category="lab_result",
        originalFilename="cmp_test.pdf",
        mimeType="application/pdf",
        fileSizeBytes=1024 * 1024,
        documentDate=date(2025, 3, 1),
        notes="Fasting blood work",
    )
    assert req.title == "Comprehensive Metabolic Panel"
    assert req.category == "lab_result"
    assert req.mimeType == "application/pdf"
    assert req.fileSizeBytes == 1048576

    # Disallowed MIME type should fail
    with pytest.raises(ValidationError):
        DocumentInitRequest(
            memberId=member_id,
            title="Malware",
            category="lab_result",
            originalFilename="run.exe",
            mimeType="application/x-msdownload",
            fileSizeBytes=100,
        )

    # File size exceeding 25MB should fail
    with pytest.raises(ValidationError):
        DocumentInitRequest(
            memberId=member_id,
            title="Big File",
            category="lab_result",
            originalFilename="scan.pdf",
            mimeType="application/pdf",
            fileSizeBytes=30 * 1024 * 1024,
        )


def test_document_update_schema() -> None:
    """Verify document update schema."""
    req = DocumentUpdateRequest(
        title="Updated Title",
        category="prescription",
    )
    assert req.title == "Updated Title"
    assert req.category == "prescription"

    # Invalid category should fail
    with pytest.raises(ValidationError):
        DocumentUpdateRequest(category="invalid_category")


@patch("app.modules.records.service.storage_service")
def test_init_document_upload(mock_storage: MagicMock) -> None:
    """Verify init_document_upload creates document, version, and signed URL."""
    mock_storage.generate_storage_key.return_value = "workspace/doc/ver/file.pdf"
    mock_storage.create_signed_upload_url.return_value = (
        "https://storage.mock/upload?token=abc"
    )

    mock_db = MagicMock()
    workspace_id = uuid.uuid4()
    user_id = uuid.uuid4()
    member_id = uuid.uuid4()

    member = FamilyMember(
        id=member_id,
        workspace_id=workspace_id,
        display_name="Leo Jenkins",
        relationship_label="child",
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )
    mock_db.scalar.return_value = member

    payload = DocumentInitRequest(
        memberId=member_id,
        title="Blood Test",
        category="lab_result",
        originalFilename="blood.pdf",
        mimeType="application/pdf",
        fileSizeBytes=5000,
    )

    doc_data, version_id, upload_url, key = init_document_upload(
        mock_db,
        workspace_id=workspace_id,
        user_id=user_id,
        payload=payload,
    )

    assert doc_data.title == "Blood Test"
    assert upload_url == "https://storage.mock/upload?token=abc"
    assert key == "workspace/doc/ver/file.pdf"
    assert mock_db.add.call_count == 3  # doc, version, audit event
    mock_db.flush.assert_called()


@patch("app.modules.records.service.storage_service")
def test_get_download_url(mock_storage: MagicMock) -> None:
    """Verify get_download_url returns presigned URL and records audit event."""
    mock_storage.create_signed_download_url.return_value = (
        "https://storage.mock/download?token=xyz"
    )

    mock_db = MagicMock()
    workspace_id = uuid.uuid4()
    user_id = uuid.uuid4()
    doc_id = uuid.uuid4()
    now = datetime.now(UTC)

    doc = MedicalDocument(
        id=doc_id,
        workspace_id=workspace_id,
        family_member_id=uuid.uuid4(),
        title="MRI Scan",
        category="imaging",
        created_at=now,
        updated_at=now,
    )
    version = MagicMock()
    version.id = uuid.uuid4()
    version.storage_key = "path/mri.jpg"
    version.original_filename = "mri.jpg"

    # First scalar call returns doc, second returns current_version
    mock_db.scalar.side_effect = [doc, version]

    download_url, expires_in, filename = get_download_url(
        mock_db,
        workspace_id=workspace_id,
        user_id=user_id,
        document_id=doc_id,
    )

    assert download_url == "https://storage.mock/download?token=xyz"
    assert expires_in == 300
    assert filename == "mri.jpg"
    mock_db.flush.assert_called()
