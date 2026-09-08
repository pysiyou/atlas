"""
Results API Routes - for result entry and validation

Uses the unified LabOperationsService for all operations.
"""
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel, Field, AliasChoices, model_validator
from typing import Optional, List, Any, Literal
from app.database import get_db

logger = logging.getLogger(__name__)
from app.core.dependencies import (
    get_current_user,
    require_role,
    require_lab_tech,
    require_lab_tech_plus,
    require_admin,
)
from app.models.user import User
from app.models.order import Order, OrderTest
from app.models.sample import Sample
from app.models.escalation import EscalationTicket
from app.schemas.enums import EscalationTicketStatus
from app.schemas.enums import TestStatus, UserRole, ValidationDecision, EscalationResolutionAction
from app.schemas.order import TestResultsDict
from app.services.lab_operations import (
    LabOperationsService,
    LabOperationError,
    EscalationResolveResult,
)
from app.services.order_status_updater import update_order_status

router = APIRouter()


class ResultEntryRequest(BaseModel):
    """Request body for entering test results"""
    results: TestResultsDict  # Record<string, TestResult>
    technicianNotes: Optional[str] = None


class ResultValidationRequest(BaseModel):
    """Request body for validating (approving) test results"""
    decision: ValidationDecision
    validationNotes: Optional[str] = None


class EscalationResolveResponse(BaseModel):
    """Response for escalation resolution."""
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
    """Required for force_validate on CRIT-VAL escalation tickets."""
    providerName: str = Field(..., min_length=1, max_length=200)
    providerContact: str = Field(..., min_length=1, max_length=200)
    notifiedAt: datetime
    readBackConfirmed: bool


class EscalationResolveRequest(BaseModel):
    """Request body for resolving an escalated test (admin/labtech_plus only)."""
    action: EscalationResolveActionLiteral = Field(
        ...,
        description="'force_validate' | 'authorize_retest' | 'authorize_recollect' | 'apply_amendment' | 'cancel_test'"
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


require_escalation_resolver = require_role(UserRole.ADMIN, UserRole.LAB_TECH_PLUS)


class PendingEscalationItemResponse(BaseModel):
    """Enriched escalation item for frontend TestWithContext (order + patient + test + sample context)."""
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


@router.get("/results/pending-escalation", response_model=List[PendingEscalationItemResponse])
def get_pending_escalation(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_escalation_resolver)
):
    """
    Get tests pending escalation resolution (admin/labtech_plus only).
    Returns enriched list (order + patient + test + sample context) for Escalation tab.
    """
    tests = (
        db.query(OrderTest)
        .filter(OrderTest.status == TestStatus.ESCALATED)
        .options(
            joinedload(OrderTest.order).joinedload(Order.patient),
            joinedload(OrderTest.test),
        )
        .all()
    )
    sample_ids = [t.sampleId for t in tests if t.sampleId]
    samples_by_id = {}
    if sample_ids:
        for s in db.query(Sample).filter(Sample.sampleId.in_(sample_ids)).all():
            samples_by_id[s.sampleId] = s

    test_ids = [t.id for t in tests]
    tickets_by_test: dict[int, EscalationTicket] = {}
    if test_ids:
        open_tickets = (
            db.query(EscalationTicket)
            .filter(
                EscalationTicket.orderTestId.in_(test_ids),
                EscalationTicket.status == EscalationTicketStatus.OPEN,
            )
            .all()
        )
        for ticket in open_tickets:
            tickets_by_test[ticket.orderTestId] = ticket

    out = []
    for t in tests:
        order = t.order
        patient = order.patient if order else None
        sample = samples_by_id.get(t.sampleId) if t.sampleId else None
        test_def = t.test
        out.append(
            PendingEscalationItemResponse(
                id=t.id,
                orderId=t.orderId,
                orderDate=order.orderDate,
                patientId=order.patientId,
                patientName=patient.fullName if patient else "Unknown",
                patientDob=patient.dateOfBirth if patient else None,
                testCode=t.testCode,
                testName=test_def.displayName if test_def else t.testCode,
                sampleType=test_def.sampleType if test_def else "Unknown",
                status=t.status.value,
                sampleId=t.sampleId,
                results=t.results,
                resultEnteredAt=t.resultEnteredAt,
                enteredBy=t.enteredBy,
                resultValidatedAt=t.resultValidatedAt,
                validatedBy=t.validatedBy,
                validationNotes=t.validationNotes,
                flags=t.flags,
                technicianNotes=t.technicianNotes,
                hasCriticalValues=t.hasCriticalValues or False,
                isRetest=t.isRetest or False,
                retestOfTestId=t.retestOfTestId,
                retestNumber=t.retestNumber or 0,
                priority=order.priority.value if order and order.priority else "low",
                referringPhysician=order.referringPhysician if order else None,
                collectedAt=sample.collectedAt if sample else None,
                collectedBy=sample.collectedBy if sample else None,
                sampleIsRecollection=sample.isRecollection if sample else False,
                sampleOriginalSampleId=sample.originalSampleId if sample else None,
                sampleRecollectionReason=sample.recollectionReason if sample else None,
                sampleRecollectionAttempt=sample.recollectionAttempt if sample else None,
                ticketId=tickets_by_test[t.id].id if t.id in tickets_by_test else None,
                reasonCode=tickets_by_test[t.id].reasonCode.value if t.id in tickets_by_test else None,
                severity=tickets_by_test[t.id].severity.value if t.id in tickets_by_test else None,
                ticketMetadata=tickets_by_test[t.id].ticketMetadata if t.id in tickets_by_test else None,
            )
        )
    return out


