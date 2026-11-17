"""Lab quality issue routes."""

from app.domains.lab.deps import get_lab_operations_service
from app.domains.lab.schemas.lab import (
    QualityIssueOptions,
    QualityIssueResult,
    ReportQualityIssueRequest,
)
from app.domains.lab.workflow.service import LabOperationsService
from app.domains.users.models import User
from app.platform.http import assert_quality_issue_target_access, get_current_user
from app.shared.contracts.enums import QualityIssueTargetType
from fastapi import APIRouter, Depends, Query

router = APIRouter()


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
