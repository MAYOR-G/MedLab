"""Durable asynchronous job queue service backed by PostgreSQL."""

import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.db.models import DocumentProcessingJob

logger = get_logger("services.job_service")


def enqueue_job(
    db: Session,
    document_version_id: uuid.UUID,
    job_type: str,
    idempotency_key: str,
) -> DocumentProcessingJob:
    """Idempotently enqueue a processing job."""
    existing = db.scalar(
        select(DocumentProcessingJob).where(
            DocumentProcessingJob.idempotency_key == idempotency_key
        )
    )
    if existing:
        return existing

    now = datetime.now(UTC)
    job = DocumentProcessingJob(
        id=uuid.uuid4(),
        document_version_id=document_version_id,
        job_type=job_type,
        status="queued",
        attempt_count=0,
        idempotency_key=idempotency_key,
        created_at=now,
        updated_at=now,
    )
    db.add(job)
    db.flush()
    return job


def claim_next_job(
    db: Session,
    worker_heartbeat_timeout_seconds: int = 120,
) -> DocumentProcessingJob | None:
    """Atomically fetch and claim the next available job.

    Uses SELECT ... FOR UPDATE SKIP LOCKED to prevent duplicate processing.
    Also reclaims orphaned jobs whose worker died mid-run.
    """
    now = datetime.now(UTC)
    stale_threshold = now - timedelta(seconds=worker_heartbeat_timeout_seconds)

    # Base query for queued or orphaned jobs
    stmt = (
        select(DocumentProcessingJob)
        .where(
            (DocumentProcessingJob.status == "queued")
            | (
                (DocumentProcessingJob.status == "running")
                & (DocumentProcessingJob.started_at < stale_threshold)
            )
        )
        .order_by(DocumentProcessingJob.created_at.asc())
        .limit(1)
    )

    # Attempt FOR UPDATE SKIP LOCKED (PostgreSQL)
    try:
        stmt = stmt.with_for_update(skip_locked=True)
        job = db.scalar(stmt)
    except Exception:
        # Fallback for dialects without skip_locked (SQLite unit tests)
        job = db.scalar(stmt)

    if not job:
        return None

    job.status = "running"
    job.started_at = now
    job.attempt_count += 1
    job.updated_at = now
    db.flush()
    return job


def complete_job(
    db: Session,
    job_id: uuid.UUID,
    provider: str | None = None,
    model: str | None = None,
) -> DocumentProcessingJob | None:
    """Mark job as successfully finished."""
    job = db.scalar(
        select(DocumentProcessingJob).where(DocumentProcessingJob.id == job_id)
    )
    if not job:
        return None

    now = datetime.now(UTC)
    job.status = "succeeded"
    job.finished_at = now
    job.updated_at = now
    if provider:
        job.provider = provider
    if model:
        job.model = model

    db.flush()
    return job


def fail_job(
    db: Session,
    job_id: uuid.UUID,
    safe_error_code: str,
) -> DocumentProcessingJob | None:
    """Mark job as failed with a sanitized error code."""
    job = db.scalar(
        select(DocumentProcessingJob).where(DocumentProcessingJob.id == job_id)
    )
    if not job:
        return None

    now = datetime.now(UTC)
    job.status = "failed"
    job.safe_error_code = safe_error_code
    job.finished_at = now
    job.updated_at = now
    db.flush()
    return job


def get_job(db: Session, job_id: uuid.UUID) -> DocumentProcessingJob | None:
    """Retrieve job details by ID."""
    return db.scalar(
        select(DocumentProcessingJob).where(DocumentProcessingJob.id == job_id)
    )
