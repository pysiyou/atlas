"""Lab worklist API schemas."""
from __future__ import annotations

from datetime import datetime
from typing import Literal

from app.domains.lab.rules.projection import LabWorklistAllowedActions, PipelineStage
from app.domains.orders.schemas import TestResultsDict
from app.shared.generated.enums import (
    ContainerTopColor,
    ContainerType,
    Gender,
    PaymentStatus,
    PriorityLevel,
    SampleStatus,
    TestStatus,
)
from app.shared.api import StatusPresentation
from pydantic import BaseModel, Field


class WorklistPagination(BaseModel):
    page: int
    pageSize: int
    total: int
    totalPages: int
    hasNext: bool
    hasPrev: bool


class CollectionWorklistItem(BaseModel):
    sampleId: str
    orderId: str
    patientId: str
    patientName: str
    sampleType: str
    status: SampleStatus
    priority: PriorityLevel
    paymentStatus: PaymentStatus
    orderDate: datetime
    testCodes: list[str]
    isAliquot: bool = False
    parentSampleId: str | None = None
    isRecollection: bool
    originalSampleId: str | None = None
    originalSampleCollectedAt: datetime | None = None
    recollectionSampleId: str | None = None
    recollectionReason: str | None = None
    recollectionAttempt: int = 1
    pipelineStage: PipelineStage | None = None
    attentionReason: str | None = None
    attentionLabel: str | None = None
    allowedActions: LabWorklistAllowedActions = LabWorklistAllowedActions()
    denyReason: str | None = None
    denyMessage: str | None = None
    statusPresentation: StatusPresentation | None = None
    waitingHours: float
    turnaroundHours: int
    actualContainerType: ContainerType | None = None
    actualContainerColor: ContainerTopColor | None = None
    collectedAt: datetime | None = None
    collectedBy: str | None = None
    collectedVolume: float | None = None
    requiredVolume: float = 0
    requiredContainerTypes: list[ContainerType] = Field(default_factory=list)
    requiredContainerColors: list[ContainerTopColor] = Field(default_factory=list)
    referentDoctorId: str | None = None
    referentDoctorName: str | None = None
    referentDoctorEmail: str | None = None
    referentDoctorPhone: str | None = None
    referentDoctorHospital: str | None = None
    referentDoctorUsername: str | None = None
    testName: str | None = None
    testCategory: str | None = None
    queueAgeBand: Literal["fresh", "onTrack", "warning", "critical"] | None = None
    priorityRank: int | None = None


class EntryWorklistItem(BaseModel):
    orderTestId: int
    orderId: str
    patientId: str
    patientName: str
    testCode: str
    testName: str
    sampleId: str | None
    sampleType: str
    priority: PriorityLevel
    status: TestStatus
    collectedAt: datetime | None
    orderDate: datetime
    waitingHours: float
    turnaroundHours: int
    isRetest: bool
    retestOfTestId: int | None = None
    retestNumber: int = 0
    priorTestDisplay: str | None = None
    sampleIsRecollection: bool = False
    sampleOriginalSampleId: str | None = None
    sampleRecollectionAttempt: int | None = None
    referentDoctorId: str | None = None
    referentDoctorName: str | None = None
    referentDoctorEmail: str | None = None
    referentDoctorPhone: str | None = None
    referentDoctorHospital: str | None = None
    referentDoctorUsername: str | None = None
    testCategory: str | None = None
    pipelineStage: PipelineStage | None = None
    attentionReason: str | None = None
    attentionLabel: str | None = None
    allowedActions: LabWorklistAllowedActions = LabWorklistAllowedActions()
    denyReason: str | None = None
    denyMessage: str | None = None
    statusPresentation: StatusPresentation | None = None
    queueAgeBand: Literal["fresh", "onTrack", "warning", "critical"] | None = None
    priorityRank: int | None = None


