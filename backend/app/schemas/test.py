"""
Pydantic schemas for Test Catalog
"""
from typing import Union

from pydantic import BaseModel, field_validator
from datetime import datetime


class RejectionCriterionItem(BaseModel):
    """Catalog rejection reason with routing domain (specimen vs analytical)."""

    reason: str
    domain: str = "specimen"


RejectionCriterionValue = Union[str, RejectionCriterionItem]


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


class TestBase(BaseModel):
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


class TestCreate(TestBase):
    synonyms: list[str] | None = None
    sampleVolume: str | None = None
    minimumVolume: float | None = None
    optimalVolume: float | None = None
    numberOfContainers: int | None = None
    containerDescription: str | None = None
    specialRequirements: str | None = None
    fastingRequired: bool = False
    collectionNotes: str | None = None
    rejectionCriteria: list[RejectionCriterionValue] | None = None
    validationRejectionCriteria: list[RejectionCriterionValue] | None = None
    referenceRanges: list | None = None
    resultItems: list | None = None
    panels: list[str] | None = None
    loincCodes: list[str] | None = None
    methodology: str | None = None
    confidence: str | None = None
    notes: str | None = None

    @field_validator("rejectionCriteria", mode="before")
    @classmethod
    def normalize_rejection_criteria_create(
        cls, value: list[RejectionCriterionValue] | None
    ) -> list[RejectionCriterionItem] | None:
        return _normalize_rejection_criteria(value)

    @field_validator("validationRejectionCriteria", mode="before")
    @classmethod
    def normalize_validation_rejection_criteria_create(
        cls, value: list[RejectionCriterionValue] | None
    ) -> list[RejectionCriterionItem] | None:
        return _normalize_rejection_criteria(value)


class TestUpdate(BaseModel):
    price: float | None = None
    isActive: bool | None = None


class TestResponse(TestBase):
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
    referenceRanges: list | None = None
    resultItems: list | None = None
    panels: list[str] | None = None
    loincCodes: list[str] | None = None
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
    
    class Config:
        from_attributes = True
