"""Invoice and insurance claim services."""
from datetime import UTC, datetime

from app.domains.audit.service import AuditEmitter
from app.domains.billing.models import InsuranceClaim, Invoice
from app.domains.billing.schemas import InsuranceClaimCreate
from app.domains.orders.models import Order, OrderTest
from app.shared.contracts.enums import ClaimStatus, TestStatus
from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload


class BillingService:
    def __init__(self, db: Session):
        self.db = db
        self.emitter = AuditEmitter(db)

    def create_invoice_for_order(self, order_id: int, user_id: int | None = None) -> Invoice:
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

    def get_invoice(self, invoice_id: int) -> Invoice:
        invoice = self.db.query(Invoice).filter(Invoice.invoiceId == invoice_id).first()
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        return invoice

    def list_invoices_for_order(self, order_id: int) -> list[Invoice]:
        return self.db.query(Invoice).filter(Invoice.orderId == order_id).all()

    def _invoice_is_voided(self, invoice: Invoice) -> bool:
        return (
            invoice.amountPaid == 0
            and invoice.amountDue == 0
            and invoice.total == 0
            and invoice.subtotal == 0
            and invoice.items == []
        )

    def void_invoice(self, invoice_id: int, user_id: int, reason: str | None = None) -> Invoice:
        invoice = self.get_invoice(invoice_id)
        if self._invoice_is_voided(invoice):
            raise HTTPException(status_code=409, detail="Invoice is already voided")
        if invoice.amountPaid > 0:
            raise HTTPException(
                status_code=400,
                detail="Cannot void an invoice that has recorded payments",
            )

        old_snapshot = {
            "subtotal": invoice.subtotal,
            "total": invoice.total,
            "amount_due": invoice.amountDue,
            "item_count": len(invoice.items or []),
        }
        invoice.items = []
        invoice.subtotal = 0.0
        invoice.discount = 0.0
        invoice.tax = 0.0
        invoice.total = 0.0
        invoice.amountDue = 0.0

        self.emitter.invoice_voided(
            invoice.orderId,
            invoice.invoiceId,
            user_id,
            metadata={"reason": reason, "previous": old_snapshot},
        )
        self.db.commit()
        self.db.refresh(invoice)
        return invoice

    def submit_insurance_claim(self, data: InsuranceClaimCreate, user_id: int) -> InsuranceClaim:
        invoice = self.get_invoice(data.invoiceId)
        if invoice.orderId != data.orderId:
            raise HTTPException(status_code=400, detail="Invoice does not belong to order")

        claim = InsuranceClaim(
            orderId=data.orderId,
            invoiceId=data.invoiceId,
            patientId=invoice.patientId,
            insuranceProvider=data.insuranceProvider,
            insuranceNumber=data.insuranceNumber,
            claimAmount=data.claimAmount,
            claimStatus=ClaimStatus.SUBMITTED,
            submittedDate=datetime.now(UTC),
            notes=data.notes,
        )
        self.db.add(claim)
        self.db.flush()
        self.emitter.insurance_submitted(
            data.orderId,
            claim.claimId,
            user_id,
            metadata={
                "invoice_id": data.invoiceId,
                "provider": data.insuranceProvider,
                "claim_amount": data.claimAmount,
            },
        )
        self.db.commit()
        self.db.refresh(claim)
        return claim

    def list_claims_for_order(self, order_id: int) -> list[InsuranceClaim]:
        return self.db.query(InsuranceClaim).filter(InsuranceClaim.orderId == order_id).all()
