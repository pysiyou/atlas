"""Lab worklist and monitor board routes."""

import logging
import time
from collections.abc import Callable, Iterator
from contextlib import contextmanager
from datetime import date
from typing import Any, Literal, TypeVar

from app.domains.lab.deps import get_lab_worklist_service
from app.domains.lab.monitor.worklist_service import LabWorklistService
from app.domains.lab.schemas.worklists import (
    CollectionWorklistItem,
    DashboardWorklistItem,
    EntryWorklistItem,
    LabBoardResponse,
    LabBoardSummaryResponse,
    ValidationWorklistItem,
    WorklistPagination,
    WorklistResponse,
)
from app.domains.users.models import User
from app.platform.http.dependencies import require_lab_tech, require_sample_collector
from app.platform.utils.common import parse_csv_values
from app.shared.contracts.enums import PriorityLevel, TestStatus, UserRole
from fastapi import APIRouter, Depends, Query

router = APIRouter()

logger = logging.getLogger(__name__)


@contextmanager
def log_lab_read(
    endpoint: str,
    *,
    page: int | None = None,
    page_size: int | None = None,
    include_supervisor: bool | None = None,
    detail: str | None = None,
) -> Iterator[dict[str, Any]]:
    """Context manager that records duration_ms, rows_loaded, rows_returned on exit."""
    metrics: dict[str, Any] = {
        "rows_loaded": None,
        "rows_returned": None,
    }
    started = time.perf_counter()
    try:
        yield metrics
    finally:
        duration_ms = round((time.perf_counter() - started) * 1000, 2)
        extra = {
            "endpoint": endpoint,
            "duration_ms": duration_ms,
            "rows_loaded": metrics.get("rows_loaded"),
            "rows_returned": metrics.get("rows_returned"),
        }
        if page is not None:
            extra["page"] = page
        if page_size is not None:
            extra["page_size"] = page_size
        if include_supervisor is not None:
            extra["include_supervisor"] = include_supervisor
        if detail is not None:
            extra["detail"] = detail
        logger.info("lab_read %s", extra)


def _worklist_response(items: list, pagination: dict) -> WorklistResponse:
    return WorklistResponse(
        items=items,
        pagination=WorklistPagination(**pagination),
    )


TItem = TypeVar("TItem")


def _paginated_filterable_worklist(
    *,
    log_name: str,
    page: int,
    page_size: int,
    list_fn: Callable[..., dict[str, Any]],
    item_model: type[TItem],
    search: str | None,
    priority: PriorityLevel | None,
    date_from: date | None,
    date_to: date | None,
    sample_type: str | None,
) -> WorklistResponse:
    with log_lab_read(log_name, page=page, page_size=page_size) as metrics:
        result = list_fn(
            page=page,
            page_size=page_size,
            search=search,
            priority=priority,
            date_from=date_from,
            date_to=date_to,
            sample_types=parse_csv_values(sample_type) or None,
        )
        metrics["rows_loaded"] = result.get("rows_loaded")
        metrics["rows_returned"] = len(result["items"])
    items = [item_model(**item) for item in result["items"]]
    return _worklist_response(items, result["pagination"])


def _stage_worklist_kwargs(
    *,
    search: str | None,
    priority: PriorityLevel | None,
    date_from: date | None,
    date_to: date | None,
    sample_type: str | None,
) -> dict[str, Any]:
    return {
        "search": search,
        "priority": priority,
        "date_from": date_from,
        "date_to": date_to,
        "sample_type": sample_type,
    }


@router.get("/worklists/collection")
def get_collection_worklist(
    page: int = Query(1, ge=1),
    pageSize: int = Query(50, ge=1, le=200),
    search: str | None = None,
    priority: PriorityLevel | None = None,
    dateFrom: date | None = Query(None),
    dateTo: date | None = Query(None),
    sampleType: str | None = Query(None, description="Comma-separated sample types"),
    service: LabWorklistService = Depends(get_lab_worklist_service),
    _user: User = Depends(require_sample_collector),
):
    return _paginated_filterable_worklist(
        log_name="lab.worklists.collection",
        page=page,
        page_size=pageSize,
        list_fn=service.list_collection,
        item_model=CollectionWorklistItem,
        **_stage_worklist_kwargs(
            search=search,
            priority=priority,
            date_from=dateFrom,
            date_to=dateTo,
            sample_type=sampleType,
        ),
    )


@router.get("/worklists/entry")
def get_entry_worklist(
    page: int = Query(1, ge=1),
    pageSize: int = Query(50, ge=1, le=200),
    search: str | None = None,
    priority: PriorityLevel | None = None,
    dateFrom: date | None = Query(None),
    dateTo: date | None = Query(None),
    sampleType: str | None = Query(None, description="Comma-separated sample types"),
    service: LabWorklistService = Depends(get_lab_worklist_service),
    _user: User = Depends(require_lab_tech),
):
    return _paginated_filterable_worklist(
        log_name="lab.worklists.entry",
        page=page,
        page_size=pageSize,
        list_fn=service.list_entry,
        item_model=EntryWorklistItem,
        **_stage_worklist_kwargs(
            search=search,
            priority=priority,
            date_from=dateFrom,
            date_to=dateTo,
            sample_type=sampleType,
        ),
    )


