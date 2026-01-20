"""
Payment API Routes
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from app.database import get_db
from app.core.dependencies import get_current_user, require_receptionist
from app.models.user import User
from app.models.billing import Payment
from app.models.order import Order
from app.schemas.payment import PaymentCreate, PaymentResponse
from app.schemas.enums import PaymentStatus, PaymentMethod
from app.services.id_generator import generate_id

logger = logging.getLogger(__name__)

router = APIRouter()


def _enrich_payment(payment: Payment, order: Optional[Order]) -> dict:
    """
    Enrich payment with order data for response.
    
    Args:
        payment: The Payment model instance
        order: The associated Order model instance (can be None)
        
    Returns:
        Dictionary with payment data enriched with order information
    """
    if not order:
        logger.warning(f"Order not found for payment {payment.paymentId}")
    
    return {
        "paymentId": payment.paymentId,
        "orderId": payment.orderId,
        "invoiceId": payment.invoiceId,
        "amount": payment.amount,
        "paymentMethod": payment.paymentMethod,
        "paidAt": payment.paidAt,
        "receivedBy": payment.receivedBy,
        "receiptGenerated": payment.receiptGenerated,
        "notes": payment.notes,
        "orderTotalPrice": order.totalPrice if order else None,
        "numberOfTests": len(order.tests) if order else 0,
        "patientName": order.patientName if order else None,
    }


@router.get("/payments", response_model=List[PaymentResponse])
def get_payments(
    orderId: str | None = None,
    paymentMethod: PaymentMethod | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all payments with optional filters
    """
    query = db.query(Payment)

    if orderId:
        query = query.filter(Payment.orderId == orderId)

    if paymentMethod:
        query = query.filter(Payment.paymentMethod == paymentMethod)

    payments = query.order_by(Payment.paidAt.desc()).offset(skip).limit(limit).all()
    
    # Enrich with order data
    enriched_payments = []
    for payment in payments:
        order = db.query(Order).filter(Order.orderId == payment.orderId).first()
        enriched_payments.append(PaymentResponse(**_enrich_payment(payment, order)))
    
    return enriched_payments


@router.get("/payments/{paymentId}", response_model=PaymentResponse)
def get_payment(
    paymentId: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get payment by ID
    """
    payment = db.query(Payment).filter(Payment.paymentId == paymentId).first()
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment {paymentId} not found"
        )
    
    order = db.query(Order).filter(Order.orderId == payment.orderId).first()
    return PaymentResponse(**_enrich_payment(payment, order))


@router.get("/payments/order/{orderId}", response_model=List[PaymentResponse])
def get_payments_by_order(
    orderId: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all payments for a specific order
    """
    order = db.query(Order).filter(Order.orderId == orderId).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order {orderId} not found"
        )
    
    payments = db.query(Payment).filter(Payment.orderId == orderId).order_by(Payment.paidAt.desc()).all()
    
    return [PaymentResponse(**_enrich_payment(payment, order)) for payment in payments]


@router.post("/payments", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def create_payment(
    payment_data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_receptionist)
):
    """
    Create a new payment and update order payment status
    """
    order = db.query(Order).filter(Order.orderId == payment_data.orderId).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order {payment_data.orderId} not found"
        )
    
    # Create payment
    payment_id = generate_id("payment", db)
    payment = Payment(
        paymentId=payment_id,
        orderId=payment_data.orderId,
        invoiceId=None,  # Can be linked to invoice later if needed
        amount=payment_data.amount,
        paymentMethod=payment_data.paymentMethod,
        paidAt=datetime.now(timezone.utc),
        receivedBy=current_user.id,
        receiptGenerated=False,
        notes=payment_data.notes,
    )
    
    db.add(payment)
    
    # Calculate total amount paid for this order
    existing_payments = db.query(Payment).filter(Payment.orderId == payment_data.orderId).all()
    total_paid = sum(p.amount for p in existing_payments) + payment_data.amount
    
    # Update order payment status - only PAID or UNPAID
    if total_paid >= order.totalPrice:
        order.paymentStatus = PaymentStatus.PAID
    else:
        order.paymentStatus = PaymentStatus.UNPAID
    
    db.commit()
    db.refresh(payment)
    
    return PaymentResponse(**_enrich_payment(payment, order))
