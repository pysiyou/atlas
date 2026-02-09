"""
Pydantic schemas for Payment
"""
from pydantic import BaseModel, Field
from datetime import datetime
from app.schemas.enums import PaymentMethod


class PaymentCreate(BaseModel):
    orderId: int
    amount: float = Field(gt=0, description="Payment amount must be greater than 0")
    paymentMethod: PaymentMethod
    notes: str | None = None


class PaymentResponse(BaseModel):
    paymentId: int
    orderId: int
    invoiceId: int | None = None
    amount: float
    paymentMethod: PaymentMethod
    paidAt: datetime
    receivedBy: str
    receiptGenerated: bool
    notes: str | None = None
    
    # Computed fields from relationships
    orderTotalPrice: float | None = None
    numberOfTests: int | None = None
    patientName: str | None = None
    
    class Config:
        from_attributes = True
