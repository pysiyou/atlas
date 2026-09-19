"""Lab worklist API schemas."""
from datetime import datetime
from typing import Literal

from pydantic import BaseModel

from app.schemas.enums import (
    ContainerTopColor,
    ContainerType,
    PaymentStatus,
    PriorityLevel,
    SampleStatus,
    TestStatus,
)
from app.schemas.order import TestResultsDict


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
    testCodes: list[str]
    isRecollection: bool
    originalSampleId: int | None = None
    originalSampleCollectedAt: datetime | None = None
    recollectionReason: str | None = None
    recollectionAttempt: int = 1
    blockedReason: str | None = None
    waitingHours: float
    turnaroundHours: int
    actualContainerType: ContainerType | None = None
    actualContainerColor: ContainerTopColor | None = None
    collectedAt: datetime | None = None
    collectedBy: str | None = None
    collectedVolume: float | None = None


class EntryWorklistItem(BaseModel):
    orderTestId: int
    orderId: int
    patientId: int
    patientName: str
    testCode: str
    testName: str
    sampleId: int | None
    sampleType: str
    priority: PriorityLevel
    status: TestStatus
    collectedAt: datetime | None
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
    sampleId: int | None = None
    sampleStatus: SampleStatus | None = None
    results: TestResultsDict | None = None
    flags: list[str] | None = None
    enteredBy: str | None = None
    referringPhysician: str | None = None
    isRetest: bool = False
    retestOfTestId: int | None = None
    retestNumber: int = 0
    resultEnteredAt: datetime | None
    orderDate: datetime
    waitingHours: float
    turnaroundHours: int
    hasCriticalValues: bool


class WorklistResponse(BaseModel):
    items: list
    pagination: WorklistPagination


class QueueAgeStats(BaseModel):
    oldestHours: float | None
    averageHours: float | None
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
    blockedReason: str | None = None
    blockedLabel: str | None = None
    queueTab: Literal["collection", "entry", "validation"]
    since: str
    workItemCount: int
    orderTestIds: list[int]
    attentionType: str


class LabBoardResponse(BaseModel):
    counts: LabBoardCounts
    queueAge: dict[str, QueueAgeStats]
    blockers: BlockerSummary
    health: Literal["healthy", "attention", "critical"]
    healthMessage: str
    suggestedTab: str | None
    ageBuckets: AgeBuckets
    priorityMix: PriorityMix
    attentionItems: list[BoardAttentionItem]
    attentionTotal: int
    totalActive: int
    computedAt: str | None = None