@router.post("/results/order-tests/{orderTestId}")
def enter_results(
    orderTestId: int,
    result_data: ResultEntryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lab_tech),
):
    """Enter results for a specific order test."""
    try:
        service = LabOperationsService(db)
        return service.enter_results(
            order_test_id=orderTestId,
            user_id=current_user.id,
            results=result_data.results,
            technician_notes=result_data.technicianNotes,
        )
    except LabOperationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/results/order-tests/{orderTestId}/validate")
def validate_results(
    orderTestId: int,
    validation_data: ResultValidationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lab_tech),
):
    """Validate (approve) a specific order test."""
    if validation_data.decision != ValidationDecision.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="For quality issues, use POST /lab/quality-issues.",
        )

    try:
        service = LabOperationsService(db)
        return service.validate_results(
            order_test_id=orderTestId,
            user_id=current_user.id,
            validation_notes=validation_data.validationNotes,
        )
    except LabOperationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


class AmendmentRequest(BaseModel):
    """Request body for requesting amendment of validated results"""
    amendmentReason: str = Field(..., min_length=1, max_length=1000)
    proposedResults: Optional[TestResultsDict] = None
    notes: Optional[str] = Field(None, max_length=1000)


@router.post("/results/order-tests/{orderTestId}/request-amendment")
def request_amendment(
    orderTestId: int,
    amendment_data: AmendmentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lab_tech),
):
    """
    Request amendment for a validated test result.
    Creates AMEND-RES escalation ticket for supervisor review.
    """
    try:
        service = LabOperationsService(db)
        return service.request_amendment(
            order_test_id=orderTestId,
            user_id=current_user.id,
            amendment_reason=amendment_data.amendmentReason,
            proposed_results=amendment_data.proposedResults,
            notes=amendment_data.notes,
        )
    except LabOperationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/results/order-tests/{orderTestId}/escalation/resolve", response_model=EscalationResolveResponse)
def resolve_escalation(
    orderTestId: int,
    body: EscalationResolveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_escalation_resolver),
):
    """Resolve an escalated order test (admin/labtech_plus only)."""
    try:
        service = LabOperationsService(db)
        read_back = body.readBack.model_dump(mode="json") if body.readBack else None
        result = service.resolve_escalation(
            order_test_id=orderTestId,
            user_id=current_user.id,
            action=EscalationResolutionAction(body.action),
            validation_notes=body.validationNotes,
            rejection_reason=body.rejectionReason,
            read_back_payload=read_back,
        )
        return EscalationResolveResponse(
            success=result.success,
            action=result.action.value,
            message=result.message,
            escalatedTestId=result.escalatedTestId,
            newTestId=result.newTestId,
            newSampleId=result.newSampleId,
        )
    except LabOperationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
