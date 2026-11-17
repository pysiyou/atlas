"""
Pydantic schemas for Sample
"""
from datetime import datetime

from app.shared.contracts.enums import (
    ContainerTopColor,
    ContainerType,
    PriorityLevel,
    SampleStatus,
    SampleType,
)
from app.platform.utils import (
    EMPLOYEE_NUMBER_PATTERN,
    FILLER_PATTERN,
    LAB_ACTOR_USER_ID_PATTERN,
    SAMPLE_ID_PATTERN,
)
from pydantic import BaseModel, Field


class SampleBase(BaseModel):
    sampleType: SampleType
    status: SampleStatus
    testCodes: list[str]
    requiredVolume: float
    priority: PriorityLevel
    requiredContainerTypes: list[ContainerType]
    requiredContainerColors: list[ContainerTopColor]


class SampleCollectRequest(BaseModel):
    collectedVolume: float
    actualContainerType: ContainerType
    actualContainerColor: ContainerTopColor
    collectionNotes: str | None = None


class SampleAliquotCreateRequest(BaseModel):
    """Split remaining volume of a collected parent into child tubes."""

    count: int = Field(..., ge=1, le=20)
    aliquotVolume: float = Field(..., gt=0)
    testCodes: list[str] | None = None


class SampleResponse(SampleBase):
    sampleId: str = Field(..., pattern=SAMPLE_ID_PATTERN)
    orderId: str = Field(..., pattern=FILLER_PATTERN)
    collectedAt: datetime | None = None
    collectedBy: str | None = Field(None, pattern=LAB_ACTOR_USER_ID_PATTERN)
    collectedVolume: float | None = None
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

    class Config:
        from_attributes = True
