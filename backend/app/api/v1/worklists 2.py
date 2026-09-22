"""Lab worklist API routes."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import require_lab_tech, require_sample_collector
from app.db.database import get_db
from app.models.user import User
from app.schemas.enums import PriorityLevel, UserRole
from app.schemas.worklists import (
    CollectionWorklistItem,
    DashboardBlockedWorklistItem,
    DashboardWorklistItem,
    EntryWorklistItem,
    LabBoardResponse,
    ValidationWorklistItem,
    WorklistPagination,
    WorklistResponse,
)
from app.services.lab.worklists import LabWorklistService

router = APIRouter(tags=["lab-worklists"])


def _worklist_response(items: list, pagination: dict) -> WorklistResponse:
    return WorklistResponse(
        items=items,
        pagination=WorklistPagination(**pagination),
    )


@router.get("/lab/worklists/collection")
def get_collection_worklist(
    page: int = Query(1, ge=1),
    pageSize: int = Query(50, ge=1, le=200),
    search: str | None = None,
    priority: PriorityLevel | None = None,
    db: Session = Depends(get_db),
    _user: User = Depends(require_sample_collector),
):
    result = LabWorklistService(db).list_collection(
        page=page, page_size=pageSize, search=search, priority=priority
    )
    items = [CollectionWorklistItem(**item) for item in result["items"]]
    return _worklist_response(items, result["pagination"])


@router.get("/lab/worklists/entry")
def get_entry_worklist(
    page: int = Query(1, ge=1),
    pageSize: int = Query(50, ge=1, le=200),
    search: str | None = None,
    priority: PriorityLevel | None = None,
    db: Session = Depends(get_db),
    _user: User = Depends(require_lab_tech),
):
    result = LabWorklistService(db).list_entry(
        page=page, page_size=pageSize, search=search, priority=priority
    )
    items = [EntryWorklistItem(**item) for item in result["items"]]
    return _worklist_response(items, result["pagination"])


@router.get("/lab/worklists/dashboard-blocked")
def get_dashboard_blocked_worklist(
    page: int = Query(1, ge=1),
    pageSize: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _user: User = Depends(require_lab_tech),
):
    result = LabWorklistService(db).list_dashboard_blocked(page=page, page_size=pageSize)
    items = [DashboardBlockedWorklistItem(**item) for item in result["items"]]
    return _worklist_response(items, result["pagination"])


@router.get("/lab/worklists/dashboard-today")
def get_dashboard_worklist_today(
    page: int = Query(1, ge=1),
    pageSize: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lab_tech),
):
    result = LabWorklistService(db).list_dashboard_work_today(
        user_id=current_user.id,
        page=page,
        page_size=pageSize,
    )
    items = [DashboardWorklistItem(**item) for item in result["items"]]
    return _worklist_response(items, result["pagination"])


@router.get("/lab/worklists/validation")
def get_validation_worklist(
    page: int = Query(1, ge=1),
    pageSize: int = Query(50, ge=1, le=200),
    search: str | None = None,
    priority: PriorityLevel | None = None,
    db: Session = Depends(get_db),
    _user: User = Depends(require_lab_tech),
):
    result = LabWorklistService(db).list_validation(
        page=page, page_size=pageSize, search=search, priority=priority
    )
    items = [ValidationWorklistItem(**item) for item in result["items"]]
    return _worklist_response(items, result["pagination"])


@router.get("/lab/board", response_model=LabBoardResponse)
def get_lab_board(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lab_tech),
):
    include_supervisor = current_user.role in (UserRole.ADMIN, UserRole.LAB_TECH_PLUS)
    return LabWorklistService(db).get_board(include_supervisor=include_supervisor)
