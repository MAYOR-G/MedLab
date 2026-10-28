"""Extracted document text model."""

import uuid
from decimal import Decimal

from sqlalchemy import CheckConstraint, ForeignKey, Numeric, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

VALID_EXTRACTION_STATUSES = ("pending", "succeeded", "failed", "partial")


class DocumentExtraction(Base, TimestampMixin):
    __tablename__ = "document_extractions"
    __table_args__ = (
        CheckConstraint(
            f"status IN {VALID_EXTRACTION_STATUSES}",
            name="ck_document_extractions_status",
        ),
        CheckConstraint(
            "extraction_confidence IS NULL OR (extraction_confidence >= 0 AND extraction_confidence <= 1)",
            name="ck_document_extractions_confidence_range",
        ),
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
    status: Mapped[str] = mapped_column(
        String(24),
        nullable=False,
        default="pending",
    )
    extracted_text: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    extraction_method: Mapped[str | None] = mapped_column(
        String(80),
        nullable=True,
    )
    extraction_confidence: Mapped[Decimal | None] = mapped_column(
        Numeric(5, 4),
        nullable=True,
    )
    safe_error_code: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    version = relationship("DocumentVersion", backref="extractions")
