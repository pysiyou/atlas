"""Lab worklist API schemas."""
from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel

from app.schemas.enums import (
    ContainerTopColor,
    ContainerType,
    PriorityLevel,
    PaymentStatus,
    SampleStatus,
    TestStatus,
)


class WorklistPagination(BaseModel):
    page: int
    pageSize: int
    total: int
    totalPages: int
    hasNext: bool
    hasPrev: bool


class CollectionWorklistItem(BaseModel):
    sampleId: int
    orderId: int
    patientId: int
    patientName: str
    sampleType: str
    status: SampleStatus
    priority: PriorityLevel
    paymentStatus: PaymentStatus
    orderDate: datetime
    testCodes: List[str]
    isRecollection: bool
    originalSampleId: Optional[int] = None
    originalSampleCollectedAt: Optional[datetime] = None
    recollectionReason: Optional[str] = None
    recollectionAttempt: int = 1
    blockedReason: Optional[str] = None
    waitingHours: float
    turnaroundHours: int
    actualContainerType: Optional[ContainerType] = None
    actualContainerColor: Optional[ContainerTopColor] = None
    collectedAt: Optional[datetime] = None
    collectedBy: Optional[str] = None
    collectedVolume: Optional[float] = None


class EntryWorklistItem(BaseModel):
    orderTestId: int
    orderId: int
    patientId: int
    patientName: str
    testCode: str
    testName: str
    sampleId: Optional[int]
    sampleType: str
    priority: PriorityLevel
    status: TestStatus
    collectedAt: Optional[datetime]
    orderDate: datetime
    waitingHours: float
    turnaroundHours: int
    isRetest: bool


class ValidationWorklistItem(BaseModel):
    orderTestId: int
    orderId: int
    patientId: int
    patientName: str
    testCode: str
    testName: str
    sampleType: str
    priority: PriorityLevel
    status: TestStatus
    resultEnteredAt: Optional[datetime]
    orderDate: datetime
    waitingHours: float
    turnaroundHours: int
    hasCriticalValues: bool


class WorklistResponse(BaseModel):
    items: List
    pagination: WorklistPagination


class QueueAgeStats(BaseModel):
    oldestHours: Optional[float]
    averageHours: Optional[float]
    warningCount: int
    criticalCount: int


class BlockerSummary(BaseModel):
    paymentUnpaid: int
    retestPending: int
    recollectionWaiting: int
    total: int


class LabBoardCounts(BaseModel):
    collection: int
    entry: int
    validation: int
    supervisor: int


class AgeBuckets(BaseModel):
    fresh: int
    onTrack: int
    warning: int
    critical: int


class PriorityMix(BaseModel):
    urgent: int
    high: int
    medium: int
    low: int


class BoardAttentionItem(BaseModel):
    id: str
    stage: Literal["collection", "entry", "validation"]
    stageLabel: str
    orderId: int
    patientName: str
    priority: PriorityLevel
    waitingHours: float
    blockedReason: Optional[str] = None
    blockedLabel: Optional[str] = None
    queueTab: Literal["collection", "entry", "validation"]
    since: str
    workItemCount: int
    orderTestIds: List[int]
    attentionType: str


class LabBoardResponse(BaseModel):
    counts: LabBoardCounts
    queueAge: dict[str, QueueAgeStats]
    blockers: BlockerSummary
    health: Literal["healthy", "attention", "critical"]
    healthMessage: str
    suggestedTab: Optional[str]
    ageBuckets: AgeBuckets
    priorityMix: PriorityMix
    attentionItems: List[BoardAttentionItem]
    attentionTotal: int
    totalActive: int
    computedAt: Optional[str] = None
