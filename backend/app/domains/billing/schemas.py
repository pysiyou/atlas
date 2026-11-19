"""Billing schemas — invoices embedded on order detail."""
from datetime import datetime

from app.shared.identifiers import FILLER_PATTERN, INVOICE_NUMBER_PATTERN, MRN_PATTERN
from app.shared.contracts.enums import PaymentStatus
from pydantic import BaseModel, Field


class InvoiceItem(BaseModel):
    testCode: str
    testName: str
    quantity: int = 1
    unitPrice: float
    totalPrice: float


class InvoiceResponse(BaseModel):
    invoiceId: str = Field(..., pattern=INVOICE_NUMBER_PATTERN)
    orderId: str = Field(..., pattern=FILLER_PATTERN)
    patientId: str = Field(..., pattern=MRN_PATTERN)
    patientName: str
    items: list[InvoiceItem]
    subtotal: float
    discount: float
    tax: float
    total: float
    paymentStatus: PaymentStatus
    amountPaid: float
    amountDue: float
    createdAt: datetime
    updatedAt: datetime
    dueDate: datetime | None = None

    class Config:
        from_attributes = True
