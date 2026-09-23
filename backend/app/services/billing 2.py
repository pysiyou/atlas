"""Invoice and insurance claim services."""
from datetime import UTC, datetime

from app.models.billing import InsuranceClaim, Invoice
from app.models.order import Order, OrderTest
from app.schemas.billing import InsuranceClaimCreate
from app.schemas.enums import ClaimStatus, TestStatus
from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload


class BillingService:
    def __init__(self, db: Session):
        self.db = db

    def create_invoice_for_order(self, order_id: int) -> Invoice:
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
        return invoice

    def get_invoice(self, invoice_id: int) -> Invoice:
        invoice = self.db.query(Invoice).filter(Invoice.invoiceId == invoice_id).first()
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        return invoice

    def list_invoices_for_order(self, order_id: int) -> list[Invoice]:
        return self.db.query(Invoice).filter(Invoice.orderId == order_id).all()

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
        self.db.commit()
        self.db.refresh(claim)
        return claim

    def list_claims_for_order(self, order_id: int) -> list[InsuranceClaim]:
        return self.db.query(InsuranceClaim).filter(InsuranceClaim.orderId == order_id).all()
