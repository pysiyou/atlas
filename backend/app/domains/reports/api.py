"""Report data API."""
from app.domains.reports.schemas import ValidatedTestReportItem
from app.domains.reports.service import ReportService
from app.domains.users.models import User
from app.platform.database import get_db
from app.platform.http.dependencies import get_current_user
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

router = APIRouter(tags=["reports"])


@router.get(
    "/reports/validated-tests",
    response_model=list[ValidatedTestReportItem],
    status_code=status.HTTP_200_OK,
)
def list_validated_tests(
    limit: int = Query(500, ge=1, le=2000),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    return ReportService(db).list_validated_tests(limit=limit)


@router.get(
    "/reports/validated-tests/{testId}/download",
    response_model=ValidatedTestReportItem,
    status_code=status.HTTP_200_OK,
)
def download_validated_test_report(
    testId: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return ReportService(db).get_validated_test_report(testId, current_user.id)
