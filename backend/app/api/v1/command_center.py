"""
Command Center API — activity timeline.
"""
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import require_lab_tech
from app.db.database import get_db
from app.models.user import User
from app.schemas.command_center import TimelineResponse
from app.services.timeline import CommandCenterService

router = APIRouter(tags=["command-center"])


def _normalize_categories(categories: list[str] | None) -> list[str] | None:
    if not categories:
        return None
    resolved: list[str] = []
    for item in categories:
        resolved.extend(part.strip() for part in item.split(",") if part.strip())
    return resolved or None


@router.get(
    "/command-center/timeline",
    response_model=TimelineResponse,
    status_code=status.HTTP_200_OK,
)
def get_timeline(
    hours_back: int = Query(24, ge=1, le=168, description="Lookback window in hours"),
    limit: int = Query(100, ge=1, le=200, description="Maximum events per page"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    categories: list[str] | None = Query(
        None,
        description="Optional categories: order, payment, sample, result, other (legacy: specimen→sample)",
    ),
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_lab_tech),
):
    service = CommandCenterService(db)
    resolved = _normalize_categories(categories)
    events = service.get_timeline_events(
        hours_back=hours_back,
        limit=limit,
        offset=offset,
        categories=resolved,
    )
    total = service.get_timeline_count(hours_back=hours_back, categories=resolved)
    return TimelineResponse(events=events, total=total)
