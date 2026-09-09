"""
Command Center API — dashboard metrics and activity timeline.
"""
from typing import List

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.dependencies import require_lab_tech
from app.database import get_db
from app.models.user import User
from app.services.command_center_service import CommandCenterService

router = APIRouter(tags=["command-center"])


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


class CategorySummaryItem(BaseModel):
    category: str
    count: int
    percentage: int


class CategorySummaryResponse(BaseModel):
    total: int
    categories: List[CategorySummaryItem]


class OperationsOverviewResponse(BaseModel):
    testFlow: dict[str, int]
    escalations: dict[str, int]
    qualityIssues: int
    recollectionRequests: dict[str, int]


class StageTimingItem(BaseModel):
    key: str
    name: str
    hours: float
    targetHours: float
    minHours: float
    maxHours: float
    p95Hours: float


class StageTimingResponse(BaseModel):
    stages: List[StageTimingItem]


class DelaySourceItem(BaseModel):
    key: str
    name: str
    count: int
    avgDelayHours: float
    impactHours: float
    pctOfTests: float


class DelayImpactResponse(BaseModel):
    sources: List[DelaySourceItem]
    totalImpactHours: float


class TatStageItem(BaseModel):
    key: str
    label: str
    hours: float


class TurnaroundTimeResponse(BaseModel):
    avgHours: float
    targetHours: float
    medianHours: float
    p95Hours: float
    minHours: float
    maxHours: float
    stages: List[TatStageItem]


class DelaySeverityItem(BaseModel):
    key: str
    label: str
    count: int
    pct: int


class SlaPerformanceResponse(BaseModel):
    onTimeRate: int
    onTimeTarget: int
    totalTests: int
    onTimeCount: int
    delayedCount: int
    delayedRate: int
    avgDelayOverTarget: float
    delaySeverity: List[DelaySeverityItem]


class CommandCenterDashboardResponse(BaseModel):
    operationsOverview: OperationsOverviewResponse
    categorySummary: CategorySummaryResponse
    stageTiming: StageTimingResponse
    delayImpact: DelayImpactResponse
    turnaroundTime: TurnaroundTimeResponse
    slaPerformance: SlaPerformanceResponse


@router.get(
    "/command-center/dashboard",
    response_model=CommandCenterDashboardResponse,
    status_code=status.HTTP_200_OK,
)
def get_dashboard(
    hours_back: int = Query(24, description="Lookback window in hours"),
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_lab_tech),
):
    service = CommandCenterService(db)
    return service.get_dashboard(hours_back=hours_back)


@router.get(
    "/command-center/timeline",
    response_model=TimelineResponse,
    status_code=status.HTTP_200_OK,
)
def get_timeline(
    hours_back: int = 24,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_lab_tech),
):
    service = CommandCenterService(db)
    events = service.get_timeline_events(
        hours_back=hours_back,
        limit=limit,
        offset=offset,
    )
    total = service.get_timeline_count(hours_back=hours_back)
    return TimelineResponse(events=events, total=total)
