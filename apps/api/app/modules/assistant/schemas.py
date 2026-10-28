"""Pydantic schemas for AI summaries and AI health assistant conversations."""

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator


class AISummaryData(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    documentVersionId: uuid.UUID
    status: str
    summaryText: str | None = None
    provider: str | None = None
    model: str | None = None
    promptVersion: str | None = None
    citations: list[dict[str, Any]] = []
    createdAt: datetime
    updatedAt: datetime


class AISummaryResponse(BaseModel):
    data: AISummaryData
    requestId: str


class AISummaryListResponse(BaseModel):
    data: list[AISummaryData]
    requestId: str


class AssistantQuestionRequest(BaseModel):
    question: str = Field(..., min_length=2, max_length=1000)
    documentId: uuid.UUID | None = None
    familyMemberId: uuid.UUID | None = None

    @field_validator("question")
    @classmethod
    def validate_question(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Question cannot be empty.")
        return trimmed


class AssistantQuestionResponse(BaseModel):
    answer: str
    citations: list[dict[str, Any]] = []
    disclaimer: str
    requestId: str
