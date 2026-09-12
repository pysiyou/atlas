"""Audit API schemas."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class AuditLogsCountResponse(BaseModel):
    count: int


class TimelineEventResponse(BaseModel):
    id: int
    type: str
    phase: Optional[str] = None
    tone: Optional[str] = None
    entityType: str
    entityId: int
    timestamp: str
    performedBy: str
    performedByName: Optional[str] = None
    metadata: dict
    beforeState: Optional[dict] = None
    afterState: Optional[dict] = None
    comment: Optional[str] = None


class EntityTimelineResponse(BaseModel):
    events: list[TimelineEventResponse]
    total: int


class LabOperationLogResponse(BaseModel):
    id: int
    operationType: str
    entityType: str
    entityId: int
    performedBy: str
    performedByName: Optional[str] = None
    performedAt: datetime
    beforeState: Optional[dict] = None
    afterState: Optional[dict] = None
    operationData: Optional[dict] = None
    comment: Optional[str] = None

    class Config:
        from_attributes = True
