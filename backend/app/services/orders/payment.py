"""
Payment business logic. Router delegates create to this service.
"""
from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models.billing import Payment
from app.models.order import Order
from app.schemas.enums import PaymentMethod, PaymentStatus
from app.schemas.payment import PaymentCreate
from app.services.audit.logger import AuditService


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

    def _payment_query(self):
        return self.db.query(Payment).options(
            joinedload(Payment.order).joinedload(Order.patient),
            joinedload(Payment.order).selectinload(Order.tests),
        )

    def list_payments(
        self,
        skip: int,
        limit: int,
        order_id: int | None = None,
        payment_method: PaymentMethod | None = None,
    ) -> list[dict]:
        query = self._payment_query()
        if order_id:
            query = query.filter(Payment.orderId == order_id)
        if payment_method:
            query = query.filter(Payment.paymentMethod == payment_method)
        payments = query.order_by(Payment.paidAt.desc()).offset(skip).limit(limit).all()
        return [enrich_payment(p, p.order) for p in payments]

    def get_payment(self, payment_id: int) -> dict:
        payment = self._payment_query().filter(Payment.paymentId == payment_id).first()
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Payment {payment_id} not found",
            )
        return enrich_payment(payment, payment.order)

    def list_by_order(self, order_id: int) -> list[dict]:
        payments = (
            self._payment_query()
            .filter(Payment.orderId == order_id)
            .order_by(Payment.paidAt.desc())
            .all()
        )
        return [enrich_payment(p, p.order) for p in payments]

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
        payment = Payment(
            orderId=payment_data.orderId,
            invoiceId=None,
            amount=payment_data.amount,
            paymentMethod=payment_data.paymentMethod,
            paidAt=datetime.now(timezone.utc),
            receivedBy=str(user_id),
            receiptGenerated=False,
            notes=payment_data.notes if payment_data.notes is not None else "",
        )
        self.db.add(payment)
        self.db.flush()
        new_total_paid = total_paid + payment_data.amount
        if new_total_paid >= order.totalPrice:
            order.paymentStatus = PaymentStatus.PAID
        else:
            order.paymentStatus = PaymentStatus.UNPAID

        AuditService(self.db).log_order_payment_recorded(
            order_id=order.orderId,
            payment_id=payment.paymentId,
            user_id=user_id,
            amount=payment_data.amount,
            payment_method=payment_data.paymentMethod.value,
            payment_status=order.paymentStatus.value,
            metadata={"totalPaid": new_total_paid, "orderTotal": order.totalPrice},
        )
        self.db.commit()
        self.db.refresh(payment)
        return enrich_payment(payment, order)
