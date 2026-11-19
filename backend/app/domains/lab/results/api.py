from __future__ import annotations

"""Lab result entry and validation routes."""

from app.domains.lab.deps import get_lab_operations_service
from app.domains.lab.quality.schemas import (
    PendingEscalationItemResponse,
    ResultEntryRequest,
    ResultValidationRequest,
)
from app.domains.lab.results.service import ResultQueryService
from app.domains.lab.workflow.service import LabOperationsService
from app.domains.users.models import User
from app.platform.database import get_db
from app.platform.http import get_current_user, require_lab_tech
from app.shared.enums import ValidationDecision
from app.shared.http import OrderTestIdPath
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

router = APIRouter()


@router.get("/results/order-tests/{orderTestId}", response_model=PendingEscalationItemResponse)
def get_order_test_context(
    orderTestId: OrderTestIdPath,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return ResultQueryService(db).get_order_test_context(orderTestId)


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