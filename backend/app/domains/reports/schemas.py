"""Report generation API schemas."""
from datetime import datetime

from app.shared.contracts.enums import Gender, OrderStatus
from app.shared.schemas.status_presentation import StatusPresentation
from pydantic import BaseModel, Field


class ReportableOrderItem(BaseModel):
    """One lab report row: a non-cancelled order with at least one active test."""

    orderId: int
    orderDate: datetime
    overallStatus: OrderStatus
    statusPresentation: StatusPresentation
    patientId: int
    patientName: str
    patientDob: str | None = None
    patientGender: Gender | None = None
    patientEmail: str | None = None
    patientPhone: str | None = None
    activeTestCount: int
    validatedTestCount: int
    testCodes: list[str] = Field(default_factory=list)
    testNames: list[str] = Field(default_factory=list)
    # Full order graph is omitted from list rows and hydrated on the detail endpoint.
    order: dict | None = None


class ReportEmailRequest(BaseModel):
    """Send the order PDF to the patient and/or referent physician."""

    includePatient: bool = True
    includePhysician: bool = True
    extraRecipients: list[str] = Field(default_factory=list)


class ReportBatchRequest(BaseModel):
    """Batch PDF/email of completed reportable orders."""

    orderIds: list[int] = Field(..., min_length=1, max_length=50)