class DashboardWorklistItem(BaseModel):
    """In-pipeline order tests plus rows updated today (any status)."""

    orderTestId: int
    orderId: str
    patientId: str
    patientName: str
    patientDob: str
    patientGender: Gender
    testCode: str
    testName: str
    sampleType: str
    priority: PriorityLevel
    status: TestStatus
    stage: Literal["collection", "entry", "validation"]
    activityAt: datetime
    orderDate: datetime
    referentDoctorId: str | None = None
    referentDoctorName: str | None = None
    referentDoctorEmail: str | None = None
    referentDoctorPhone: str | None = None
    referentDoctorHospital: str | None = None
    referentDoctorUsername: str | None = None
    testCategory: str | None = None
    attentionReason: str | None = None
    attentionLabel: str | None = None
    statusPresentation: StatusPresentation | None = None


class ValidationWorklistItem(BaseModel):
    orderTestId: int
    orderId: str
    patientId: str
    patientName: str
    testCode: str
    testName: str
    sampleType: str
    priority: PriorityLevel
    status: TestStatus
    sampleId: str | None = None
    sampleStatus: SampleStatus | None = None
    results: TestResultsDict | None = None
    flags: list[str] | None = None
    enteredBy: str | None = None
    referentDoctorId: str | None = None
    referentDoctorName: str | None = None
    referentDoctorEmail: str | None = None
    referentDoctorPhone: str | None = None
    referentDoctorHospital: str | None = None
    referentDoctorUsername: str | None = None
    isRetest: bool = False
    retestOfTestId: int | None = None
    retestNumber: int = 0
    priorTestDisplay: str | None = None
    sampleIsRecollection: bool = False
    sampleOriginalSampleId: str | None = None
    sampleRecollectionAttempt: int | None = None
    resultEnteredAt: datetime | None
    orderDate: datetime
    waitingHours: float
    turnaroundHours: int
    hasCriticalValues: bool
    testCategory: str | None = None
    pipelineStage: PipelineStage | None = None
    attentionReason: str | None = None
    attentionLabel: str | None = None
    allowedActions: LabWorklistAllowedActions = LabWorklistAllowedActions()
    denyReason: str | None = None
    denyMessage: str | None = None
    statusPresentation: StatusPresentation | None = None
    queueAgeBand: Literal["fresh", "onTrack", "warning", "critical"] | None = None
    priorityRank: int | None = None


class WorklistResponse(BaseModel):
    items: list
    pagination: WorklistPagination


class CollectionWorklistResponse(BaseModel):
    items: list[CollectionWorklistItem]
    pagination: WorklistPagination


class EntryWorklistResponse(BaseModel):
    items: list[EntryWorklistItem]
    pagination: WorklistPagination


class ValidationWorklistResponse(BaseModel):
    items: list[ValidationWorklistItem]
    pagination: WorklistPagination


class DashboardWorklistResponse(BaseModel):
    items: list[DashboardWorklistItem]
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
    orderId: str
    patientId: str | None = None
    patientName: str
    sampleId: str | None = None
    testCodes: list[str] = Field(default_factory=list)
    priority: PriorityLevel
    waitingHours: float
    attentionReason: str | None = None
    attentionLabel: str | None = None
    queueTab: Literal["collection", "entry", "validation"]
    since: str
    workItemCount: int
    orderTestIds: list[int]
    attentionType: str


class LabTodayStageSnapshot(BaseModel):
    """Per pipeline stage: current queue depth, today's activity, and share of monitor universe."""

    stage: Literal["collection", "entry", "validation"]
    atStage: int
    atStagePercent: int
    touchedToday: int
    touchedTodayPercent: int


class LabTodayPanelSnapshot(BaseModel):
    """Lab monitor today panel — stage queue vs today's milestones (% of totalTests)."""

    dayStartUtc: datetime
    totalTests: int
    testsUpdatedToday: int
    stages: list[LabTodayStageSnapshot]


class LabBoardSummaryResponse(BaseModel):
    """Lightweight board payload for tab badges and idle polling."""

    counts: LabBoardCounts
    health: Literal["healthy", "attention", "critical"]
    healthMessage: str
    suggestedTab: str | None = None
    totalActive: int
    computedAt: str | None = None
    todayPanel: LabTodayPanelSnapshot


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
    todayPanel: LabTodayPanelSnapshot
