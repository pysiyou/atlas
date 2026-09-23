"""Report data API."""
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.reports import ValidatedTestReportItem
from app.services.reports import ReportService

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
