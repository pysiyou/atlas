"""Lab critical value notification routes."""

from app.domains.lab.quality.critical_notifications import CriticalNotificationService
from app.domains.lab.schemas.critical_values import (
    AcknowledgeRequest,
    CriticalValueResponse,
    NotifyRequest,
)
from app.domains.lab.workflow.service import LabOperationsService
from app.domains.users.models import User
from app.platform.database import get_db
from app.platform.http.dependencies import get_current_user, require_lab_tech
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

router = APIRouter()


@router.get("/critical-values/pending")
def get_pending_critical_values(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[CriticalValueResponse]:
    return CriticalNotificationService(db).list_pending()


@router.get("/critical-values/all")
def get_all_critical_values(
    acknowledged: bool | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[CriticalValueResponse]:
    return CriticalNotificationService(db).list_all(acknowledged)


@router.post("/critical-values/{test_id}/notify")
def notify_critical_value(
    test_id: int,
    request: NotifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lab_tech),
):
    return LabOperationsService(db).notify_critical_value(test_id, request, current_user.id)


@router.post("/critical-values/{test_id}/acknowledge")
def acknowledge_critical_value(
    test_id: int,
    request: AcknowledgeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lab_tech),
):
    return LabOperationsService(db).acknowledge_critical_value(test_id, request, current_user.id)


@router.get("/orders/{order_id}/critical-values")
def get_order_critical_values(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[CriticalValueResponse]:
    return CriticalNotificationService(db).list_for_order(order_id)
