"""Audit event log read API — fetch by containment scope, not category trees."""
from datetime import datetime
from typing import Literal
from uuid import UUID

from app.domains.audit.kinds import (
    STORED_EVENT_SCOPES,
    parse_actor_roles_param,
    parse_kinds_param,
    validate_actor_roles,
)
from app.domains.audit.schemas import AuditEventResponse, AuditSearchPreviewResponse
from app.domains.audit.service import AuditEventQueryService
from app.domains.users.models import User
from app.platform.database import get_db
from app.platform.http.dependencies import get_current_user
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

router = APIRouter(tags=["audit"])

EventLogScopeParam = Literal["order", "lab", "patient", "system", "stream"]
StoredEventScopeParam = Literal["order", "lab", "patient", "system"]


@router.get("/audit/search-preview", response_model=AuditSearchPreviewResponse)
def audit_search_preview(
    q: str = Query(..., min_length=1, max_length=100),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """Preview how unified event-log search interprets a query string."""
    term = q.strip()
    if not term:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="q must not be empty",
        )
    return AuditEventQueryService(db).search_preview(term)


@router.get("/audit/events", response_model=list[AuditEventResponse])
def list_audit_events(
    scope: EventLogScopeParam = Query(
        "stream",
        description="Containment lens: order, lab, patient, system, or stream",
    ),
    order_id: int | None = Query(None, alias="orderId"),
    patient_id: int | None = Query(None, alias="patientId"),
    test_id: int | None = Query(None, alias="testId"),
    sample_id: int | None = Query(None, alias="sampleId"),
    hours: float | None = Query(
        None,
        gt=0,
        le=24 * 365,
        description="Return events created within the last N hours (UTC); ignored if createdFrom is set",
    ),
    created_from: datetime | None = Query(None, alias="createdFrom"),
    created_to: datetime | None = Query(None, alias="createdTo"),
    kinds: str | None = Query(
        None,
        description=(
            "Comma-separated kind keys: patient, order, laboratory, billing, reporting, "
            "system, plus laboratory:sample|result|validation|escalation|quality|analyzer"
        ),
    ),
    include_access: bool = Query(
        False,
        alias="includeAccess",
        description="When false, omit read-only events such as patient.view",
    ),
    event_scope: StoredEventScopeParam | None = Query(
        None,
        alias="eventScope",
        description="Filter by stored event_scope column (order, lab, patient, system)",
    ),
    cursor_created_at: datetime | None = Query(
        None,
        alias="cursorCreatedAt",
        description="Newest-first cursor: createdAt of the last row from the previous page",
    ),
    cursor_event_id: UUID | None = Query(
        None,
        alias="cursorEventId",
        description="Newest-first cursor: eventId of the last row from the previous page",
    ),
    actor_id: int | None = Query(
        None,
        alias="actorId",
        ge=1,
        description="When set, only events performed by this user id",
    ),
    actor_roles: str | None = Query(
        None,
        alias="actorRoles",
        description="Comma-separated UserRole values; matches actor_snapshot.role at event time",
    ),
    actor_search: str | None = Query(
        None,
        alias="actorSearch",
        max_length=100,
        description="Partial match on actor display name (snapshot) or account username",
    ),
    search: str | None = Query(
        None,
        max_length=100,
        description=(
            "Unified stream search: ORD/TST/SAM/PAT display ids, numeric ids, "
            "patient name, actor name, or username"
        ),
    ),
    limit: int = Query(500, ge=1, le=2000),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    if event_scope is not None and event_scope not in STORED_EVENT_SCOPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="eventScope must be order, lab, patient, or system",
        )
    if (cursor_created_at is None) != (cursor_event_id is None):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="cursorCreatedAt and cursorEventId must be provided together",
        )
    service = AuditEventQueryService(db)
    kind_keys = parse_kinds_param(kinds)
    role_keys = parse_actor_roles_param(actor_roles)
    if role_keys:
        try:
            validate_actor_roles(role_keys)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=str(exc),
            ) from exc
    actor_search_term = actor_search.strip() if actor_search else None
    if actor_search_term == "":
        actor_search_term = None
    unified_search = search.strip() if search else None
    if unified_search == "":
        unified_search = None
    return service.list_filtered(
        scope=scope,
        order_id=order_id,
        patient_id=patient_id,
        test_id=test_id,
        sample_id=sample_id,
        hours=hours,
        created_from=created_from,
        created_to=created_to,
        kinds=kind_keys or None,
        include_access=include_access,
        event_scope=event_scope,
        cursor_created_at=cursor_created_at,
        cursor_event_id=cursor_event_id,
        actor_id=actor_id,
        actor_roles=role_keys or None,
        actor_search=actor_search_term,
        search=unified_search,
        limit=limit,
    )
