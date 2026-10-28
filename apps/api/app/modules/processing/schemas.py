"""Pydantic schemas for background processing jobs and extractions."""

import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class ProcessingJobData(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    documentVersionId: uuid.UUID
    jobType: str
    status: str
    attemptCount: int
    safeErrorCode: str | None = None
    startedAt: datetime | None = None
    finishedAt: datetime | None = None
    createdAt: datetime
    updatedAt: datetime


class ProcessingJobResponse(BaseModel):
    data: ProcessingJobData
    requestId: str


class DocumentExtractionData(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    documentVersionId: uuid.UUID
    status: str
    extractedText: str | None = None
    extractionMethod: str | None = None
    extractionConfidence: Decimal | None = None
    safeErrorCode: str | None = None
    createdAt: datetime
    updatedAt: datetime


class DocumentExtractionResponse(BaseModel):
    data: DocumentExtractionData
    requestId: str
