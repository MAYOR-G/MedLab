"""Durable asynchronous processing jobs model."""

import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

VALID_JOB_TYPES = ("extract", "summarize", "extract_measurements", "permanent_delete")
VALID_JOB_STATUSES = ("queued", "running", "succeeded", "failed", "cancelled")


class DocumentProcessingJob(Base, TimestampMixin):
    __tablename__ = "document_processing_jobs"
    __table_args__ = (
        CheckConstraint(
            f"job_type IN {VALID_JOB_TYPES}", name="ck_processing_jobs_type"
        ),
        CheckConstraint(
            f"status IN {VALID_JOB_STATUSES}", name="ck_processing_jobs_status"
        ),
        CheckConstraint("attempt_count >= 0", name="ck_processing_jobs_attempt_count"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    document_version_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("document_versions.id", ondelete="CASCADE"),
        nullable=False,
    )
    job_type: Mapped[str] = mapped_column(
        String(40),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(24),
        nullable=False,
        default="queued",
    )
    attempt_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )
    idempotency_key: Mapped[str] = mapped_column(
        String(160),
        nullable=False,
        unique=True,
    )
    provider: Mapped[str | None] = mapped_column(
        String(80),
        nullable=True,
    )
    model: Mapped[str | None] = mapped_column(
        String(160),
        nullable=True,
    )
    safe_error_code: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )
    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    finished_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    version = relationship("DocumentVersion", backref="jobs")
