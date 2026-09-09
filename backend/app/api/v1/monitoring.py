"""
Lab Monitoring API - Command center timeline and metrics.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.lab_monitoring_service import LabMonitoringService


router = APIRouter(tags=["monitoring"])


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


class CategorySummaryItem(BaseModel):
    """Single category row in the test category breakdown."""
    category: str
    count: int
    percentage: int


class CategorySummaryResponse(BaseModel):
    """Test volume grouped by catalog category."""
    total: int
    categories: List[CategorySummaryItem]


class OperationsOverviewResponse(BaseModel):
    """Operations overview with test flow and exception tracking."""
    testFlow: dict[str, int]
    escalations: dict[str, int]
    qualityIssues: int
    recollectionRequests: dict[str, int]


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


@router.get(
    "/monitoring/category-summary",
    response_model=CategorySummaryResponse,
    status_code=status.HTTP_200_OK,
)
def get_category_summary(
    days: int = Query(90, description="Lookback window in days (7, 30, or 90)"),
    db: Session = Depends(get_db),
):
    """
    Get test volume breakdown by catalog category for the command center.

    Counts non-superseded order tests on orders created within the window.
    """
    if days not in (7, 30, 90):
        raise HTTPException(status_code=422, detail="days must be 7, 30, or 90")

    service = LabMonitoringService(db)
    return service.get_category_summary(days=days)


@router.get(
    "/monitoring/operations-overview",
    response_model=OperationsOverviewResponse,
    status_code=status.HTTP_200_OK,
)
def get_operations_overview(
    hours_back: int = Query(24, description="Lookback window in hours"),
    db: Session = Depends(get_db),
):
    """
    Get lab operations overview for command center.

    Returns test flow by status, escalations, quality issues, and recollection requests.
    """
    service = LabMonitoringService(db)
    return service.get_operations_overview(hours_back=hours_back)
