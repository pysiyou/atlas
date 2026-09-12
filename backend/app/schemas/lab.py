"""Lab workflow API schemas (results, quality issues, escalation)."""
from datetime import datetime
from typing import Any, List, Literal, Optional

from pydantic import AliasChoices, BaseModel, Field, model_validator

from app.schemas.enums import QualityIssueTargetType, RemedyType, ValidationDecision
from app.schemas.order import TestResultsDict


class ResultEntryRequest(BaseModel):
    results: TestResultsDict
    technicianNotes: Optional[str] = None


class ResultValidationRequest(BaseModel):
    decision: ValidationDecision
    validationNotes: Optional[str] = None


class EscalationResolveResponse(BaseModel):
    success: bool
    action: str
    message: str
    escalatedTestId: int
    newTestId: Optional[int] = None
    newSampleId: Optional[int] = None


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
    validationNotes: Optional[str] = Field(None, max_length=1000)
    readBack: Optional[CriticalReadBackPayload] = None
    rejectionReason: Optional[str] = Field(
        None,
        min_length=1,
        max_length=1000,
        validation_alias=AliasChoices("rejectionReason", "rejection_reason"),
    )

    @model_validator(mode="after")
    def require_rejection_reason_for_cancel(self):
        if self.action in ("cancel_test", "authorize_recollect") and not (self.rejectionReason or "").strip():
            raise ValueError("rejectionReason is required for this action")
        return self


class PendingEscalationItemResponse(BaseModel):
    id: int
    orderId: int
    orderDate: datetime
    patientId: int
    patientName: str
    patientDob: Optional[str] = None
    testCode: str
    testName: str
    sampleType: str
    status: str
    sampleId: Optional[int] = None
    results: Optional[TestResultsDict] = None
    resultEnteredAt: Optional[datetime] = None
    enteredBy: Optional[str] = None
    resultValidatedAt: Optional[datetime] = None
    validatedBy: Optional[str] = None
    validationNotes: Optional[str] = None
    flags: Optional[List[str]] = None
    technicianNotes: Optional[str] = None
    hasCriticalValues: bool = False
    isRetest: bool = False
    retestOfTestId: Optional[int] = None
    retestNumber: int = 0
    priority: str
    referringPhysician: Optional[str] = None
    collectedAt: Optional[datetime] = None
    collectedBy: Optional[str] = None
    sampleIsRecollection: bool = False
    sampleOriginalSampleId: Optional[int] = None
    sampleRecollectionReason: Optional[str] = None
    sampleRecollectionAttempt: Optional[int] = None
    ticketId: Optional[int] = None
    reasonCode: Optional[str] = None
    severity: Optional[str] = None
    ticketMetadata: Optional[Any] = None

    class Config:
        from_attributes = True


class AmendmentRequest(BaseModel):
    amendmentReason: str = Field(..., min_length=1, max_length=1000)
    proposedResults: Optional[TestResultsDict] = None
    notes: Optional[str] = Field(None, max_length=1000)


class QualityIssueTarget(BaseModel):
    type: QualityIssueTargetType
    id: int


class ReportQualityIssueRequest(BaseModel):
    target: QualityIssueTarget
    reason: str = Field(..., min_length=1, max_length=500)
    notes: Optional[str] = Field(None, max_length=1000)
    preferredRemedy: Optional[RemedyType] = None


class QualityIssueResponse(BaseModel):
    id: int
    orderId: int
    orderTestId: Optional[int] = None
    sampleId: Optional[int] = None
    testCode: Optional[str] = None
    stage: str
    domain: str
    reason: str
    notes: Optional[str] = None
    remedy: str
    createdTestId: Optional[int] = None
    createdSampleId: Optional[int] = None
    createdBy: str
    createdAt: str

    class Config:
        from_attributes = True
