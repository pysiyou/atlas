"""
Pydantic schemas for Payment
"""
from datetime import datetime

from app.platform.utils import FILLER_PATTERN, RECEIPT_NUMBER_PATTERN
from app.shared.contracts.enums import PaymentMethod, PaymentStatus
from pydantic import BaseModel, Field


class PaymentCreate(BaseModel):
    orderId: str
    amount: float = Field(gt=0, description="Payment amount must be greater than 0")
    paymentMethod: PaymentMethod
    notes: str | None = None


class PaymentResponse(BaseModel):
    paymentId: str = Field(..., pattern=RECEIPT_NUMBER_PATTERN)
    orderId: str
    invoiceId: str | None = None
    amount: float
    paymentMethod: PaymentMethod
    paidAt: datetime
    createdBy: str
    receiptGenerated: bool
    notes: str | None = None

    # Computed fields from relationships
    orderTotalPrice: float | None = None
    numberOfTests: int | None = None
    patientName: str | None = None
    orderPaymentStatus: PaymentStatus | None = None

    class Config:
        from_attributes = True
