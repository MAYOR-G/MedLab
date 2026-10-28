"""Business service for structured medical measurements and historical comparisons."""

import uuid

from sqlalchemy import desc, select
from sqlalchemy.orm import Session, joinedload

from app.db.models.document_versions import DocumentVersion
from app.db.models.documents import MedicalDocument
from app.db.models.medical_measurements import MedicalMeasurement
from app.modules.comparisons.measurement_extractor import (
    CANONICAL_TEST_KEYS,
    calculate_flag,
    parse_measurements_from_text,
)
from app.modules.comparisons.schemas import (
    AnalyteListResponse,
    AnalyteOption,
    MeasurementData,
    MeasurementListResponse,
    MeasurementTrendPoint,
    MeasurementTrendSeries,
)


def extract_and_persist_measurements(
    db: Session,
    document_version_id: uuid.UUID,
    extraction_id: uuid.UUID | None,
    raw_text: str,
) -> list[MedicalMeasurement]:
    """Parse text and persist structured measurements for a document version."""
    version = db.execute(
        select(DocumentVersion)
        .options(joinedload(DocumentVersion.document))
        .where(DocumentVersion.id == document_version_id)
    ).scalar_one_or_none()

    if not version or not version.document:
        return []

    doc_date = version.document.document_date
    extracted = parse_measurements_from_text(raw_text, default_date=doc_date)

    if not extracted:
        return []

    # Idempotent cleanup for this version
    db.query(MedicalMeasurement).filter(
        MedicalMeasurement.document_version_id == document_version_id
    ).delete()

    created_records: list[MedicalMeasurement] = []
    for item in extracted:
        record = MedicalMeasurement(
            document_version_id=document_version_id,
            extraction_id=extraction_id,
            test_name=item.test_name,
            normalized_test_key=item.normalized_test_key,
            value_numeric=item.value_numeric,
            value_text=item.value_text,
            unit=item.unit,
            reference_low=item.reference_low,
            reference_high=item.reference_high,
            measured_on=item.measured_on,
            confidence=item.confidence,
            source_location=item.source_location,
        )
        db.add(record)
        created_records.append(record)

    db.commit()
    return created_records


def list_member_measurements(
    db: Session,
    family_member_id: uuid.UUID,
    workspace_id: uuid.UUID,
    normalized_test_key: str | None = None,
) -> MeasurementListResponse:
    """List all structured measurements for a family member."""
    stmt = (
        select(MedicalMeasurement, DocumentVersion, MedicalDocument)
        .join(DocumentVersion, MedicalMeasurement.document_version_id == DocumentVersion.id)
        .join(MedicalDocument, DocumentVersion.document_id == MedicalDocument.id)
        .where(
            MedicalDocument.family_member_id == family_member_id,
            MedicalDocument.workspace_id == workspace_id,
            MedicalDocument.deleted_at.is_(None),
        )
    )

    if normalized_test_key:
        stmt = stmt.where(MedicalMeasurement.normalized_test_key == normalized_test_key)

    stmt = stmt.order_by(
        desc(MedicalMeasurement.measured_on),
        desc(MedicalMeasurement.created_at),
    )

    rows = db.execute(stmt).all()

    items: list[MeasurementData] = []
    for measurement, version, doc in rows:
        flag = calculate_flag(
            measurement.value_numeric,
            measurement.reference_low,
            measurement.reference_high,
        )
        items.append(
            MeasurementData(
                id=measurement.id,
                documentVersionId=version.id,
                documentId=doc.id,
                documentTitle=doc.title,
                familyMemberId=doc.family_member_id,
                testName=measurement.test_name,
                normalizedTestKey=measurement.normalized_test_key,
                valueNumeric=measurement.value_numeric,
                valueText=measurement.value_text,
                unit=measurement.unit,
                specimen=measurement.specimen,
                measuredOn=measurement.measured_on,
                referenceLow=measurement.reference_low,
                referenceHigh=measurement.reference_high,
                flag=flag,
                confidence=measurement.confidence,
                createdAt=measurement.created_at,
            )
        )

    return MeasurementListResponse(items=items, total=len(items))


