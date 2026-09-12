"""Payment API Routes."""
from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import PaginationParams
from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.enums import PaymentMethod
from app.schemas.payment import PaymentCreate, PaymentResponse
from app.services.orders.payment import PaymentService

router = APIRouter()


@router.get("/payments", response_model=List[PaymentResponse])
def get_payments(
    pagination: PaginationParams,
    orderId: int | None = None,
    paymentMethod: PaymentMethod | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return [
        PaymentResponse(**p)
        for p in PaymentService(db).list_payments(
            pagination["skip"], pagination["limit"], orderId, paymentMethod
        )
    ]


@router.get("/payments/{paymentId}", response_model=PaymentResponse)
def get_payment(
    paymentId: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return PaymentResponse(**PaymentService(db).get_payment(paymentId))


@router.get("/payments/order/{orderId}", response_model=List[PaymentResponse])
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
