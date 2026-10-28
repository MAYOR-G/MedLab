"""Family workspace model."""

import uuid

from sqlalchemy import CheckConstraint, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin

VALID_WORKSPACE_STATUSES = ("active", "pending_deletion", "deletion_failed")


class FamilyWorkspace(Base, TimestampMixin):
    __tablename__ = "family_workspaces"
    __table_args__ = (
        CheckConstraint(
            f"status IN {VALID_WORKSPACE_STATUSES}",
            name="ck_family_workspaces_status",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    owner_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        comment="Sole workspace owner (auth.users.id)",
    )
    name: Mapped[str] = mapped_column(
        String(120),
        nullable=False,
        default="My Family",
    )
    status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="active",
    )
