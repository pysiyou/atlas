"""Critical values and quality issue routes."""

from __future__ import annotations

from app.domains.lab.deps import get_lab_operations_service
from app.domains.lab.quality.critical import CriticalNotificationService
from app.domains.lab.quality.schemas import (
    AcknowledgeRequest,
    CriticalValueResponse,
    NotifyRequest,
    QualityIssueOptions,
    QualityIssueResult,
    ReportQualityIssueRequest,
)
from app.domains.lab.workflow.operations import LabOperationsService
from app.domains.users.models import User
from app.platform.database import get_db
from app.platform.http import assert_quality_issue_target_access, get_current_user, require_lab_tech
from app.shared.generated.enums import QualityIssueTargetType
from fastapi import APIRouter, Depends, Query
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


@router.get("/quality-issues/options", response_model=QualityIssueOptions)
def get_quality_issue_options(
    targetType: QualityIssueTargetType = Query(...),
    targetId: str = Query(...),
    service: LabOperationsService = Depends(get_lab_operations_service),
    current_user: User = Depends(get_current_user),
):
    assert_quality_issue_target_access(current_user, targetType)
    return service.quality.get_options(targetType, targetId)


@router.post("/quality-issues", response_model=QualityIssueResult)
def report_quality_issue(
    body: ReportQualityIssueRequest,
    service: LabOperationsService = Depends(get_lab_operations_service),
    current_user: User = Depends(get_current_user),
):
    assert_quality_issue_target_access(current_user, body.target.type)
    return service.report_quality_issue(
        target_type=body.target.type,
        target_id=body.target.id,
        user_id=current_user.id,
        reason=body.reason,
        notes=body.notes,
        preferred_remedy=body.preferredRemedy,
    )