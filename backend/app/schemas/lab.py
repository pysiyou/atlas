"""Lab workflow API schemas (results, quality issues, escalation)."""
from datetime import datetime
from typing import Any, Literal

from pydantic import AliasChoices, BaseModel, Field, model_validator

from app.schemas.enums import QualityIssueTargetType, RemedyType, ValidationDecision
from app.schemas.order import TestResultsDict


class ResultEntryRequest(BaseModel):
    results: TestResultsDict
    technicianNotes: str | None = None


class ResultValidationRequest(BaseModel):
    decision: ValidationDecision
    validationNotes: str | None = None
    rejectionReason: str | None = Field(None, min_length=1, max_length=1000)
    preferredRemedy: RemedyType | None = None

    @model_validator(mode="after")
    def reject_requires_reason_and_remedy(self):
        if self.decision == ValidationDecision.REJECTED:
            if not (self.rejectionReason or "").strip():
                raise ValueError("rejectionReason is required when decision is rejected")
            if self.preferredRemedy is None:
                raise ValueError("preferredRemedy is required when decision is rejected")
        return self


class EscalationResolveResponse(BaseModel):
    success: bool
    action: str
    message: str
    escalatedTestId: int
    newTestId: int | None = None
    newSampleId: int | None = None


EscalationResolveActionLiteral = Literal[
    "force_validate",
    "authorize_retest",
    "authorize_recollect",
    "apply_amendment",
    "cancel_test",
]


class CriticalReadBackPayload(BaseModel):
    providerName: str = Field(..., min_length=1, max_length=200)
    providerContact: str = Field(..., min_length=1, max_length=200)
    notifiedAt: datetime
    readBackConfirmed: bool


class EscalationResolveRequest(BaseModel):
    action: EscalationResolveActionLiteral = Field(
        ...,
        description="'force_validate' | 'authorize_retest' | 'authorize_recollect' | 'apply_amendment' | 'cancel_test'",
    )
    validationNotes: str | None = Field(None, max_length=1000)
    readBack: CriticalReadBackPayload | None = None
    rejectionReason: str | None = Field(
        None,
        min_length=1,
        max_length=1000,
        validation_alias=AliasChoices("rejectionReason", "rejection_reason"),
    )

    @model_validator(mode="after")
    def require_rejection_reason_for_cancel(self):
        if (
            self.action in ("cancel_test", "authorize_recollect")
            and not (self.rejectionReason or "").strip()
        ):
            raise ValueError("rejectionReason is required for this action")
        return self


class PendingEscalationItemResponse(BaseModel):
    id: int
    orderId: int
    orderDate: datetime
    patientId: int
    patientName: str
    patientDob: str | None = None
    testCode: str
    testName: str
    sampleType: str
    status: str
    sampleId: int | None = None
    results: TestResultsDict | None = None
    resultEnteredAt: datetime | None = None
    enteredBy: str | None = None
    resultValidatedAt: datetime | None = None
    validatedBy: str | None = None
    validationNotes: str | None = None
    flags: list[str] | None = None
    technicianNotes: str | None = None
    hasCriticalValues: bool = False
    isRetest: bool = False
    retestOfTestId: int | None = None
    retestNumber: int = 0
    priority: str
    referringPhysician: str | None = None
    collectedAt: datetime | None = None
    collectedBy: str | None = None
    sampleIsRecollection: bool = False
    sampleOriginalSampleId: int | None = None
    sampleRecollectionReason: str | None = None
    sampleRecollectionAttempt: int | None = None
    ticketId: int | None = None
    reasonCode: str | None = None
    severity: str | None = None
    ticketMetadata: Any | None = None

    class Config:
        from_attributes = True


class AmendmentRequest(BaseModel):
    amendmentReason: str = Field(..., min_length=1, max_length=1000)
    proposedResults: TestResultsDict | None = None
    notes: str | None = Field(None, max_length=1000)


class QualityIssueTarget(BaseModel):
    type: QualityIssueTargetType
    id: int


class ReportQualityIssueRequest(BaseModel):
    target: QualityIssueTarget
    reason: str = Field(..., min_length=1, max_length=500)
    notes: str | None = Field(None, max_length=1000)
    preferredRemedy: RemedyType | None = None


class QualityIssueResponse(BaseModel):
    id: int
    orderId: int
    orderTestId: int | None = None
    sampleId: int | None = None
    testCode: str | None = None
    stage: str
    domain: str
    reason: str
    notes: str | None = None
    remedy: str
    createdTestId: int | None = None
    createdSampleId: int | None = None
    createdBy: str
    createdAt: str

    class Config:
        from_attributes = True