def list_document_measurements(
    db: Session,
    document_id: uuid.UUID,
    workspace_id: uuid.UUID,
) -> MeasurementListResponse:
    """List structured measurements extracted from a specific document."""
    stmt = (
        select(MedicalMeasurement, DocumentVersion, MedicalDocument)
        .join(DocumentVersion, MedicalMeasurement.document_version_id == DocumentVersion.id)
        .join(MedicalDocument, DocumentVersion.document_id == MedicalDocument.id)
        .where(
            MedicalDocument.id == document_id,
            MedicalDocument.workspace_id == workspace_id,
            MedicalDocument.deleted_at.is_(None),
        )
        .order_by(MedicalMeasurement.test_name.asc())
    )

    rows = db.execute(stmt).all()

    items: list[MeasurementData] = []
    for measurement, version, doc in rows:
        flag = calculate_flag(
            measurement.value_numeric,
            measurement.reference_low,
            measurement.reference_high,
        )
        items.append(
            MeasurementData(
                id=measurement.id,
                documentVersionId=version.id,
                documentId=doc.id,
                documentTitle=doc.title,
                familyMemberId=doc.family_member_id,
                testName=measurement.test_name,
                normalizedTestKey=measurement.normalized_test_key,
                valueNumeric=measurement.value_numeric,
                valueText=measurement.value_text,
                unit=measurement.unit,
                specimen=measurement.specimen,
                measuredOn=measurement.measured_on,
                referenceLow=measurement.reference_low,
                referenceHigh=measurement.reference_high,
                flag=flag,
                confidence=measurement.confidence,
                createdAt=measurement.created_at,
            )
        )

    return MeasurementListResponse(items=items, total=len(items))


def list_member_analytes(
    db: Session,
    family_member_id: uuid.UUID,
    workspace_id: uuid.UUID,
) -> AnalyteListResponse:
    """List unique tracked analytes for a family member with summary stats."""
    res = list_member_measurements(db, family_member_id, workspace_id)

    grouped: dict[str, list[MeasurementData]] = {}
    for item in res.items:
        key = item.normalized_test_key or item.test_name
        grouped.setdefault(key, []).append(item)

    options: list[AnalyteOption] = []
    for key, items in grouped.items():
        latest = items[0]  # Already ordered by measured_on desc
        cfg = CANONICAL_TEST_KEYS.get(key, {})
        display_name = cfg.get("display_name") or latest.test_name

        options.append(
            AnalyteOption(
                normalizedTestKey=key,
                displayName=display_name,
                count=len(items),
                latestMeasuredOn=str(latest.measured_on) if latest.measured_on else str(latest.created_at.date()),
                latestValue=float(latest.value_numeric) if latest.value_numeric is not None else None,
                latestUnit=latest.unit,
                latestFlag=latest.flag,
            )
        )

    return AnalyteListResponse(items=options, total=len(options))


def get_member_measurement_trends(
    db: Session,
    family_member_id: uuid.UUID,
    normalized_test_key: str,
    workspace_id: uuid.UUID,
) -> MeasurementTrendSeries:
    """Get longitudinal chronological trend data series for an analyte."""
    res = list_member_measurements(
        db,
        family_member_id=family_member_id,
        workspace_id=workspace_id,
        normalized_test_key=normalized_test_key,
    )

    # Sort chronological (oldest to newest) for line charts
    chronological = sorted(
        res.items,
        key=lambda m: (str(m.measured_on or m.created_at.date())),
    )

    cfg = CANONICAL_TEST_KEYS.get(normalized_test_key, {})
    display_name = cfg.get("display_name") or normalized_test_key.replace("_", " ").title()

    units_seen: set[str] = set()
    points: list[MeasurementTrendPoint] = []
    values_numeric: list[float] = []

    for item in chronological:
        date_str = str(item.measured_on) if item.measured_on else str(item.created_at.date())
        val_float = float(item.value_numeric) if item.value_numeric is not None else None

        if item.unit:
            units_seen.add(item.unit.lower())

        if val_float is not None:
            values_numeric.append(val_float)

        points.append(
            MeasurementTrendPoint(
                date=date_str,
                value=val_float,
                textValue=item.value_text,
                unit=item.unit,
                referenceLow=float(item.reference_low) if item.reference_low is not None else None,
                referenceHigh=float(item.reference_high) if item.reference_high is not None else None,
                flag=item.flag,
                documentId=str(item.document_id),
                documentTitle=item.document_title,
            )
        )

    # Unit comparability validation per PRD.md Section 3.5 & ARCHITECTURE.md Section 7
    is_comparable = len(units_seen) <= 1
    primary_unit = chronological[-1].unit if chronological else cfg.get("default_unit")

    min_val = min(values_numeric) if values_numeric else None
    max_val = max(values_numeric) if values_numeric else None
    latest_val = float(chronological[-1].value_numeric) if chronological and chronological[-1].value_numeric is not None else None
    latest_flag = chronological[-1].flag if chronological else None

    return MeasurementTrendSeries(
        normalizedTestKey=normalized_test_key,
        displayName=display_name,
        unit=primary_unit,
        points=points,
        isComparable=is_comparable,
        minValue=min_val,
        maxValue=max_val,
        latestValue=latest_val,
        latestFlag=latest_flag,
    )
