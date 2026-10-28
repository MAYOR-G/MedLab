#!/usr/bin/env python3
"""Seed script for local development.

Populates completely synthetic, non-identifiable test data adhering strictly
to DATABASE.md Section 11.3. NEVER run in production.
"""

from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
import sys
import uuid
import hashlib

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

# Add apps/api to path
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../apps/api")))

from app.core.config import get_settings
from app.db.models import (
    AISummary,
    AuditEvent,
    DocumentExtraction,
    DocumentProcessingJob,
    DocumentVersion,
    FamilyMember,
    FamilyWorkspace,
    MedicalDocument,
    MedicalMeasurement,
    ShareLink,
    UserProfile,
)

settings = get_settings()

TEST_USER_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")
TEST_WORKSPACE_ID = uuid.UUID("22222222-2222-2222-2222-222222222222")


def seed() -> None:
    engine = create_engine(settings.DATABASE_URL)
    with Session(engine) as session:
        print("🌱 Seeding synthetic development records...")

        # 1. User Profile
        profile = session.scalar(select(UserProfile).where(UserProfile.user_id == TEST_USER_ID))
        if not profile:
            profile = UserProfile(
                user_id=TEST_USER_ID,
                display_name="Dr. Alex Johnson",
            )
            session.add(profile)
            session.flush()

        # 2. Family Workspace
        workspace = session.scalar(select(FamilyWorkspace).where(FamilyWorkspace.id == TEST_WORKSPACE_ID))
        if not workspace:
            workspace = FamilyWorkspace(
                id=TEST_WORKSPACE_ID,
                owner_user_id=TEST_USER_ID,
                name="The Johnson Family",
                status="active",
            )
            session.add(workspace)
            session.flush()

        # 3. Family Members
        members_data = [
            ("Self (Alex)", "self", date(1985, 4, 12)),
            ("Taylor Johnson", "spouse", date(1987, 8, 24)),
            ("Sam Johnson", "child", date(2015, 11, 3)),
        ]
        members = []
        for name, relationship, dob in members_data:
            member = session.scalar(
                select(FamilyMember).where(
                    FamilyMember.workspace_id == workspace.id,
                    FamilyMember.display_name == name,
                )
            )
            if not member:
                member = FamilyMember(
                    workspace_id=workspace.id,
                    display_name=name,
                    relationship_label=relationship,
                    date_of_birth=dob,
                    notes=f"Synthetic profile for {name}",
                )
                session.add(member)
                session.flush()
            members.append(member)

        alex = members[0]

        # 4. Medical Documents
        docs_data = [
            ("Annual Comprehensive Blood Panel", "lab_result", date(2026, 3, 15)),
            ("Cardiology Echocardiogram Report", "imaging", date(2026, 2, 10)),
            ("Lisinopril 10mg Prescription", "prescription", date(2026, 1, 5)),
            ("Annual Wellness Clinical Summary", "clinical_report", date(2025, 11, 20)),
        ]
        documents = []
        for title, category, doc_date in docs_data:
            doc = session.scalar(
                select(MedicalDocument).where(
                    MedicalDocument.workspace_id == workspace.id,
                    MedicalDocument.title == title,
                )
            )
            if not doc:
                doc = MedicalDocument(
                    workspace_id=workspace.id,
                    family_member_id=alex.id,
                    title=title,
                    category=category,
                    document_date=doc_date,
                    notes=f"Synthetic {category} record for development testing.",
                )
                session.add(doc)
                session.flush()
            documents.append(doc)

        lab_doc = documents[0]

        # 5. Document Version
        version = session.scalar(
            select(DocumentVersion).where(
                DocumentVersion.document_id == lab_doc.id,
                DocumentVersion.version_number == 1,
            )
        )
        if not version:
            fake_content = b"Synthetic Blood Panel Document Content"
            sha256_hash = hashlib.sha256(fake_content).hexdigest()
            version = DocumentVersion(
                document_id=lab_doc.id,
                version_number=1,
                storage_bucket="medical-documents",
                storage_key=f"{workspace.id}/{lab_doc.id}/v1/synthetic_blood_panel.pdf",
                original_filename="blood_panel_2026.pdf",
                mime_type="application/pdf",
                file_size_bytes=len(fake_content),
                sha256=sha256_hash,
                is_current=True,
                uploaded_by_user_id=TEST_USER_ID,
            )
            session.add(version)
            session.flush()

        # 6. Processing Job
        job = session.scalar(
            select(DocumentProcessingJob).where(
                DocumentProcessingJob.document_version_id == version.id,
                DocumentProcessingJob.job_type == "extract",
            )
        )
        if not job:
            job = DocumentProcessingJob(
                document_version_id=version.id,
                job_type="extract",
                status="succeeded",
                attempt_count=1,
                idempotency_key=f"extract_{version.id}_1",
                started_at=datetime.now(timezone.utc) - timedelta(minutes=5),
                finished_at=datetime.now(timezone.utc) - timedelta(minutes=4),
            )
            session.add(job)
            session.flush()

        # 7. Document Extraction
        extraction = session.scalar(
            select(DocumentExtraction).where(DocumentExtraction.document_version_id == version.id)
        )
        if not extraction:
            extraction = DocumentExtraction(
                document_version_id=version.id,
                status="succeeded",
                extracted_text="LABORATORY REPORT\nPatient: Alex Johnson\nFasting Glucose: 92 mg/dL (Ref: 70-99)\nTotal Cholesterol: 185 mg/dL (Ref: <200)\nTSH: 2.1 uIU/mL (Ref: 0.4-4.0)",
                extraction_method="pdf_text_parser",
                extraction_confidence=Decimal("0.9900"),
            )
            session.add(extraction)
            session.flush()

        # 8. AI Summary
        summary = session.scalar(
            select(AISummary).where(AISummary.document_version_id == version.id)
        )
        if not summary:
            summary = AISummary(
                document_version_id=version.id,
                status="succeeded",
                summary_text="This routine comprehensive blood panel shows healthy and normal metabolic and thyroid markers. Fasting blood sugar (glucose) is well within normal fasting ranges, total cholesterol is optimal, and thyroid hormone (TSH) activity is balanced.",
                provider="openrouter",
                model="anthropic/claude-3.5-sonnet",
                prompt_version="1.0.0",
                source_reference_metadata={"sections": ["Metabolic Panel", "Lipid Panel", "Thyroid"]},
            )
            session.add(summary)
            session.flush()

        # 9. Medical Measurements
        measurements_data = [
            ("Fasting Glucose", "glucose_fasting", Decimal("92.0"), "mg/dL", Decimal("70.0"), Decimal("99.0")),
            ("Total Cholesterol", "cholesterol_total", Decimal("185.0"), "mg/dL", None, Decimal("200.0")),
            ("Thyroid Stimulating Hormone", "tsh", Decimal("2.1"), "uIU/mL", Decimal("0.4"), Decimal("4.0")),
        ]
        for name, norm_key, val, unit, ref_low, ref_high in measurements_data:
            measurement = session.scalar(
                select(MedicalMeasurement).where(
                    MedicalMeasurement.document_version_id == version.id,
                    MedicalMeasurement.normalized_test_key == norm_key,
                )
            )
            if not measurement:
                measurement = MedicalMeasurement(
                    document_version_id=version.id,
                    extraction_id=extraction.id,
                    test_name=name,
                    normalized_test_key=norm_key,
                    value_numeric=val,
                    unit=unit,
                    measured_on=lab_doc.document_date,
                    reference_low=ref_low,
                    reference_high=ref_high,
                    confidence=Decimal("0.9800"),
                )
                session.add(measurement)

        # 10. Share Links
        raw_token = "medlab_dev_share_token_secret_12345"
        token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
        share = session.scalar(select(ShareLink).where(ShareLink.token_hash == token_hash))
        if not share:
            share = ShareLink(
                document_version_id=version.id,
                created_by_user_id=TEST_USER_ID,
                token_hash=token_hash,
                include_original=True,
                include_summary=True,
                expires_at=datetime.now(timezone.utc) + timedelta(days=7),
            )
            session.add(share)

        # 11. Audit Event
        audit = AuditEvent(
            actor_user_id=TEST_USER_ID,
            workspace_id=workspace.id,
            document_id=lab_doc.id,
            action="document_upload",
            outcome="success",
            request_id=str(uuid.uuid4()),
            metadata_json={"source": "seed_script"},
        )
        session.add(audit)

        session.commit()
        print("✅ Development database seeded successfully!")


if __name__ == "__main__":
    seed()
