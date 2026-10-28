"""Pydantic schemas for secure document sharing and public share viewer."""

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class CreateShareLinkRequest(BaseModel):
    """Payload to create an expiring share link."""

    model_config = ConfigDict(populate_by_name=True)

    expires_in_hours: int = Field(24, ge=1, le=168, alias="expiresInHours")
    include_original: bool = Field(True, alias="includeOriginal")
    include_summary: bool = Field(True, alias="includeSummary")


class ShareLinkCreatedResponse(BaseModel):
    """Returned immediately after link creation, includes bearer token once."""

    model_config = ConfigDict(populate_by_name=True)

    id: uuid.UUID
    document_id: uuid.UUID = Field(..., alias="documentId")
    document_title: str = Field(..., alias="documentTitle")
    token: str
    share_url: str = Field(..., alias="shareUrl")
    expires_at: datetime = Field(..., alias="expiresAt")
    include_original: bool = Field(..., alias="includeOriginal")
    include_summary: bool = Field(..., alias="includeSummary")
    created_at: datetime = Field(..., alias="createdAt")


class ShareLinkItem(BaseModel):
    """Metadata item for managing generated share links (no token revealed)."""

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: uuid.UUID
    document_id: uuid.UUID = Field(..., alias="documentId")
    document_title: str = Field(..., alias="documentTitle")
    version_number: int = Field(..., alias="versionNumber")
    expires_at: datetime = Field(..., alias="expiresAt")
    revoked_at: datetime | None = Field(None, alias="revokedAt")
    is_expired: bool = Field(..., alias="isExpired")
    is_revoked: bool = Field(..., alias="isRevoked")
    include_original: bool = Field(..., alias="includeOriginal")
    include_summary: bool = Field(..., alias="includeSummary")
    created_at: datetime = Field(..., alias="createdAt")


class ShareLinkListResponse(BaseModel):
    """List of share links for a document or workspace."""

    items: list[ShareLinkItem]
    total: int


class PublicShareCitation(BaseModel):
    """Citation displayed to public recipient."""

    title: str
    source: str
    url: str


class PublicShareSummary(BaseModel):
    """AI explanation payload for public viewer."""

    summary_text: str = Field(..., alias="summaryText")
    citations: list[dict[str, Any]] = []
    created_at: datetime = Field(..., alias="createdAt")


class PublicShareDocumentResponse(BaseModel):
    """Public viewer document payload."""

    model_config = ConfigDict(populate_by_name=True)

    title: str
    category: str
    document_date: str | None = Field(None, alias="documentDate")
    notes: str | None = None
    original_filename: str | None = Field(None, alias="originalFilename")
    file_size_bytes: int | None = Field(None, alias="fileSizeBytes")
    include_original: bool = Field(..., alias="includeOriginal")
    include_summary: bool = Field(..., alias="includeSummary")
    expires_at: datetime = Field(..., alias="expiresAt")
    download_url: str | None = Field(None, alias="downloadUrl")
    summary: PublicShareSummary | None = None
    disclaimer: str
