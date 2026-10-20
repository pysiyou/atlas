"""Report data API."""
from datetime import date

from app.domains.reports.schemas import ReportableOrderItem
from app.domains.reports.service import ReportService
from app.domains.users.models import User
from app.platform.database import get_db
from app.platform.http.dependencies import get_current_user
from app.shared.schemas.pagination import PaginatedResponse
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

router = APIRouter(tags=["reports"])


@router.get(
    "/reports/orders",
    response_model=PaginatedResponse[ReportableOrderItem],
    status_code=status.HTTP_200_OK,
)
def list_reportable_orders(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Page size"),
    search: str | None = Query(None, max_length=100),
    dateFrom: date | None = None,
    dateTo: date | None = None,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    return ReportService(db).list_reportable_orders(
        skip=skip,
        limit=limit,
        search=search,
        date_from=dateFrom,
        date_to=dateTo,
    )


@router.get(
    "/reports/orders/{orderId}",
    response_model=ReportableOrderItem,
    status_code=status.HTTP_200_OK,
)
def get_reportable_order(
    orderId: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    return ReportService(db).get_reportable_order_view(orderId)


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
