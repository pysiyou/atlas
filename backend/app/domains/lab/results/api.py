"""Lab result entry and validation routes."""

from __future__ import annotations

from app.domains.lab.deps import get_lab_operations_service
from app.domains.lab.results.query import ResultQueryService
from app.domains.lab.results.schemas import (
    EscalationResolveRequest,
    EscalationResolveResult,
    PendingEscalationItemResponse,
    ResultEntryRequest,
    ResultValidationRequest,
)
from app.domains.lab.workflow.operations import LabOperationsService
from app.domains.users.models import User
from app.platform.database import get_db
from app.platform.http import get_current_user, require_lab_tech
from app.shared.api import OrderTestIdPath
from app.shared.generated.enums import ValidationDecision
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

router = APIRouter()


@router.get("/results/pending-escalation", response_model=list[PendingEscalationItemResponse])
def list_pending_escalation(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lab_tech),
):
    """Supervisor queue: tests in ESCALATED status, including re-test / recollection limit hits."""
    return ResultQueryService(db).list_pending_escalation(
        viewer_validator_id=current_user.id
    )


@router.get("/results/order-tests/{orderTestId}", response_model=PendingEscalationItemResponse)
def get_order_test_context(
    orderTestId: OrderTestIdPath,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return ResultQueryService(db).get_order_test_context(
        orderTestId, viewer_validator_id=current_user.id
    )


@router.post("/results/order-tests/{orderTestId}")
def enter_results(
    orderTestId: OrderTestIdPath,
    result_data: ResultEntryRequest,
    service: LabOperationsService = Depends(get_lab_operations_service),
    current_user: User = Depends(require_lab_tech),
):
    return service.enter_results(
        order_test_id=orderTestId,
        user_id=current_user.id,
        results=result_data.results,
        technician_notes=result_data.technicianNotes,
    )


@router.post("/results/order-tests/{orderTestId}/validate")
def validate_results(
    orderTestId: OrderTestIdPath,
    validation_data: ResultValidationRequest,
    service: LabOperationsService = Depends(get_lab_operations_service),
    current_user: User = Depends(require_lab_tech),
):
    if validation_data.decision == ValidationDecision.REJECTED:
        return service.reject_results(
            order_test_id=orderTestId,
            user_id=current_user.id,
            rejection_reason=validation_data.rejectionReason or "",
            validation_notes=validation_data.validationNotes,
            preferred_remedy=validation_data.preferredRemedy,
        )
    return service.validate_results(
        order_test_id=orderTestId,
        user_id=current_user.id,
        validation_notes=validation_data.validationNotes,
        critical_seen=bool(validation_data.criticalSeen),
    )


@router.post(
    "/results/order-tests/{orderTestId}/escalation/resolve",
    response_model=EscalationResolveResult,
)
def resolve_escalation(
    orderTestId: OrderTestIdPath,
    body: EscalationResolveRequest,
    service: LabOperationsService = Depends(get_lab_operations_service),
    current_user: User = Depends(require_lab_tech),
):
    return service.resolve_escalation(
        order_test_id=orderTestId,
        user_id=current_user.id,
        action=body.action,
        validation_notes=body.validationNotes,
        rejection_reason=body.rejectionReason,
    )