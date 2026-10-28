"""Structured lab test and clinical measurement model."""

import uuid
from datetime import date
from decimal import Decimal

from sqlalchemy import CheckConstraint, Date, ForeignKey, Numeric, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class MedicalMeasurement(Base, TimestampMixin):
    __tablename__ = "medical_measurements"
    __table_args__ = (
        CheckConstraint(
            "value_numeric IS NOT NULL OR value_text IS NOT NULL",
            name="ck_medical_measurements_has_value",
        ),
        CheckConstraint(
            "reference_low IS NULL OR reference_high IS NULL OR reference_low <= reference_high",
            name="ck_medical_measurements_reference_range",
        ),
        CheckConstraint(
            "confidence IS NULL OR (confidence >= 0 AND confidence <= 1)",
            name="ck_medical_measurements_confidence_range",
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
    extraction_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("document_extractions.id", ondelete="SET NULL"),
        nullable=True,
    )
    test_name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )
    normalized_test_key: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )
    value_numeric: Mapped[Decimal | None] = mapped_column(
        Numeric(20, 8),
        nullable=True,
    )
    value_text: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    unit: Mapped[str | None] = mapped_column(
        String(80),
        nullable=True,
    )
    specimen: Mapped[str | None] = mapped_column(
        String(120),
        nullable=True,
    )
    measured_on: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )
    reference_low: Mapped[Decimal | None] = mapped_column(
        Numeric(20, 8),
        nullable=True,
    )
    reference_high: Mapped[Decimal | None] = mapped_column(
        Numeric(20, 8),
        nullable=True,
    )
    source_location: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    confidence: Mapped[Decimal | None] = mapped_column(
        Numeric(5, 4),
        nullable=True,
    )

    version = relationship("DocumentVersion", backref="measurements")
    extraction = relationship("DocumentExtraction", backref="measurements")
