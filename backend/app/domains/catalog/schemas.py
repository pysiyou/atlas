"""Catalog API schemas — analytes, orderable tests, workups, affiliation pricing."""
from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, field_validator


# --- Analytes ---


class AnalyteSummaryResponse(BaseModel):
    """
    One analyte on an orderable test.

    ``contract`` is the authoritative ``analyte-catalog.json`` entry (snake_case keys).
    """

    analyteCode: str
    name: str
    loincCode: str | None = None
    unit: str | None = None
    specimen: str | None = None
    contract: dict[str, Any] = Field(
        ...,
        description="Full analyte-catalog.json entry (value_type, allowed_values, reference_range, …).",
    )


class AnalyteResponse(AnalyteSummaryResponse):
    model_config = {"from_attributes": True}


# --- Orderable tests ---


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
    contract: dict[str, Any] | None = Field(
        default=None,
        description="Full orderable-tests.json entry (snake_case keys) for this test_code.",
    )
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


# --- Clinical workups ---


class ClinicalWorkupResponse(BaseModel):
    code: str
    name: str
    description: str | None = None
    testCodes: list[str] = Field(default_factory=list)
    isActive: bool = True
    createdAt: datetime | None = None
    updatedAt: datetime | None = None

    model_config = {"from_attributes": True}


# --- Affiliation pricing ---


class AffiliationPricingResponse(BaseModel):
    duration: int
    price: float
    isActive: bool

    model_config = {"from_attributes": True}