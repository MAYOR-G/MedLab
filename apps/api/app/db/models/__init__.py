"""Registration of all SQLAlchemy ORM models."""

from app.db.models.ai_summaries import AISummary
from app.db.models.audit_events import AuditEvent
from app.db.models.document_extractions import DocumentExtraction
from app.db.models.document_versions import DocumentVersion
from app.db.models.documents import MedicalDocument
from app.db.models.family_members import FamilyMember
from app.db.models.medical_measurements import MedicalMeasurement
from app.db.models.processing_jobs import DocumentProcessingJob
from app.db.models.share_links import ShareLink
from app.db.models.user_profiles import UserProfile
from app.db.models.workspaces import FamilyWorkspace

__all__ = [
    "UserProfile",
    "FamilyWorkspace",
    "FamilyMember",
    "MedicalDocument",
    "DocumentVersion",
    "DocumentProcessingJob",
    "DocumentExtraction",
    "AISummary",
    "MedicalMeasurement",
    "ShareLink",
    "AuditEvent",
]
