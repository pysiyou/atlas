"""
Command Center API — activity timeline.
"""
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import require_lab_tech
from app.database import get_db
from app.models.user import User
from app.schemas.command_center import TimelineResponse
from app.services.command_center_service import CommandCenterService

router = APIRouter(tags=["command-center"])


@router.get(
    "/command-center/timeline",
    response_model=TimelineResponse,
    status_code=status.HTTP_200_OK,
)
def get_timeline(
    hours_back: int = Query(24, ge=1, le=168, description="Lookback window in hours"),
    limit: int = Query(100, ge=1, le=200, description="Maximum events per page"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
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
