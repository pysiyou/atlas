"""
Lab Monitoring API - Command center timeline and metrics.
"""
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.lab_monitoring_service import LabMonitoringService


router = APIRouter(tags=["monitoring"])


# Pydantic models
from pydantic import BaseModel


class TimelineEvent(BaseModel):
    """Simplified timeline event for command center."""
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
    """Timeline response with events and total count."""
    events: List[TimelineEvent]
    total: int


@router.get(
    "/monitoring/timeline",
    response_model=TimelineResponse,
    status_code=status.HTTP_200_OK
)
def get_timeline(
    hours_back: int = 24,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """
    Get lab timeline events for command center.
    
    Returns recent lab operations with minimal data.
    Frontend handles all formatting and display logic.
    
    - **hours_back**: How many hours to look back (default 24)
    - **limit**: Max events to return (default 100)
    - **offset**: Pagination offset (default 0)
    """
    service = LabMonitoringService(db)
    
    events = service.get_timeline_events(
        hours_back=hours_back,
        limit=limit,
        offset=offset
    )
    
    total = service.get_timeline_count(hours_back=hours_back)
    
    return TimelineResponse(
        events=events,
        total=total
    )
