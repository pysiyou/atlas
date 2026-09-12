"""Order endpoint request schemas."""
from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.enums import PaymentStatus


class OrderPaymentUpdate(BaseModel):
    """Body for PATCH /orders/{orderId}/payment"""
    paymentStatus: PaymentStatus = Field(..., description="paid | unpaid")
    amountPaid: Optional[float] = Field(None, ge=0)
