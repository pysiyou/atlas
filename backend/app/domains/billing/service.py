"""Invoice services used by order create and order detail embeds."""
from app.domains.audit.emitter import AuditEmitter
from app.domains.billing.models import Invoice
from app.domains.orders.models import Order, OrderTest
from app.shared.generated.enums import TestStatus
from app.shared.clinical import allocate_invoice_number
from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload


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
            .options(joinedload(Order.patient), joinedload(Order.tests).joinedload(OrderTest.test))
            .filter(Order.orderId == order_id)
            .first()
        )
        if not order:
            raise HTTPException(status_code=404, detail=f"Order {order_id} not found")

        items: list[dict] = []
        subtotal = 0.0
        for ot in order.tests:
            if ot.status in (TestStatus.REMOVED, TestStatus.CANCELLED):
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

    def list_invoices_for_order(self, order_id: str) -> list[Invoice]:
        return self.db.query(Invoice).filter(Invoice.orderId == order_id).all()
