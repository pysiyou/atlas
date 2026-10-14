"""Report data API."""
from app.domains.reports.schemas import ReportableOrderItem
from app.domains.reports.service import ReportService
from app.domains.users.models import User
from app.platform.database import get_db
from app.platform.http.dependencies import get_current_user
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

router = APIRouter(tags=["reports"])


@router.get(
    "/reports/orders",
    response_model=list[ReportableOrderItem],
    status_code=status.HTTP_200_OK,
)
def list_reportable_orders(
    limit: int = Query(500, ge=1, le=2000),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    return ReportService(db).list_reportable_orders(limit=limit)


@router.get(
    "/reports/orders/{orderId}/download",
    response_model=ReportableOrderItem,
    status_code=status.HTTP_200_OK,
)
def download_order_report(
    orderId: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return ReportService(db).get_reportable_order(orderId, current_user.id)
