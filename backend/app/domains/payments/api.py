"""Payment API Routes."""

from app.domains.payments.schemas import PaymentCreate, PaymentResponse
from app.domains.payments.service import PaymentService
from app.domains.users.models import User
from app.platform.database import get_db
from app.platform.http.dependencies import PaginationParams, get_current_user
from app.shared.contracts.enums import PaymentMethod
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

router = APIRouter()


@router.get("/payments", response_model=list[PaymentResponse])
def get_payments(
    pagination: PaginationParams,
    orderId: int | None = None,
    orderIds: str | None = Query(None, description="Comma-separated order IDs"),
    paymentMethod: PaymentMethod | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    parsed_order_ids: list[int] | None = None
    if orderIds:
        try:
            parsed_order_ids = [int(part) for part in orderIds.split(",") if part.strip()]
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="orderIds must be a comma-separated list of integers",
            ) from exc
    return [
        PaymentResponse(**p)
        for p in PaymentService(db).list_payments(
            pagination["skip"],
            pagination["limit"],
            orderId,
            paymentMethod,
            parsed_order_ids,
        )
    ]


@router.get("/payments/{paymentId}", response_model=PaymentResponse)
def get_payment(
    paymentId: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return PaymentResponse(**PaymentService(db).get_payment(paymentId))


@router.get("/payments/order/{orderId}", response_model=list[PaymentResponse])
def get_payments_by_order(
    orderId: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return [PaymentResponse(**p) for p in PaymentService(db).list_by_order(orderId)]


@router.post("/payments", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def create_payment(
    payment_data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return PaymentResponse(**PaymentService(db).create_payment(payment_data, current_user.id))
