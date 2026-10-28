"""Family member profile model."""

import uuid
from datetime import date, datetime

from sqlalchemy import CheckConstraint, Date, DateTime, ForeignKey, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

VALID_RELATIONSHIPS = (
    "self",
    "spouse",
    "partner",
    "child",
    "parent",
    "sibling",
    "dependent",
    "other",
    "unspecified",
)


class FamilyMember(Base, TimestampMixin):
    __tablename__ = "family_members"
    __table_args__ = (
        CheckConstraint(
            f"relationship_label IN {VALID_RELATIONSHIPS}",
            name="ck_family_members_relationship",
        ),
        CheckConstraint(
            "length(trim(display_name)) > 0",
            name="ck_family_members_display_name_non_empty",
        ),
        CheckConstraint(
            "date_of_birth IS NULL OR date_of_birth <= CURRENT_DATE",
            name="ck_family_members_dob_not_future",
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
    display_name: Mapped[str] = mapped_column(
        String(160),
        nullable=False,
    )
    relationship_label: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="unspecified",
    )
    date_of_birth: Mapped[date | None] = mapped_column(
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

    workspace = relationship("FamilyWorkspace", backref="family_members")
