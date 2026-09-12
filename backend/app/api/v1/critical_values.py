"""Critical Values API Routes."""
from typing import List, Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.critical_values import (
    AcknowledgeRequest,
    CriticalValueResponse,
    NotifyRequest,
)
from app.services.lab.critical_values import CriticalNotificationService

router = APIRouter()


@router.get("/critical-values/pending")
def get_pending_critical_values(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[CriticalValueResponse]:
    return CriticalNotificationService(db).list_pending()


@router.get("/critical-values/all")
def get_all_critical_values(
    acknowledged: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[CriticalValueResponse]:
    return CriticalNotificationService(db).list_all(acknowledged)


@router.post("/critical-values/{test_id}/notify")
def notify_critical_value(
    test_id: int,
    request: NotifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return CriticalNotificationService(db).notify(test_id, request, current_user.id)


@router.post("/critical-values/{test_id}/acknowledge")
def acknowledge_critical_value(
    test_id: int,
    request: AcknowledgeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return CriticalNotificationService(db).acknowledge(test_id, request, current_user.id)


@router.get("/orders/{order_id}/critical-values")
def get_order_critical_values(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[CriticalValueResponse]:
    return CriticalNotificationService(db).list_for_order(order_id)
