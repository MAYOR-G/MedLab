"""Pydantic schemas for medical measurements and longitudinal comparisons."""

import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class MeasurementData(BaseModel):
    """Single clinical measurement item."""

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: uuid.UUID
    document_version_id: uuid.UUID = Field(..., alias="documentVersionId")
    document_id: uuid.UUID = Field(..., alias="documentId")
    document_title: str = Field(..., alias="documentTitle")
    family_member_id: uuid.UUID = Field(..., alias="familyMemberId")
    test_name: str = Field(..., alias="testName")
    normalized_test_key: str | None = Field(None, alias="normalizedTestKey")
    value_numeric: Decimal | None = Field(None, alias="valueNumeric")
    value_text: str | None = Field(None, alias="valueText")
    unit: str | None = None
    specimen: str | None = None
    measured_on: date | None = Field(None, alias="measuredOn")
    reference_low: Decimal | None = Field(None, alias="referenceLow")
    reference_high: Decimal | None = Field(None, alias="referenceHigh")
    flag: str | None = None
    confidence: Decimal | None = None
    created_at: datetime = Field(..., alias="createdAt")


class MeasurementListResponse(BaseModel):
    """Paginated or complete list of clinical measurements."""

    items: list[MeasurementData]
    total: int


class MeasurementTrendPoint(BaseModel):
    """Chronological observation point for an analyte."""

    model_config = ConfigDict(populate_by_name=True)

    date: str
    value: float | None = None
    text_value: str | None = Field(None, alias="textValue")
    unit: str | None = None
    reference_low: float | None = Field(None, alias="referenceLow")
    reference_high: float | None = Field(None, alias="referenceHigh")
    flag: str | None = None
    document_id: str = Field(..., alias="documentId")
    document_title: str = Field(..., alias="documentTitle")


class MeasurementTrendSeries(BaseModel):
    """Longitudinal comparison trend series for a specific analyte."""

    model_config = ConfigDict(populate_by_name=True)

    normalized_test_key: str = Field(..., alias="normalizedTestKey")
    display_name: str = Field(..., alias="displayName")
    unit: str | None = None
    points: list[MeasurementTrendPoint]
    is_comparable: bool = Field(True, alias="isComparable")
    min_value: float | None = Field(None, alias="minValue")
    max_value: float | None = Field(None, alias="maxValue")
    latest_value: float | None = Field(None, alias="latestValue")
    latest_flag: str | None = Field(None, alias="latestFlag")


class AnalyteOption(BaseModel):
    """Summary of a tracked biomarker for analyte selector tabs."""

    model_config = ConfigDict(populate_by_name=True)

    normalized_test_key: str = Field(..., alias="normalizedTestKey")
    display_name: str = Field(..., alias="displayName")
    count: int
    latest_measured_on: str | None = Field(None, alias="latestMeasuredOn")
    latest_value: float | None = Field(None, alias="latestValue")
    latest_unit: str | None = Field(None, alias="latestUnit")
    latest_flag: str | None = Field(None, alias="latestFlag")


class AnalyteListResponse(BaseModel):
    """Available analytes for a family member."""

    items: list[AnalyteOption]
    total: int
