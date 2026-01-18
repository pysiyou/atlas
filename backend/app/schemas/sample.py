"""
Pydantic schemas for Sample
"""
from pydantic import BaseModel
from datetime import datetime
from app.schemas.enums import SampleStatus, SampleType, ContainerType, ContainerTopColor, PriorityLevel, RejectionReason


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


class SampleRejectRequest(BaseModel):
    rejectionReasons: list[RejectionReason]
    rejectionNotes: str | None = None
    recollectionRequired: bool = True


class RecollectionRequest(BaseModel):
    reason: str


class SampleResponse(SampleBase):
    sampleId: str
    orderId: str
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
    rejectionReasons: list[RejectionReason] | None = None
    rejectionNotes: str | None = None
    recollectionRequired: bool = False
    recollectionSampleId: str | None = None
    
    # Recollection Tracking
    isRecollection: bool = False
    originalSampleId: str | None = None
    recollectionReason: str | None = None
    recollectionAttempt: int = 1
    createdAt: datetime
    createdBy: str
    updatedAt: datetime
    updatedBy: str
    
    class Config:
        from_attributes = True
