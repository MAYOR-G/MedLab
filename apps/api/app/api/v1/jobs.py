"""Processing job status API endpoints."""

import uuid

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core.errors import NotFoundError
from app.core.security import AuthenticatedUser
from app.dependencies.auth import get_current_user
from app.dependencies.database import get_db
from app.modules.processing.schemas import ProcessingJobData, ProcessingJobResponse
from app.services.job_service import get_job

router = APIRouter(prefix="/processing-jobs", tags=["Processing Jobs"])


@router.get("/{jobId}", response_model=ProcessingJobResponse)
def get_processing_job_status(
    request: Request,
    jobId: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProcessingJobResponse:
    """Retrieve current processing status for an asynchronous job."""
    job = get_job(db, jobId)
    if not job:
        raise NotFoundError("Processing job not found.")

    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    job_data = ProcessingJobData(
        id=job.id,
        documentVersionId=job.document_version_id,
        jobType=job.job_type,
        status=job.status,
        attemptCount=job.attempt_count,
        safeErrorCode=job.safe_error_code,
        startedAt=job.started_at,
        finishedAt=job.finished_at,
        createdAt=job.created_at,
        updatedAt=job.updated_at,
    )
    return ProcessingJobResponse(data=job_data, requestId=request_id)
