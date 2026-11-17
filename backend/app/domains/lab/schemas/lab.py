"""Lab workflow API schemas (results, quality issues)."""
from datetime import datetime
from typing import Any

from app.domains.lab.rules.work_item_projection import (
    LabWorkItemProjection,
    LabWorklistAllowedActions,
)
from app.domains.orders.schemas import TestResultsDict
from app.shared.contracts.enums import (
    QualityIssueTargetType,
    QualityStage,
    RemedyType,
    ValidationDecision,
)
from app.platform.utils import (
    FILLER_PATTERN,
    LAB_ACTOR_USER_ID_PATTERN,
    MRN_PATTERN,
    REFERENT_DOCTOR_ID_PATTERN,
    SAMPLE_ID_PATTERN,
)
from pydantic import BaseModel, Field, model_validator


class ResultEntryRequest(BaseModel):
    results: TestResultsDict
    technicianNotes: str | None = None


class ResultValidationRequest(BaseModel):
    decision: ValidationDecision
    validationNotes: str | None = None
    rejectionReason: str | None = Field(None, min_length=1, max_length=1000)
    preferredRemedy: RemedyType | None = None
    criticalSeen: bool | None = Field(
        None,
        description="Required on approve when the result has critical flags.",
    )

    @model_validator(mode="after")
    def reject_requires_reason_and_remedy(self):
        if self.decision == ValidationDecision.REJECTED:
            if not (self.rejectionReason or "").strip():
                raise ValueError("rejectionReason is required when decision is rejected")
            if self.preferredRemedy is None:
                raise ValueError("preferredRemedy is required when decision is rejected")
            if self.preferredRemedy not in (
                RemedyType.RETRY_SAME_SAMPLE,
                RemedyType.REQUEST_RECOLLECTION,
                RemedyType.CANCEL,
            ):
                raise ValueError(
                    "preferredRemedy must be retry_same_sample, request_recollection, or cancel"
                )
        return self


class PendingEscalationItemResponse(BaseModel):
    id: int
    orderId: str = Field(..., pattern=FILLER_PATTERN)
    orderDate: datetime
    patientId: str = Field(..., pattern=MRN_PATTERN)
    patientName: str
    patientDob: str | None = None
    testCode: str
    testName: str
    sampleType: str
    status: str
    sampleId: str | None = Field(None, pattern=SAMPLE_ID_PATTERN)
    results: TestResultsDict | None = None
    resultEnteredAt: datetime | None = None
    enteredBy: str | None = Field(None, pattern=LAB_ACTOR_USER_ID_PATTERN)
    resultValidatedAt: datetime | None = None
    validatedBy: str | None = Field(None, pattern=LAB_ACTOR_USER_ID_PATTERN)
    validationNotes: str | None = None
    flags: list[str] | None = None
    technicianNotes: str | None = None
    hasCriticalValues: bool = False
    isRetest: bool = False
    retestOfTestId: int | None = None
    retestNumber: int = 0
    priorTestDisplay: str | None = None
    priority: str
    referentDoctorId: str | None = Field(None, pattern=REFERENT_DOCTOR_ID_PATTERN)
    referentDoctorName: str | None = None
    referentDoctorEmail: str | None = None
    referentDoctorPhone: str | None = None
    referentDoctorHospital: str | None = None
    referentDoctorUsername: str | None = None
    collectedAt: datetime | None = None
    collectedBy: str | None = Field(None, pattern=LAB_ACTOR_USER_ID_PATTERN)
    sampleIsRecollection: bool = False
    sampleOriginalSampleId: str | None = Field(None, pattern=SAMPLE_ID_PATTERN)
    sampleRecollectionReason: str | None = None
    sampleRecollectionAttempt: int | None = None
    ticketId: int | None = None
    reasonCode: str | None = None
    severity: str | None = None
    ticketMetadata: Any | None = None
    criticalNotificationSent: bool = False
    allowForceValidate: bool = True
    lab: LabWorkItemProjection | None = None
    allowedActions: LabWorklistAllowedActions | None = None
    denyReason: str | None = None
    denyMessage: str | None = None

    class Config:
        from_attributes = True


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