@router.get("/worklists/validation")
def get_validation_worklist(
    page: int = Query(1, ge=1),
    pageSize: int = Query(50, ge=1, le=200),
    search: str | None = None,
    priority: PriorityLevel | None = None,
    dateFrom: date | None = Query(None),
    dateTo: date | None = Query(None),
    sampleType: str | None = Query(None, description="Comma-separated sample types"),
    service: LabWorklistService = Depends(get_lab_worklist_service),
    _user: User = Depends(require_lab_tech),
):
    return _paginated_filterable_worklist(
        log_name="lab.worklists.validation",
        page=page,
        page_size=pageSize,
        list_fn=service.list_validation,
        item_model=ValidationWorklistItem,
        **_stage_worklist_kwargs(
            search=search,
            priority=priority,
            date_from=dateFrom,
            date_to=dateTo,
            sample_type=sampleType,
        ),
    )


@router.get("/worklists/dashboard-today")
def get_dashboard_worklist_today(
    page: int = Query(1, ge=1),
    pageSize: int = Query(50, ge=1, le=200),
    service: LabWorklistService = Depends(get_lab_worklist_service),
    current_user: User = Depends(require_lab_tech),
):
    with log_lab_read("lab.worklists.dashboard_today", page=page, page_size=pageSize) as metrics:
        result = service.list_dashboard_work_today(
            user_id=current_user.id,
            page=page,
            page_size=pageSize,
        )
        metrics["rows_loaded"] = result.get("rows_loaded")
        metrics["rows_returned"] = len(result["items"])
    items = [DashboardWorklistItem(**item) for item in result["items"]]
    return _worklist_response(items, result["pagination"])


@router.get("/worklists/all-tests")
def get_all_tests_worklist(
    page: int = Query(1, ge=1),
    pageSize: int = Query(50, ge=1, le=200),
    search: str | None = None,
    status: str | None = Query(None, description="Comma-separated test statuses"),
    priority: str | None = Query(None, description="Comma-separated priority levels"),
    dateFrom: date | None = Query(None, description="Last modified on or after (UTC date)"),
    dateTo: date | None = Query(None, description="Last modified on or before (UTC date)"),
    sampleType: str | None = Query(None, description="Comma-separated sample types"),
    service: LabWorklistService = Depends(get_lab_worklist_service),
    _user: User = Depends(require_lab_tech),
):
    status_wires = parse_csv_values(status) or None
    statuses: list[TestStatus] | None = None
    if status_wires:
        statuses = [TestStatus(w) for w in status_wires]

    priority_wires = parse_csv_values(priority) or None
    priorities: list[PriorityLevel] | None = None
    if priority_wires:
        priorities = [PriorityLevel(w) for w in priority_wires]

    with log_lab_read("lab.worklists.all_tests", page=page, page_size=pageSize) as metrics:
        result = service.list_all_order_tests(
            page=page,
            page_size=pageSize,
            search=search,
            priorities=priorities,
            statuses=statuses,
            date_from=dateFrom,
            date_to=dateTo,
            sample_types=parse_csv_values(sampleType) or None,
        )
        metrics["rows_loaded"] = result.get("rows_loaded")
        metrics["rows_returned"] = len(result["items"])
    items = [DashboardWorklistItem(**item) for item in result["items"]]
    return _worklist_response(items, result["pagination"])


@router.get("/board", response_model=LabBoardResponse)
def get_lab_board(
    detail: Literal["summary", "full"] = Query("full"),
    service: LabWorklistService = Depends(get_lab_worklist_service),
    current_user: User = Depends(require_lab_tech),
):
    include_supervisor = current_user.role in (UserRole.ADMIN, UserRole.LAB_TECH_PLUS)
    with log_lab_read(
        "lab.board",
        include_supervisor=include_supervisor,
        detail=detail,
    ) as metrics:
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
    service: LabWorklistService = Depends(get_lab_worklist_service),
    current_user: User = Depends(require_sample_collector),
):
    include_supervisor = current_user.role in (UserRole.ADMIN, UserRole.LAB_TECH_PLUS)
    with log_lab_read(
        "lab.board.summary",
        include_supervisor=include_supervisor,
        detail="summary",
    ) as metrics:
        payload = service.get_board(
            include_supervisor=include_supervisor,
            detail="summary",
        )
        metrics["rows_loaded"] = payload.get("_rows_loaded")
        payload.pop("_rows_loaded", None)
    return payload
