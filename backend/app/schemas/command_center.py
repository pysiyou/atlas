"""Command center API schemas."""
from typing import List

from pydantic import BaseModel


class TimelineEvent(BaseModel):
    id: int
    type: str
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
    events: List[TimelineEvent]
    total: int
