"""Invoice services used by order create and order detail embeds."""
from __future__ import annotations

from app.domains.audit.emitter import AuditEmitter
from app.domains.billing.models import Invoice
from app.domains.orders.models import Order, OrderTest
from app.domains.payments.service import (
    derive_payment_status,
    money,
    remaining_balance,
    total_paid_for_order,
)
from app.shared.clinical import allocate_invoice_number
from app.shared.generated.enums import TestStatus
from app.shared.generated.lab_policy import INACTIVE_TEST_STATUSES_FOR_BILLING
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload as orm_joinedload

_INACTIVE_BILLING = frozenset(INACTIVE_TEST_STATUSES_FOR_BILLING)


def invoice_line_items_for_order(order: Order) -> tuple[list[dict], float]:
    items: list[dict] = []
    subtotal = 0.0
    for ot in order.tests or []:
        status_val = ot.status.value if ot.status else str(ot.status)
        if status_val in _INACTIVE_BILLING or ot.status in (
            TestStatus.CANCELLED,
        ):
            continue
        test_name = ot.test.name if ot.test else ot.testCode
        price = float(ot.priceAtOrder or 0)
        items.append(
            {
                "testCode": ot.testCode,
                "testName": test_name,
                "quantity": 1,
                "unitPrice": price,
                "totalPrice": price,
            }
        )
        subtotal += price
    return items, money(subtotal)


class BillingService:
    def __init__(self, db: Session):
        self.db = db
        self.emitter = AuditEmitter(db)

    def create_invoice_for_order(self, order_id: str, user_id: str | None = None) -> Invoice:
        existing = self.db.query(Invoice).filter(Invoice.orderId == order_id).first()
        if existing:
            return existing

        order = (
            self.db.query(Order)
            .options(
                orm_joinedload(Order.patient),
                orm_joinedload(Order.tests).joinedload(OrderTest.test),
            )
            .filter(Order.orderId == order_id)
            .first()
        )
        if not order:
            raise HTTPException(status_code=404, detail=f"Order {order_id} not found")

        items, subtotal = invoice_line_items_for_order(order)
        patient_name = order.patient.fullName if order.patient else "Unknown"
        invoice = Invoice(
            invoiceId=allocate_invoice_number(self.db),
            orderId=order.orderId,
            patientId=order.patientId,
            patientName=patient_name,
            items=items,
            subtotal=subtotal,
            discount=0.0,
            tax=0.0,
            total=subtotal,
            paymentStatus=order.paymentStatus,
            amountPaid=0.0,
            amountDue=subtotal,
        )
        self.db.add(invoice)
        self.db.flush()
        self.emitter.invoice_generated(order_id, invoice.invoiceId, user_id)
        return invoice

    def sync_invoice_for_order(self, order_id: str) -> Invoice | None:
        """Rebuild invoice line items and totals to match the current order."""
        order = (
            self.db.query(Order)
            .options(
                orm_joinedload(Order.patient),
                orm_joinedload(Order.tests).joinedload(OrderTest.test),
            )
            .filter(Order.orderId == order_id)
            .first()
        )
        if not order:
            return None
        invoice = self.db.query(Invoice).filter(Invoice.orderId == order_id).first()
        if not invoice:
            return self.create_invoice_for_order(order_id, user_id=None)

        items, subtotal = invoice_line_items_for_order(order)
        paid = total_paid_for_order(self.db, order_id)
        invoice.items = items
        invoice.subtotal = subtotal
        invoice.total = subtotal
        invoice.amountPaid = paid
        invoice.amountDue = remaining_balance(subtotal, paid)
        invoice.paymentStatus = derive_payment_status(paid, subtotal)
        if order.patient and order.patient.fullName:
            invoice.patientName = order.patient.fullName
        self.db.flush()
        return invoice

    def list_invoices_for_order(self, order_id: str) -> list[Invoice]:
        return self.db.query(Invoice).filter(Invoice.orderId == order_id).all()