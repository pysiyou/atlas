"""Payment business logic."""
from datetime import UTC, datetime

from app.domains.audit.service import AuditEmitter
from app.domains.billing.models import Invoice, Payment
from app.domains.orders.models import Order
from app.domains.payments.schemas import PaymentCreate
from app.domains.payments.status import derive_payment_status, money, remaining_balance
from app.platform.cache import invalidate_lab_board_summary_cache
from app.shared.identifiers import allocate_receipt_number
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload


def enrich_payment(payment: Payment, order: Order | None) -> dict:
    """Build PaymentResponse dict from payment and optional order."""
    return {
        "paymentId": payment.paymentId,
        "orderId": payment.orderId,
        "invoiceId": payment.invoiceId,
        "amount": payment.amount,
        "paymentMethod": payment.paymentMethod,
        "paidAt": payment.paidAt,
        "createdBy": payment.createdBy,
        "receiptGenerated": payment.receiptGenerated,
        "notes": payment.notes,
        "orderTotalPrice": order.totalPrice if order else None,
        "numberOfTests": len(order.tests) if order else 0,
        "patientName": order.patientName if order else None,
        "orderPaymentStatus": order.paymentStatus if order else None,
    }


class PaymentService:
    def __init__(self, db: Session):
        self.db = db
        self.emitter = AuditEmitter(db)

    def _payment_query(self):
        return self.db.query(Payment).options(
            joinedload(Payment.order).joinedload(Order.patient),
            joinedload(Payment.order).selectinload(Order.tests),
        )

    def list_by_order(self, order_id: str) -> list[dict]:
        payments = (
            self._payment_query()
            .filter(Payment.orderId == order_id)
            .order_by(Payment.paidAt.desc())
            .all()
        )
        return [enrich_payment(p, p.order) for p in payments]

    def create_payment(self, payment_data: PaymentCreate, user_id: str) -> dict:
        order = (
            self.db.query(Order)
            .filter(Order.orderId == payment_data.orderId)
            .with_for_update()
            .first()
        )
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order {payment_data.orderId} not found",
            )
        _ = order.patient
        _ = order.tests
        amount = money(payment_data.amount)
        if amount <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment amount must be greater than zero",
            )
        existing_payments = (
            self.db.query(Payment)
            .filter(Payment.orderId == payment_data.orderId)
            .with_for_update()
            .all()
        )
        total_paid = money(sum(p.amount for p in existing_payments))
        remaining = remaining_balance(order.totalPrice, total_paid)
        if remaining <= 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Order is already fully paid",
            )
        if amount > remaining:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Payment amount (${amount:.2f}) exceeds "
                    f"remaining balance (${remaining:.2f})"
                ),
            )
        payment = Payment(
            paymentId=allocate_receipt_number(self.db),
            orderId=payment_data.orderId,
            invoiceId=None,
            amount=amount,
            paymentMethod=payment_data.paymentMethod,
            paidAt=datetime.now(UTC),
            createdBy=str(user_id),
            receiptGenerated=False,
            notes=payment_data.notes if payment_data.notes is not None else "",
        )
        self.db.add(payment)
        self.db.flush()
        new_total_paid = money(total_paid + amount)
        order.paymentStatus = derive_payment_status(new_total_paid, order.totalPrice)

        invoices = self.db.query(Invoice).filter(Invoice.orderId == order.orderId).all()
        for invoice in invoices:
            invoice.amountPaid = new_total_paid
            invoice.amountDue = remaining_balance(invoice.total or 0.0, new_total_paid)
            invoice.paymentStatus = derive_payment_status(new_total_paid, invoice.total or 0.0)
            if payment.invoiceId is None:
                payment.invoiceId = invoice.invoiceId

        self.emitter.payment_processed(
            order.orderId,
            payment.paymentId,
            user_id,
            metadata={
                "amount": payment_data.amount,
                "payment_method": payment_data.paymentMethod.value,
                "payment_status": order.paymentStatus.value,
                "total_paid": new_total_paid,
                "order_total": order.totalPrice,
            },
        )
        self.db.commit()
        invalidate_lab_board_summary_cache()
        self.db.refresh(payment)
        return enrich_payment(payment, order)
