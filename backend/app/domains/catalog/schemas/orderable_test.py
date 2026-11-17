"""Pydantic schemas for orderable tests."""
from datetime import datetime

from app.domains.catalog.schemas.analyte import AnalyteSummaryResponse
from pydantic import BaseModel, field_validator


class RejectionCriterionItem(BaseModel):
    reason: str
    domain: str = "specimen"


RejectionCriterionValue = str | RejectionCriterionItem


def _normalize_rejection_criteria(
    value: list[RejectionCriterionValue] | None,
) -> list[RejectionCriterionItem] | None:
    if value is None:
        return None
    normalized: list[RejectionCriterionItem] = []
    for item in value:
        if isinstance(item, RejectionCriterionItem):
            normalized.append(item)
        elif isinstance(item, dict):
            normalized.append(RejectionCriterionItem.model_validate(item))
        else:
            normalized.append(RejectionCriterionItem(reason=str(item).strip()))
    return normalized


class OrderableTestBase(BaseModel):
    code: str
    name: str
    displayName: str
    category: str
    price: float
    turnaroundTimeHours: int
    sampleType: str
    containerTypes: list[str]
    containerTopColors: list[str]
    isActive: bool = True


class OrderableTestSummaryResponse(OrderableTestBase):
    synonyms: list[str] | None = None
    loincCode: str | None = None
    fastingRequired: bool | None = None
    createdAt: datetime
    updatedAt: datetime

    model_config = {"from_attributes": True}


class OrderableTestResponse(OrderableTestBase):
    synonyms: list[str] | None = None
    sampleVolume: str | None = None
    minimumVolume: float | None = None
    optimalVolume: float | None = None
    numberOfContainers: int | None = None
    containerDescription: str | None = None
    specialRequirements: str | None = None
    fastingRequired: bool | None = None
    collectionNotes: str | None = None
    rejectionCriteria: list[RejectionCriterionItem] | None = None
    validationRejectionCriteria: list[RejectionCriterionItem] | None = None
    analytes: list[AnalyteSummaryResponse] = []
    loincCode: str | None = None
    methodology: str | None = None
    confidence: str | None = None
    notes: str | None = None
    createdAt: datetime
    updatedAt: datetime

    @field_validator("rejectionCriteria", mode="before")
    @classmethod
    def normalize_rejection_criteria_response(
        cls, value: list[RejectionCriterionValue] | None
    ) -> list[RejectionCriterionItem] | None:
        return _normalize_rejection_criteria(value)

    @field_validator("validationRejectionCriteria", mode="before")
    @classmethod
    def normalize_validation_rejection_criteria_response(
        cls, value: list[RejectionCriterionValue] | None
    ) -> list[RejectionCriterionItem] | None:
        return _normalize_rejection_criteria(value)

    model_config = {"from_attributes": True}