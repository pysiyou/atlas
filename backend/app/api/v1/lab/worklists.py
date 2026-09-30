"""Lab worklist and monitor board routes."""

from typing import Literal

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
    LabBoardSummaryResponse,
    ValidationWorklistItem,
    WorklistPagination,
    WorklistResponse,
)
from app.services.lab.observability import log_lab_read
from app.services.lab.worklists import LabWorklistService

router = APIRouter()


def _worklist_response(items: list, pagination: dict) -> WorklistResponse:
    return WorklistResponse(
        items=items,
        pagination=WorklistPagination(**pagination),
    )


@router.get("/worklists/collection")
def get_collection_worklist(
    page: int = Query(1, ge=1),
    pageSize: int = Query(50, ge=1, le=200),
    search: str | None = None,
    priority: PriorityLevel | None = None,
    db: Session = Depends(get_db),
    _user: User = Depends(require_sample_collector),
):
    with log_lab_read("lab.worklists.collection", page=page, page_size=pageSize) as metrics:
        result = LabWorklistService(db).list_collection(
            page=page, page_size=pageSize, search=search, priority=priority
        )
        metrics["rows_loaded"] = result.get("rows_loaded")
        metrics["rows_returned"] = len(result["items"])
    items = [CollectionWorklistItem(**item) for item in result["items"]]
    return _worklist_response(items, result["pagination"])


@router.get("/worklists/entry")
def get_entry_worklist(
    page: int = Query(1, ge=1),
    pageSize: int = Query(50, ge=1, le=200),
    search: str | None = None,
    priority: PriorityLevel | None = None,
    db: Session = Depends(get_db),
    _user: User = Depends(require_lab_tech),
):
    with log_lab_read("lab.worklists.entry", page=page, page_size=pageSize) as metrics:
        result = LabWorklistService(db).list_entry(
            page=page, page_size=pageSize, search=search, priority=priority
        )
        metrics["rows_loaded"] = result.get("rows_loaded")
        metrics["rows_returned"] = len(result["items"])
    items = [EntryWorklistItem(**item) for item in result["items"]]
    return _worklist_response(items, result["pagination"])


@router.get("/worklists/dashboard-blocked")
def get_dashboard_blocked_worklist(
    page: int = Query(1, ge=1),
    pageSize: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _user: User = Depends(require_lab_tech),
):
    result = LabWorklistService(db).list_dashboard_blocked(page=page, page_size=pageSize)
    items = [DashboardBlockedWorklistItem(**item) for item in result["items"]]
    return _worklist_response(items, result["pagination"])


@router.get("/worklists/validation")
def get_validation_worklist(
    page: int = Query(1, ge=1),
    pageSize: int = Query(50, ge=1, le=200),
    search: str | None = None,
    priority: PriorityLevel | None = None,
    db: Session = Depends(get_db),
    _user: User = Depends(require_lab_tech),
):
    with log_lab_read("lab.worklists.validation", page=page, page_size=pageSize) as metrics:
        result = LabWorklistService(db).list_validation(
            page=page, page_size=pageSize, search=search, priority=priority
        )
        metrics["rows_loaded"] = result.get("rows_loaded")
        metrics["rows_returned"] = len(result["items"])
    items = [ValidationWorklistItem(**item) for item in result["items"]]
    return _worklist_response(items, result["pagination"])


@router.get("/worklists/dashboard-today")
def get_dashboard_worklist_today(
    page: int = Query(1, ge=1),
    pageSize: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lab_tech),
):
    with log_lab_read("lab.worklists.dashboard_today", page=page, page_size=pageSize) as metrics:
        result = LabWorklistService(db).list_dashboard_work_today(
            user_id=current_user.id,
            page=page,
            page_size=pageSize,
        )
        metrics["rows_loaded"] = result.get("rows_loaded")
        metrics["rows_returned"] = len(result["items"])
    items = [DashboardWorklistItem(**item) for item in result["items"]]
    return _worklist_response(items, result["pagination"])


@router.get("/board", response_model=LabBoardResponse)
def get_lab_board(
    detail: Literal["summary", "full"] = Query("full"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lab_tech),
):
    include_supervisor = current_user.role in (UserRole.ADMIN, UserRole.LAB_TECH_PLUS)
    with log_lab_read(
        "lab.board",
        include_supervisor=include_supervisor,
        detail=detail,
    ) as metrics:
        service = LabWorklistService(db)
        payload = service.get_board(
            include_supervisor=include_supervisor,
            detail=detail,
        )
        metrics["rows_loaded"] = payload.get("_rows_loaded")
        metrics["rows_returned"] = len(payload.get("attentionItems") or [])
    payload.pop("_rows_loaded", None)
    if detail == "summary":
        payload = service.expand_summary_to_board_response(payload)
    return payload


@router.get("/board/summary", response_model=LabBoardSummaryResponse)
def get_lab_board_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lab_tech),
):
    include_supervisor = current_user.role in (UserRole.ADMIN, UserRole.LAB_TECH_PLUS)
    with log_lab_read(
        "lab.board.summary",
        include_supervisor=include_supervisor,
        detail="summary",
    ) as metrics:
        payload = LabWorklistService(db).get_board(
            include_supervisor=include_supervisor,
            detail="summary",
        )
        metrics["rows_loaded"] = payload.get("_rows_loaded")
        payload.pop("_rows_loaded", None)
    return payload
