"""Quality Issues API — unified endpoint for reporting lab quality problems."""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_lab_tech
from app.database import get_db
from app.models.user import User
from app.schemas.enums import QualityIssueTargetType
from app.schemas.lab import QualityIssueResponse, ReportQualityIssueRequest
from app.services.lab.quality import QualityIssueOptions, QualityIssueResult
from app.services.lab.workflow import LabOperationsService
from app.utils.exceptions import LabOperationError

router = APIRouter()


@router.get("/lab/quality-issues/options", response_model=QualityIssueOptions)
def get_quality_issue_options(
    targetType: QualityIssueTargetType = Query(...),
    targetId: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lab_tech),
):
    try:
        return LabOperationsService(db).quality.get_options(targetType, targetId)
    except LabOperationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/lab/quality-issues", response_model=QualityIssueResult)
def report_quality_issue(
    body: ReportQualityIssueRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lab_tech),
):
    try:
        return LabOperationsService(db).quality.report_issue(
            target_type=body.target.type,
            target_id=body.target.id,
            user_id=current_user.id,
            reason=body.reason,
            notes=body.notes,
            preferred_remedy=body.preferredRemedy,
        )
    except LabOperationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/lab/quality-issues", response_model=List[QualityIssueResponse])
def list_quality_issues(
    orderId: Optional[int] = None,
    sampleId: Optional[int] = None,
    orderTestId: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = LabOperationsService(db)
    if orderTestId:
        issues = service.quality.get_issues_for_test(orderTestId)
    elif sampleId:
        issues = service.quality.get_issues_for_sample(sampleId)
    elif orderId:
        issues = service.quality.get_issues_for_order(orderId)
    else:
        raise HTTPException(status_code=400, detail="Provide orderId, sampleId, or orderTestId")

    return [
        QualityIssueResponse(
            id=i.id,
            orderId=i.orderId,
            orderTestId=i.orderTestId,
            sampleId=i.sampleId,
            testCode=i.testCode,
            stage=i.stage.value,
            domain=i.domain.value,
            reason=i.reason,
            notes=i.notes,
            remedy=i.remedy.value,
            createdTestId=i.createdTestId,
            createdSampleId=i.createdSampleId,
            createdBy=i.createdBy,
            createdAt=i.createdAt.isoformat(),
        )
        for i in issues
    ]
