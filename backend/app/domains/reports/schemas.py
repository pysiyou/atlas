"""Report generation API schemas."""
from datetime import datetime

from app.shared.contracts.enums import Gender
from pydantic import BaseModel


class ReportableOrderItem(BaseModel):
    """One lab report row: a non-cancelled order with at least one active test."""

    orderId: int
    orderDate: datetime
    patientId: int
    patientName: str
    patientDob: str | None = None
    patientGender: Gender | None = None
    activeTestCount: int
    validatedTestCount: int
    order: dict
