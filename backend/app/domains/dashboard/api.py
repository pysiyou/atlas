"""Dashboard aggregate API."""
from app.domains.dashboard.schemas import DashboardSummaryResponse
from app.domains.dashboard.service import DashboardService
from app.domains.users.models import User
from app.platform.database import get_db
from app.platform.http.dependencies import get_current_user
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

router = APIRouter(tags=["dashboard"])


@router.get(
    "/dashboard/summary",
    response_model=DashboardSummaryResponse,
    status_code=status.HTTP_200_OK,
)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    return DashboardService(db).get_summary()
