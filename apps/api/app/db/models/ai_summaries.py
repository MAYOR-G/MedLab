"""AI-generated summaries and explanations model."""

import uuid
from typing import Any

from sqlalchemy import CheckConstraint, ForeignKey, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

VALID_SUMMARY_STATUSES = ("pending", "succeeded", "failed")


class AISummary(Base, TimestampMixin):
    __tablename__ = "ai_summaries"
    __table_args__ = (
        CheckConstraint(
            f"status IN {VALID_SUMMARY_STATUSES}", name="ck_ai_summaries_status"
        ),
        CheckConstraint(
            "status != 'succeeded' OR (summary_text IS NOT NULL AND length(trim(summary_text)) > 0)",
            name="ck_ai_summaries_succeeded_has_text",
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
    summary_text: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    provider: Mapped[str | None] = mapped_column(
        String(80),
        nullable=True,
    )
    model: Mapped[str | None] = mapped_column(
        String(160),
        nullable=True,
    )
    prompt_version: Mapped[str | None] = mapped_column(
        String(80),
        nullable=True,
    )
    source_reference_metadata: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        server_default=text("'{}'"),
    )
    safe_error_code: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    version = relationship("DocumentVersion", backref="summaries")
