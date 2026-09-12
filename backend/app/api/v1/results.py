"""Results API Routes — result entry and validation."""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import (
    get_current_user,
    require_lab_tech,
    require_role,
)
from app.database import get_db
from app.models.user import User
from app.schemas.enums import EscalationResolutionAction, UserRole, ValidationDecision
from app.schemas.lab import (
    AmendmentRequest,
    EscalationResolveRequest,
    EscalationResolveResponse,
    PendingEscalationItemResponse,
    ResultEntryRequest,
    ResultValidationRequest,
)
from app.services.lab.results import ResultQueryService
from app.services.lab.workflow import LabOperationsService, LabOperationError

router = APIRouter()

require_escalation_resolver = require_role(UserRole.ADMIN, UserRole.LAB_TECH_PLUS)


@router.get("/results/pending-escalation", response_model=List[PendingEscalationItemResponse])
def get_pending_escalation(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lab_tech),
):
    return ResultQueryService(db).get_pending_escalation()


@router.get("/results/order-tests/{orderTestId}", response_model=PendingEscalationItemResponse)
def get_order_test_context(
    orderTestId: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return ResultQueryService(db).get_order_test_context(orderTestId)


@router.post("/results/order-tests/{orderTestId}")
def enter_results(
    orderTestId: int,
    result_data: ResultEntryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lab_tech),
):
    try:
        return LabOperationsService(db).enter_results(
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
    if validation_data.decision != ValidationDecision.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="For quality issues, use POST /lab/quality-issues.",
        )
    try:
        return LabOperationsService(db).validate_results(
            order_test_id=orderTestId,
            user_id=current_user.id,
            validation_notes=validation_data.validationNotes,
        )
    except LabOperationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/results/order-tests/{orderTestId}/request-amendment")
def request_amendment(
    orderTestId: int,
    amendment_data: AmendmentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lab_tech),
):
    try:
        return LabOperationsService(db).request_amendment(
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
    try:
        read_back = body.readBack.model_dump(mode="json") if body.readBack else None
        result = LabOperationsService(db).resolve_escalation(
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
