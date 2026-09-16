"""
Pydantic schemas for Sample
"""
from datetime import datetime

from pydantic import BaseModel

from app.schemas.enums import (
    ContainerTopColor,
    ContainerType,
    PriorityLevel,
    RejectionReason,
    SampleStatus,
    SampleType,
)


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


class SampleResponse(SampleBase):
    sampleId: int
    orderId: int
    collectedAt: datetime | None = None
    collectedBy: str | None = None
    collectedVolume: float | None = None
    actualContainerType: ContainerType | None = None
    actualContainerColor: ContainerTopColor | None = None
    collectionNotes: str | None = None
    remainingVolume: float | None = None
    qualityIssues: list[RejectionReason] | None = None
    qualityNotes: str | None = None
    rejectedAt: datetime | None = None
    rejectedBy: str | None = None
    rejectionReason: str | None = None
    rejectionNotes: str | None = None
    recollectionRequired: bool = False
    recollectionSampleId: int | None = None
    isRecollection: bool = False
    originalSampleId: int | None = None
    originalSampleCollectedAt: datetime | None = None
    recollectionReason: str | None = None
    recollectionAttempt: int = 1
    createdAt: datetime
    createdBy: str
    updatedAt: datetime
    updatedBy: str

    class Config:
        from_attributes = True
