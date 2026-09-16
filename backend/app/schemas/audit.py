"""Audit API schemas."""
from datetime import datetime

from pydantic import BaseModel


class AuditLogsCountResponse(BaseModel):
    count: int


class TimelineEventResponse(BaseModel):
    id: int
    type: str
    category: str | None = None
    tone: str | None = None
    entityType: str
    entityId: int
    timestamp: str
    performedBy: str
    performedByName: str | None = None
    metadata: dict
    beforeState: dict | None = None
    afterState: dict | None = None
    comment: str | None = None


class EntityTimelineResponse(BaseModel):
    events: list[TimelineEventResponse]
    total: int


class LabOperationLogResponse(BaseModel):
    id: int
    operationType: str
    entityType: str
    entityId: int
    performedBy: str
    performedByName: str | None = None
    performedAt: datetime
    beforeState: dict | None = None
    afterState: dict | None = None
    operationData: dict | None = None
    comment: str | None = None

    class Config:
        from_attributes = True
