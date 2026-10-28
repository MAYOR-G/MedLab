"""User profile model (linked to auth.users)."""

import uuid

from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class UserProfile(Base, TimestampMixin):
    __tablename__ = "user_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        nullable=False,
        comment="Foreign key to Supabase auth.users.id",
    )
    display_name: Mapped[str | None] = mapped_column(
        String(120),
        nullable=True,
    )
