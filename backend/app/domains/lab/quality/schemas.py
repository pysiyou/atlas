"""Critical values and quality-issue API schemas."""
from __future__ import annotations

from datetime import datetime

from app.shared.generated.enums import (
    QualityIssueTargetType,
    QualityStage,
    RemedyType,
)
from pydantic import BaseModel, Field


class CriticalValueResponse(BaseModel):
    id: int
    orderId: str
    testCode: str
    testName: str | None
    patientId: str
    patientName: str
    sampleId: str | None = None
    flags: list[str] | None
    criticalNotificationSent: bool
    criticalNotifiedAt: datetime | None
    criticalNotifiedTo: str | None
    criticalAcknowledgedAt: datetime | None
    resultEnteredAt: datetime | None
    status: str

    class Config:
        from_attributes = True


class NotifyRequest(BaseModel):
    notifiedTo: str
    notificationMethod: str = "phone"
    notes: str | None = None


class AcknowledgeRequest(BaseModel):
    acknowledgedBy: str
    notes: str | None = None


class BulkNotifyRequest(BaseModel):
    testIds: list[int]
    notifiedTo: str
    notificationMethod: str = "phone"


class QualityIssueTarget(BaseModel):
    type: QualityIssueTargetType
    id: str


class ReportQualityIssueRequest(BaseModel):
    target: QualityIssueTarget
    reason: str = Field(..., min_length=1, max_length=500)
    notes: str | None = Field(None, max_length=1000)
    preferredRemedy: RemedyType | None = None


class QualityIssueOptions(BaseModel):
    targetType: QualityIssueTargetType
    targetId: str
    orderId: str
    testCode: str | None = None
    sampleId: str | None = None
    stage: QualityStage
    allowedCriteria: list[str] = []
    allowedRemedies: list[RemedyType] = []
    suggestedRemedy: RemedyType | None = None
    retestAttemptsUsed: int = 0
    retestAttemptsRemaining: int = 0
    recollectionAttemptsUsed: int = 0
    recollectionAttemptsRemaining: int = 0
    willEscalate: bool = False
    previewRemedy: RemedyType | None = None
    previewMessage: str = ""
    hasSpecimenCriteria: bool = False
    hasAnalyticalCriteria: bool = False
    resultedTestsCount: int = 0
    validatedTestsCount: int = 0
    unfinishedTestsCount: int = 0
    awaitingRecollectionTestsCount: int = 0
    sampleRejected: bool = False


class QualityIssueResult(BaseModel):
    success: bool
    remedy: RemedyType
    message: str
    qualityIssueId: int
    orderId: str
    testCode: str | None = None
    sampleId: str | None = None
    orderTestId: int | None = None
    createdTestId: int | None = None
    createdSampleId: str | None = None
    escalationRequired: bool = False