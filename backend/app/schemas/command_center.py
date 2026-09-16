"""Command center API schemas."""

from pydantic import BaseModel


class TimelineEvent(BaseModel):
    id: int
    type: str
    category: str | None = None
    tone: str | None = None
    entityType: str
    entityId: int
    timestamp: str
    performedBy: str
    performedByName: str | None
    metadata: dict
    beforeState: dict | None = None
    afterState: dict | None = None
    comment: str | None = None


class TimelineResponse(BaseModel):
    events: list[TimelineEvent]
    total: int
