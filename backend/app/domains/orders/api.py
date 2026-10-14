"""Order API Routes"""
from datetime import date
from typing import Literal

from app.domains.orders.schemas import (
    OrderCreate,
    OrderDetailResponse,
    OrderPaymentUpdate,
    OrderReportResponse,
    OrderResponse,
    OrderSummaryResponse,
    OrderUpdate,
)
from app.domains.orders.service import OrderService
from app.domains.users.models import User
from app.platform.database import get_db
from app.platform.http.dependencies import PaginationParams, get_current_user
from app.platform.utils.common import parse_csv_values
from app.shared.contracts.enums import OrderStatus, PaymentMethod, PaymentStatus
from app.shared.schemas.pagination import PaginatedResponse
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

router = APIRouter()

OrderListUnion = (
    list[OrderResponse]
    | list[OrderSummaryResponse]
    | PaginatedResponse[OrderResponse]
    | PaginatedResponse[OrderSummaryResponse]
)


def _parse_enums(raw: str | None, enum_cls: type):
    return [enum_cls(token) for token in parse_csv_values(raw)]


@router.get("/orders", response_model=OrderListUnion)
def get_orders(
    pagination: PaginationParams,
    patientId: int | None = None,
    orderId: int | None = None,
    order_status: str | None = Query(None, alias="status"),
    paymentStatus: str | None = Query(None, alias="paymentStatus"),
    paymentMethod: str | None = Query(None, alias="paymentMethod"),
    search: str | None = Query(None, max_length=100),
    dateFrom: date | None = None,
    dateTo: date | None = None,
    sort: Literal["createdAt", "updatedAt"] = Query("updatedAt"),
    paginated: bool = Query(False),
    summary: bool = Query(False, description="Return lightweight order rows without nested tests"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return OrderService(db).list_orders(
        pagination["skip"],
        pagination["limit"],
        patientId,
        _parse_enums(order_status, OrderStatus) or None,
        _parse_enums(paymentStatus, PaymentStatus) or None,
        sort,
        paginated,
        summary,
        order_id=orderId,
        payment_methods=_parse_enums(paymentMethod, PaymentMethod) or None,
        search=search,
        date_from=dateFrom,
        date_to=dateTo,
    )


@router.get("/orders/{orderId}", response_model=OrderResponse | OrderDetailResponse)
def get_order(
    orderId: int,
    include: str | None = Query(
        None, description="Comma-separated related data: payments, invoices, patient"
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return OrderService(db).get_order(orderId, include)


@router.post("/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return OrderService(db).create_order(order_data, current_user.id)


@router.put("/orders/{orderId}", response_model=OrderResponse)
def update_order(
    orderId: int,
    order_data: OrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return OrderService(db).update_order(orderId, order_data, current_user.id)


@router.delete("/orders/{orderId}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(
    orderId: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    OrderService(db).delete_order(orderId, current_user.id)
    return None


@router.patch("/orders/{orderId}/payment", response_model=OrderResponse)
def update_order_payment_status(
    orderId: int,
    body: OrderPaymentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return OrderService(db).update_order_payment(
        orderId, body.paymentStatus, body.amountPaid, current_user.id
    )


@router.post(
    "/orders/{orderId}/report", response_model=OrderReportResponse, status_code=status.HTTP_200_OK
)
def mark_as_reported(
    orderId: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OrderReportResponse:
    return OrderService(db).mark_as_reported(orderId, current_user.id)
