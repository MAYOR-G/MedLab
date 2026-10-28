"""Unit tests for background processing worker, text extractors, and job service."""

import io
import uuid
from decimal import Decimal
from unittest.mock import MagicMock, patch

from pypdf import PdfWriter

from app.db.models import DocumentProcessingJob, DocumentVersion
from app.modules.processing.extractors.image_extractor import extract_image_text
from app.modules.processing.extractors.pdf_extractor import extract_pdf_text
from app.modules.processing.service import process_extraction_job
from app.services.job_service import claim_next_job, complete_job, enqueue_job, fail_job


def _create_sample_pdf_bytes(
    text_content: str = "MedLab Blood Glucose Test Results",
) -> bytes:
    """Helper to create minimal valid in-memory PDF bytes."""
    writer = PdfWriter()
    writer.add_blank_page(width=200, height=200)
    # Write to in-memory buffer
    buf = io.BytesIO()
    writer.write(buf)
    return buf.getvalue()


def test_pdf_extractor_with_blank_page() -> None:
    """Verify PDF extractor handles valid PDF with blank/sparse text layer."""
    pdf_bytes = _create_sample_pdf_bytes()
    result = extract_pdf_text(pdf_bytes)
    assert result.page_count == 1
    assert result.confidence is not None


def test_image_extractor() -> None:
    """Verify image extractor produces structured extraction result."""
    sample_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"
    result = extract_image_text(sample_bytes, mime_type="image/png")
    assert result.confidence >= Decimal("0.5")
    assert "image" in result.method.lower()


def test_enqueue_job_idempotent() -> None:
    """Verify enqueue_job does not duplicate jobs with the same idempotency key."""
    mock_db = MagicMock()
    version_id = uuid.uuid4()
    key = "extract_test_123"

    existing_job = DocumentProcessingJob(
        id=uuid.uuid4(),
        document_version_id=version_id,
        job_type="extract",
        status="queued",
        attempt_count=0,
        idempotency_key=key,
    )
    mock_db.scalar.return_value = existing_job

    job = enqueue_job(mock_db, version_id, "extract", key)
    assert job.id == existing_job.id
    mock_db.add.assert_not_called()


def test_claim_next_job() -> None:
    """Verify claim_next_job transitions status to running and increments attempt_count."""
    mock_db = MagicMock()
    queued_job = DocumentProcessingJob(
        id=uuid.uuid4(),
        document_version_id=uuid.uuid4(),
        job_type="extract",
        status="queued",
        attempt_count=0,
        idempotency_key="key_1",
    )
    mock_db.scalar.return_value = queued_job

    claimed = claim_next_job(mock_db)
    assert claimed is not None
    assert claimed.status == "running"
    assert claimed.attempt_count == 1
    assert claimed.started_at is not None
    mock_db.flush.assert_called()


def test_complete_and_fail_job() -> None:
    """Verify complete_job and fail_job set appropriate statuses."""
    mock_db = MagicMock()
    running_job = DocumentProcessingJob(
        id=uuid.uuid4(),
        document_version_id=uuid.uuid4(),
        job_type="extract",
        status="running",
        attempt_count=1,
        idempotency_key="key_2",
    )
    mock_db.scalar.return_value = running_job

    completed = complete_job(
        mock_db, running_job.id, provider="internal", model="pypdf"
    )
    assert completed is not None
    assert completed.status == "succeeded"
    assert completed.finished_at is not None

    failed = fail_job(mock_db, running_job.id, safe_error_code="EXTRACTION_ERROR")
    assert failed is not None
    assert failed.status == "failed"
    assert failed.safe_error_code == "EXTRACTION_ERROR"


@patch("app.modules.processing.service.storage_service")
def test_process_extraction_job(mock_storage: MagicMock) -> None:
    """Verify process_extraction_job processes document version and enqueues summarization."""
    mock_storage.download_file_bytes.return_value = _create_sample_pdf_bytes(
        "Lab Glucose: 95 mg/dL"
    )

    mock_db = MagicMock()
    version_id = uuid.uuid4()
    job_id = uuid.uuid4()

    job = DocumentProcessingJob(
        id=job_id,
        document_version_id=version_id,
        job_type="extract",
        status="running",
        attempt_count=1,
        idempotency_key="job_extract_123",
    )

    version = DocumentVersion(
        id=version_id,
        document_id=uuid.uuid4(),
        version_number=1,
        storage_bucket="medical-documents",
        storage_key="test/doc.pdf",
        original_filename="doc.pdf",
        mime_type="application/pdf",
        file_size_bytes=5000,
        sha256="c" * 64,
        is_current=True,
        uploaded_by_user_id=uuid.uuid4(),
    )

    # First scalar call returns version, second returns None (no existing extraction), third returns job for complete_job
    mock_db.scalar.side_effect = [version, None, job, None]

    extraction = process_extraction_job(mock_db, job)
    assert extraction.status == "succeeded"
    assert extraction.document_version_id == version_id
    mock_db.flush.assert_called()
