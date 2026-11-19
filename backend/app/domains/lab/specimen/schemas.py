"""Pydantic schemas for Sample."""
from __future__ import annotations

import re
from datetime import datetime

from app.shared.generated.enums import (
    ContainerTopColor,
    ContainerType,
    PriorityLevel,
    SampleStatus,
    SampleType,
)
from app.shared.clinical import (
    EMPLOYEE_NUMBER_PATTERN,
    FILLER_PATTERN,
    LAB_ACTOR_USER_ID_PATTERN,
    SAMPLE_ID_PATTERN,
    TEST_MNEMONIC_PATTERN,
)
from app.domains.lab.specimen.volume import SpecimenVolumeStatus, classify_specimen_volume
from pydantic import BaseModel, Field, computed_field, field_validator

_TEST_MNEMONIC_RE = re.compile(TEST_MNEMONIC_PATTERN)


class SampleBase(BaseModel):
    sampleType: SampleType
    status: SampleStatus
    testCodes: list[str]
    requiredVolume: float
    optimalVolume: float = 0
    priority: PriorityLevel
    requiredContainerTypes: list[ContainerType]
    requiredContainerColors: list[ContainerTopColor]


class SampleCollectRequest(BaseModel):
    collectedVolume: float
    actualContainerType: ContainerType
    actualContainerColor: ContainerTopColor
    collectionNotes: str | None = None


class SampleReceiveRequest(BaseModel):
    receivedVolumeMl: float = Field(..., ge=0)
    notes: str | None = None


class SampleAliquotCreateRequest(BaseModel):
    """Split remaining volume of a collected parent into child tubes."""

    count: int = Field(..., ge=1, le=20)
    aliquotVolume: float = Field(..., gt=0)
    testCodes: list[str] | None = Field(
        None,
        description="Optional subset of tests for aliquots",
    )

    @field_validator("testCodes")
    @classmethod
    def validate_test_codes(cls, v: list[str] | None) -> list[str] | None:
        if v is None:
            return v
        out: list[str] = []
        for code in v:
            upper = code.strip().upper()
            if not _TEST_MNEMONIC_RE.fullmatch(upper):
                raise ValueError(f"Invalid test code: {code}")
            out.append(upper)
        return out


class SampleResponse(SampleBase):
    sampleId: str = Field(..., pattern=SAMPLE_ID_PATTERN)
    orderId: str = Field(..., pattern=FILLER_PATTERN)
    collectedAt: datetime | None = None
    collectedBy: str | None = Field(None, pattern=LAB_ACTOR_USER_ID_PATTERN)
    collectedVolume: float | None = None
    receivedVolumeMl: float | None = None
    actualContainerType: ContainerType | None = None
    actualContainerColor: ContainerTopColor | None = None
    collectionNotes: str | None = None
    remainingVolume: float | None = None
    qualityIssues: list[str] | None = None
    qualityNotes: str | None = None
    rejectedAt: datetime | None = None
    rejectedBy: str | None = Field(None, pattern=LAB_ACTOR_USER_ID_PATTERN)
    rejectionReason: str | None = None
    rejectionNotes: str | None = None
    recollectionRequired: bool = False
    recollectionSampleId: str | None = Field(None, pattern=SAMPLE_ID_PATTERN)
    isRecollection: bool = False
    originalSampleId: str | None = Field(None, pattern=SAMPLE_ID_PATTERN)
    originalSampleCollectedAt: datetime | None = None
    recollectionReason: str | None = None
    recollectionAttempt: int = 1
    parentSampleId: str | None = Field(None, pattern=SAMPLE_ID_PATTERN)
    isAliquot: bool = False
    aliquotIndex: int | None = None
    aliquotVolume: float | None = None
    createdAt: datetime
    createdBy: str = Field(..., pattern=EMPLOYEE_NUMBER_PATTERN)
    updatedAt: datetime
    updatedBy: str = Field(..., pattern=EMPLOYEE_NUMBER_PATTERN)

    @computed_field  # type: ignore[prop-decorator]
    @property
    def volumeStatus(self) -> SpecimenVolumeStatus | None:
        measured = self.receivedVolumeMl if self.receivedVolumeMl is not None else None
        if measured is None:
            return None
        return classify_specimen_volume(
            float(measured),
            float(self.requiredVolume),
            float(self.optimalVolume),
        )

    class Config:
        from_attributes = True
