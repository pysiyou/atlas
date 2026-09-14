"""Billing API schemas — invoices and insurance claims."""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.schemas.enums import ClaimStatus, PaymentStatus


class InvoiceItem(BaseModel):
    testCode: str
    testName: str
    quantity: int = 1
    unitPrice: float
    totalPrice: float


class InvoiceResponse(BaseModel):
    invoiceId: int
    orderId: int
    patientId: int
    patientName: str
    items: List[InvoiceItem]
    subtotal: float
    discount: float
    tax: float
    total: float
    paymentStatus: PaymentStatus
    amountPaid: float
    amountDue: float
    createdAt: datetime
    updatedAt: datetime
    dueDate: Optional[datetime] = None

    class Config:
        from_attributes = True


class InsuranceClaimCreate(BaseModel):
    orderId: int
    invoiceId: int
    insuranceProvider: str = Field(..., min_length=1, max_length=200)
    insuranceNumber: str = Field(..., min_length=1, max_length=100)
    claimAmount: float = Field(..., gt=0)
    notes: Optional[str] = None


class InsuranceClaimResponse(BaseModel):
    claimId: int
    orderId: int
    invoiceId: int
    patientId: int
    insuranceProvider: str
    insuranceNumber: str
    claimAmount: float
    approvedAmount: Optional[float] = None
    claimStatus: ClaimStatus
    submittedDate: datetime
    processedDate: Optional[datetime] = None
    denialReason: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True
