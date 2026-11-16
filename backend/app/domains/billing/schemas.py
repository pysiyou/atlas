"""Billing schemas — invoices embedded on order detail."""
from datetime import datetime

from app.platform.utils import INVOICE_NUMBER_PATTERN
from app.shared.contracts.enums import PaymentStatus
from pydantic import BaseModel, Field


class InvoiceItem(BaseModel):
    testCode: str
    testName: str
    quantity: int = 1
    unitPrice: float
    totalPrice: float


class InvoiceResponse(BaseModel):
    invoiceId: int
    invoiceNumber: str = Field(..., pattern=INVOICE_NUMBER_PATTERN)
    orderId: int
    patientId: int
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
