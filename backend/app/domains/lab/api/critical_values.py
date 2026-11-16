"""Lab critical value notification routes."""

from app.domains.lab.deps import get_lab_operations_service
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


@router.post("/critical-values/{test_id}/notify")
def notify_critical_value(
    test_id: int,
    request: NotifyRequest,
    service: LabOperationsService = Depends(get_lab_operations_service),
    current_user: User = Depends(require_lab_tech),
):
    return service.notify_critical_value(test_id, request, current_user.id)


@router.post("/critical-values/{test_id}/acknowledge")
def acknowledge_critical_value(
    test_id: int,
    request: AcknowledgeRequest,
    service: LabOperationsService = Depends(get_lab_operations_service),
    current_user: User = Depends(require_lab_tech),
):
    return service.acknowledge_critical_value(test_id, request, current_user.id)
