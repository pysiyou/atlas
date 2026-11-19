"""Payment business logic."""
from datetime import UTC, datetime

from app.domains.audit.emitter import AuditEmitter
from app.domains.billing.models import Invoice, Payment
from app.domains.orders.models import Order
from app.domains.payments.schemas import PaymentCreate
from app.platform.cache import invalidate_lab_board_summary_cache
from app.shared.clinical import allocate_receipt_number
from app.shared.generated.enums import PaymentStatus
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload


def money(value: float | int | None) -> float:
    if value is None:
        return 0.0
    return round(float(value), 2)


def remaining_balance(order_total: float, total_paid: float) -> float:
    return max(0.0, money(order_total) - money(total_paid))


def total_paid_for_order(db: Session, order_id: str) -> float:
    payments = db.query(Payment).filter(Payment.orderId == order_id).all()
    return money(sum(p.amount for p in payments))


def sync_order_payment_status(db: Session, order: Order) -> None:
    """Reconcile order.paymentStatus and invoice balances from payment records."""
    paid = total_paid_for_order(db, order.orderId)
    order.paymentStatus = derive_payment_status(paid, money(order.totalPrice))
    invoices = db.query(Invoice).filter(Invoice.orderId == order.orderId).all()
    for invoice in invoices:
        invoice_total = money(invoice.total or 0.0)
        invoice.amountPaid = paid
        invoice.amountDue = remaining_balance(invoice_total, paid)
        invoice.paymentStatus = derive_payment_status(paid, invoice_total)


def count_billing_active_tests(order: Order | None) -> int:
    if not order or not order.tests:
        return 0
    from app.shared.generated.enums import TestStatus
    from app.shared.generated.lab_policy import INACTIVE_TEST_STATUSES_FOR_BILLING

    inactive = frozenset(INACTIVE_TEST_STATUSES_FOR_BILLING)
    return sum(
        1
        for ot in order.tests
        if (ot.status.value if ot.status else str(ot.status)) not in inactive
        and ot.status != TestStatus.CANCELLED
    )


def derive_payment_status(total_paid: float, order_total: float) -> PaymentStatus:
    paid = money(total_paid)
    total = money(order_total)
    if paid <= 0:
        return PaymentStatus.UNPAID
    if paid >= total:
        return PaymentStatus.PAID
    return PaymentStatus.PARTIAL


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
        "numberOfTests": count_billing_active_tests(order),
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
