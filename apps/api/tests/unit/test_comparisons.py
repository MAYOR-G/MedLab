"""Unit tests for structured medical measurement extraction and comparisons."""

import uuid
from datetime import date
from decimal import Decimal

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.models.document_versions import DocumentVersion
from app.db.models.documents import MedicalDocument
from app.db.models.family_members import FamilyMember
from app.db.models.medical_measurements import MedicalMeasurement
from app.db.models.workspaces import FamilyWorkspace
from app.modules.comparisons.measurement_extractor import (
    calculate_flag,
    parse_measurements_from_text,
)
from app.modules.comparisons.service import (
    extract_and_persist_measurements,
    get_member_measurement_trends,
    list_member_analytes,
    list_member_measurements,
)


@pytest.fixture
def db_session():
    """In-memory SQLite session for testing."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    tables = [
        FamilyWorkspace.__table__,
        FamilyMember.__table__,
        MedicalDocument.__table__,
        DocumentVersion.__table__,
        MedicalMeasurement.__table__,
    ]
    Base.metadata.create_all(bind=engine, tables=tables)
    TestingSession = sessionmaker(bind=engine, autoflush=False)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine, tables=tables)


@pytest.fixture
def test_setup(db_session: Session):
    owner_id = uuid.uuid4()
    workspace = FamilyWorkspace(
        id=uuid.uuid4(),
        owner_user_id=owner_id,
        name="Smith Family",
    )
    db_session.add(workspace)

    member = FamilyMember(
        id=uuid.uuid4(),
        workspace_id=workspace.id,
        display_name="John Doe",
        relationship_label="self",
        date_of_birth=date(1985, 5, 20),
    )
    db_session.add(member)

    doc = MedicalDocument(
        id=uuid.uuid4(),
        workspace_id=workspace.id,
        family_member_id=member.id,
        title="Comprehensive Metabolic Panel",
        category="lab_result",
        document_date=date(2025, 4, 15),
    )
    db_session.add(doc)

    version = DocumentVersion(
        id=uuid.uuid4(),
        document_id=doc.id,
        version_number=1,
        storage_bucket="medlab-records",
        storage_key="test/cmp.pdf",
        original_filename="cmp.pdf",
        mime_type="application/pdf",
        file_size_bytes=1024,
        sha256="0" * 64,
        is_current=True,
        uploaded_by_user_id=owner_id,
    )
    db_session.add(version)
    db_session.commit()

    return {
        "owner_id": owner_id,
        "workspace_id": workspace.id,
        "member_id": member.id,
        "doc_id": doc.id,
        "version_id": version.id,
    }


def test_calculate_flag():
    low = Decimal("70")
    high = Decimal("99")

    assert calculate_flag(Decimal("85"), low, high) == "normal"
    assert calculate_flag(Decimal("65"), low, high) == "low"
    assert calculate_flag(Decimal("110"), low, high) == "high"
    assert calculate_flag(None, low, high) is None
    assert calculate_flag(Decimal("85"), None, high) == "normal"
    assert calculate_flag(Decimal("105"), None, high) == "high"
    assert calculate_flag(Decimal("85"), low, None) == "normal"
    assert calculate_flag(Decimal("50"), low, None) == "low"


def test_parse_measurements_from_text():
    sample_ocr = """
    LIPID PANEL & METABOLIC
    Fasting Blood Glucose: 105 mg/dL (Reference Range: 70 - 99 mg/dL)
    Total Cholesterol: 215 mg/dL (Reference Range: 125 - 200 mg/dL)
    HDL Cholesterol: 48 mg/dL (Reference Range: 40 - 60 mg/dL)
    LDL Cholesterol: 135 mg/dL (Reference Range: < 100 mg/dL)
    Triglycerides: 160 mg/dL (Reference Range: < 150 mg/dL)
    Hemoglobin A1c: 5.9 % (Reference Range: 4.0 - 5.6 %)
    TSH: 2.15 uIU/mL (Reference Range: 0.40 - 4.50 uIU/mL)
    Serum Creatinine: 0.95 mg/dL (Reference Range: 0.70 - 1.30 mg/dL)
    """

    parsed = parse_measurements_from_text(sample_ocr, default_date=date(2026, 4, 15))
    keys = {p.normalized_test_key for p in parsed}

    assert "fasting_glucose" in keys
    assert "total_cholesterol" in keys
    assert "hdl_cholesterol" in keys
    assert "ldl_cholesterol" in keys
    assert "triglycerides" in keys
    assert "hemoglobin_a1c" in keys
    assert "tsh" in keys
    assert "creatinine" in keys

    glucose = next(p for p in parsed if p.normalized_test_key == "fasting_glucose")
    assert glucose.value_numeric == Decimal("105")
    assert glucose.unit == "mg/dL"
    assert glucose.reference_low == Decimal("70")
    assert glucose.reference_high == Decimal("99")
    assert glucose.measured_on == date(2026, 4, 15)


def test_persistence_and_trends(db_session: Session, test_setup: dict):
    version_id = test_setup["version_id"]
    member_id = test_setup["member_id"]

    sample_ocr_1 = """
    Fasting Glucose: 95 mg/dL (70 - 99)
    Total Cholesterol: 190 mg/dL (125 - 200)
    """
    saved_1 = extract_and_persist_measurements(
        db_session,
        document_version_id=version_id,
        extraction_id=None,
        raw_text=sample_ocr_1,
    )
    assert len(saved_1) == 2

    # Second document with measurements on a later date
    doc2 = MedicalDocument(
        id=uuid.uuid4(),
        workspace_id=test_setup["workspace_id"],
        family_member_id=member_id,
        title="Followup CMP",
        category="lab_result",
        document_date=date(2026, 4, 15),
    )
    db_session.add(doc2)
    ver2 = DocumentVersion(
        id=uuid.uuid4(),
        document_id=doc2.id,
        version_number=1,
        storage_bucket="medlab-records",
        storage_key="test/cmp2.pdf",
        original_filename="cmp2.pdf",
        mime_type="application/pdf",
        file_size_bytes=1024,
        sha256="1" * 64,
        is_current=True,
        uploaded_by_user_id=test_setup["owner_id"],
    )
    db_session.add(ver2)
    db_session.commit()

    sample_ocr_2 = """
    Fasting Glucose: 108 mg/dL (70 - 99)
    Total Cholesterol: 215 mg/dL (125 - 200)
    """
    saved_2 = extract_and_persist_measurements(
        db_session,
        document_version_id=ver2.id,
        extraction_id=None,
        raw_text=sample_ocr_2,
    )
    assert len(saved_2) == 2

    # Query trends for fasting_glucose
    trends = get_member_measurement_trends(
        db_session,
        family_member_id=member_id,
        normalized_test_key="fasting_glucose",
        workspace_id=test_setup["workspace_id"],
    )

    assert trends.normalized_test_key == "fasting_glucose"
    assert trends.is_comparable is True
    assert len(trends.points) == 2
    # Chronological sort: 2026-04-15
    assert trends.points[0].value == 95.0
    assert trends.points[0].flag == "normal"
    assert trends.points[1].value == 108.0
    assert trends.points[1].flag == "high"

    # Analytes list includes fasting_glucose and total_cholesterol
    analytes = list_member_analytes(
        db_session,
        family_member_id=member_id,
        workspace_id=test_setup["workspace_id"],
    )
    analyte_keys = {a.normalized_test_key for a in analytes.items}
    assert "fasting_glucose" in analyte_keys
    assert "total_cholesterol" in analyte_keys

    # Measurements list
    measurements = list_member_measurements(
        db_session,
        family_member_id=member_id,
        workspace_id=test_setup["workspace_id"],
    )
    assert measurements.total == 4
