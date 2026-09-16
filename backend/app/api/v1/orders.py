"""Order API Routes"""
from typing import Literal

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import PaginationParams, get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.enums import OrderStatus, PaymentStatus
from app.schemas.order import (
    OrderCreate,
    OrderPaymentUpdate,
    OrderReportResponse,
    OrderResponse,
    OrderUpdate,
)
from app.services.orders import OrderService

router = APIRouter()


@router.get("/orders")
def get_orders(
    pagination: PaginationParams,
    patientId: int | None = None,
    order_status: OrderStatus | None = Query(None, alias="status"),
    paymentStatus: PaymentStatus | None = Query(None, alias="paymentStatus"),
    sort: Literal["createdAt", "updatedAt"] = Query("updatedAt"),
    paginated: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return OrderService(db).list_orders(
        pagination["skip"],
        pagination["limit"],
        patientId,
        order_status,
        paymentStatus,
        sort,
        paginated,
    )


@router.get("/orders/{orderId}")
def get_order(
    orderId: int,
    include: str | None = Query(None, description="Include related data, e.g. 'payments'"),
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
    OrderService(db).delete_order(orderId)
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
    return OrderService(db).mark_as_reported(orderId)
