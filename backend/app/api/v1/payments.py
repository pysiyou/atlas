"""
Payment API Routes. Delegates create to PaymentService; uses enrich_payment for list/detail.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload, selectinload
from typing import List
from app.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.billing import Payment
from app.models.order import Order
from app.schemas.payment import PaymentCreate, PaymentResponse
from app.schemas.enums import PaymentMethod
from app.api.deps import PaginationParams
from app.services.payment_service import PaymentService, enrich_payment

router = APIRouter()


@router.get("/payments", response_model=List[PaymentResponse])
def get_payments(
    pagination: PaginationParams,
    orderId: int | None = None,
    paymentMethod: PaymentMethod | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all payments with optional filters. Eager-loads order, patient, tests for enrichment."""
    skip, limit = pagination["skip"], pagination["limit"]
    query = db.query(Payment).options(
        joinedload(Payment.order).joinedload(Order.patient),
        joinedload(Payment.order).selectinload(Order.tests),
    )
    if orderId:
        query = query.filter(Payment.orderId == orderId)
    if paymentMethod:
        query = query.filter(Payment.paymentMethod == paymentMethod)
    payments = query.order_by(Payment.paidAt.desc()).offset(skip).limit(limit).all()
    return [PaymentResponse(**enrich_payment(p, p.order)) for p in payments]


@router.get("/payments/{paymentId}", response_model=PaymentResponse)
def get_payment(
    paymentId: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get payment by ID. Eager-loads order, patient, and tests in one query.
    """
    payment = (
        db.query(Payment)
        .filter(Payment.paymentId == paymentId)
        .options(
            joinedload(Payment.order).joinedload(Order.patient),
            joinedload(Payment.order).selectinload(Order.tests),
        )
        .first()
    )
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment {paymentId} not found"
        )
    return PaymentResponse(**enrich_payment(payment, payment.order))


@router.get("/payments/order/{orderId}", response_model=List[PaymentResponse])
def get_payments_by_order(
    orderId: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all payments for a specific order. Single query with eager-loaded order/patient/tests.
    """
    payments = (
        db.query(Payment)
        .filter(Payment.orderId == orderId)
        .options(
            joinedload(Payment.order).joinedload(Order.patient),
            joinedload(Payment.order).selectinload(Order.tests),
        )
        .order_by(Payment.paidAt.desc())
        .all()
    )
    return [PaymentResponse(**enrich_payment(p, p.order)) for p in payments]


@router.post("/payments", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def create_payment(
    payment_data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new payment and update order payment status. Delegates to PaymentService."""
    return PaymentResponse(**PaymentService(db).create_payment(payment_data, current_user.id))
