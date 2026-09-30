"""Critical values API schemas."""
from datetime import datetime

from pydantic import BaseModel


class CriticalValueResponse(BaseModel):
    id: int
    orderId: int
    testCode: str
    testName: str | None
    patientId: int
    patientName: str
    flags: list[str] | None
    criticalNotificationSent: bool
    criticalNotifiedAt: datetime | None
    criticalNotifiedTo: str | None
    criticalAcknowledgedAt: datetime | None
    resultEnteredAt: datetime | None
    status: str

    class Config:
        from_attributes = True


class NotifyRequest(BaseModel):
    notifiedTo: str
    notificationMethod: str = "phone"
    notes: str | None = None


class AcknowledgeRequest(BaseModel):
    acknowledgedBy: str
    notes: str | None = None


class BulkNotifyRequest(BaseModel):
    testIds: list[int]
    notifiedTo: str
    notificationMethod: str = "phone"
