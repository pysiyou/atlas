"""Critical values API schemas."""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class CriticalValueResponse(BaseModel):
    id: int
    orderId: int
    testCode: str
    testName: Optional[str]
    patientId: int
    patientName: str
    flags: Optional[List[str]]
    criticalNotificationSent: bool
    criticalNotifiedAt: Optional[datetime]
    criticalNotifiedTo: Optional[str]
    criticalAcknowledgedAt: Optional[datetime]
    resultEnteredAt: Optional[datetime]
    status: str

    class Config:
        from_attributes = True


class NotifyRequest(BaseModel):
    notifiedTo: str
    notificationMethod: str = "phone"
    notes: Optional[str] = None


class AcknowledgeRequest(BaseModel):
    acknowledgedBy: str
    notes: Optional[str] = None


class BulkNotifyRequest(BaseModel):
    testIds: List[int]
    notifiedTo: str
    notificationMethod: str = "phone"
