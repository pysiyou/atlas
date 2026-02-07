"""
Payment business logic. Router delegates create to this service.
"""
from datetime import datetime, timezone
from typing import Optional

from app.utils.time_utils import get_now

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models.billing import Payment
from app.models.order import Order
from app.schemas.payment import PaymentCreate, PaymentResponse
from app.schemas.enums import PaymentStatus


def enrich_payment(payment: Payment, order: Optional[Order]) -> dict:
    """Build PaymentResponse dict from payment and optional order (for orderTotalPrice, numberOfTests, patientName)."""
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


class PaymentService:
    def __init__(self, db: Session):
        self.db = db

    def create_payment(self, payment_data: PaymentCreate, user_id: int) -> dict:
        order = (
            self.db.query(Order)
            .filter(Order.orderId == payment_data.orderId)
            .options(joinedload(Order.patient), selectinload(Order.tests))
            .first()
        )
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order {payment_data.orderId} not found",
            )
        if payment_data.amount <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment amount must be greater than zero",
            )
        existing_payments = self.db.query(Payment).filter(Payment.orderId == payment_data.orderId).all()
        total_paid = sum(p.amount for p in existing_payments)
        remaining = order.totalPrice - total_paid
        if remaining <= 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Order is already fully paid",
            )
        if payment_data.amount > remaining:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Payment amount (${payment_data.amount:.2f}) exceeds remaining balance (${remaining:.2f})",
            )
        paid_at = payment_data.paidAt if payment_data.paidAt is not None else get_now()
        payment = Payment(
            orderId=payment_data.orderId,
            invoiceId=None,
            amount=payment_data.amount,
            paymentMethod=payment_data.paymentMethod,
            paidAt=paid_at,
            receivedBy=str(user_id),
            receiptGenerated=False,
            notes=payment_data.notes if payment_data.notes is not None else "",
        )
        self.db.add(payment)
        new_total_paid = total_paid + payment_data.amount
        if new_total_paid >= order.totalPrice:
            order.paymentStatus = PaymentStatus.PAID
        self.db.commit()
        self.db.refresh(payment)
        return enrich_payment(payment, order)
