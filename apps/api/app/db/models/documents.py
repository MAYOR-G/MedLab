"""Logical medical document model."""

import uuid
from datetime import date, datetime

from sqlalchemy import CheckConstraint, Date, DateTime, ForeignKey, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

VALID_DOCUMENT_CATEGORIES = (
    "lab_result",
    "prescription",
    "imaging",
    "clinical_report",
    "vaccination",
    "discharge_summary",
    "other",
)


class MedicalDocument(Base, TimestampMixin):
    __tablename__ = "medical_documents"
    __table_args__ = (
        CheckConstraint(
            f"category IN {VALID_DOCUMENT_CATEGORIES}",
            name="ck_medical_documents_category",
        ),
        CheckConstraint(
            "length(trim(title)) > 0",
            name="ck_medical_documents_title_non_empty",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("family_workspaces.id", ondelete="CASCADE"),
        nullable=False,
    )
    family_member_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("family_members.id", ondelete="RESTRICT"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(
        String(240),
        nullable=False,
    )
    category: Mapped[str] = mapped_column(
        String(40),
        nullable=False,
        default="other",
    )
    document_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )
    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    purge_after: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    workspace = relationship("FamilyWorkspace", backref="documents")
    family_member = relationship("FamilyMember", backref="documents")
