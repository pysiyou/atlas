"""Composed snippets repeated across list and worklist API responses."""

from datetime import datetime

from app.shared.contracts.enums import Gender, OrderStatus, PaymentStatus, PriorityLevel
from app.shared.schemas.status_presentation import StatusPresentation
from pydantic import BaseModel, Field

from app.domains.lab.schemas.allowed_actions import LabWorklistAllowedActions


class PatientListSnippet(BaseModel):
    """Patient fields commonly denormalized onto order and worklist rows."""

    patientId: int
    patientName: str
    patientDob: str | None = None
    patientGender: Gender | None = None
    patientEmail: str | None = None
    patientPhone: str | None = None


class OrderListHeader(BaseModel):
    """Order header fields shared by list endpoints."""

    orderId: int
    orderDate: datetime
    priority: PriorityLevel
    paymentStatus: PaymentStatus
    overallStatus: OrderStatus | None = None
    statusPresentation: StatusPresentation | None = None
    referentDoctorName: str | None = None


class LabWorkItemSurface(BaseModel):
    """Lab projection fields flattened onto worklist rows."""

    pipelineStage: str | None = None
    attentionReason: str | None = None
    attentionLabel: str | None = None
    allowedActions: LabWorklistAllowedActions = Field(default_factory=LabWorklistAllowedActions)
    denyReason: str | None = None
    denyMessage: str | None = None
    statusPresentation: StatusPresentation | None = None
