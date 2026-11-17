"""
Pydantic schemas for Payment
"""
from datetime import datetime

from app.platform.utils import (
    EMPLOYEE_NUMBER_PATTERN,
    FILLER_PATTERN,
    INVOICE_NUMBER_PATTERN,
    RECEIPT_NUMBER_PATTERN,
)
from app.shared.contracts.enums import PaymentMethod, PaymentStatus
from pydantic import BaseModel, Field


class PaymentCreate(BaseModel):
    orderId: str = Field(..., pattern=FILLER_PATTERN)
    amount: float = Field(gt=0, description="Payment amount must be greater than 0")
    paymentMethod: PaymentMethod
    notes: str | None = None


class PaymentResponse(BaseModel):
    paymentId: str = Field(..., pattern=RECEIPT_NUMBER_PATTERN)
    orderId: str = Field(..., pattern=FILLER_PATTERN)
    invoiceId: str | None = Field(None, pattern=INVOICE_NUMBER_PATTERN)
    amount: float
    paymentMethod: PaymentMethod
    paidAt: datetime
    createdBy: str = Field(..., pattern=EMPLOYEE_NUMBER_PATTERN)
    receiptGenerated: bool
    notes: str | None = None

    # Computed fields from relationships
    orderTotalPrice: float | None = None
    numberOfTests: int | None = None
    patientName: str | None = None
    orderPaymentStatus: PaymentStatus | None = None

    class Config:
        from_attributes = True
