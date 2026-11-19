"""Query audit events for the API."""
from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID

from app.domains.audit.kinds import kinds_to_prefixes, stored_event_scope_for_type
from app.domains.audit.models import AuditEvent
from app.domains.audit.schemas import (
    AuditEventResponse,
    AuditSearchIntent,
    AuditSearchParsedIds,
    AuditSearchPreviewPatient,
    AuditSearchPreviewResponse,
    AuditSearchPreviewUser,
)
from app.domains.audit.search import (
    access_event_types_to_hide,
    apply_unified_search,
    classify_search_term,
)
from app.domains.orders.models import OrderTest
from app.domains.patients.models import Patient
from app.domains.users.models import User
from sqlalchemy import and_, false, func, or_, tuple_
from sqlalchemy.orm import Session

# Events that should show a results panel when metadata/changes lack result payloads.
_ENRICH_RESULTS_FROM_ORDER_TEST = frozenset(
    {
        "laboratory.result.enter",
        "laboratory.validation.approve",
    }
)


def _actor_snapshot_for_api(raw: dict[str, Any] | None) -> dict[str, Any]:
    snap = raw or {}
    user_raw = snap.get("userId", snap.get("user_id"))
    if user_raw == "system" or user_raw is None:
        user_id: str | str = "system"
    else:
        user_id = user_raw

    out: dict[str, Any] = {
        "userId": user_id,
        "name": snap.get("name", "Unknown"),
        "role": snap.get("role", "unknown"),
    }
    ip = snap.get("ipAddress", snap.get("ip_address"))
    if isinstance(ip, str) and ip:
        out["ipAddress"] = ip
    return out


def _changes_for_api(raw: dict[str, Any] | None) -> dict[str, Any] | None:
    if not raw:
        return None
    old_values = raw.get("oldValues", raw.get("old_values")) or {}
    new_values = raw.get("newValues", raw.get("new_values")) or {}
    if not old_values and not new_values:
        return None
    return {"oldValues": old_values, "newValues": new_values}


def _event_has_results_payload(
    event_type: str,
    metadata: dict[str, Any] | None,
    changes: dict[str, Any] | None,
) -> bool:
    meta = metadata or {}
    if meta.get("results"):
        return True
    if not changes:
        return False
    new_values = changes.get("newValues", changes.get("new_values")) or {}
    return bool(new_values.get("results"))


def _load_order_test_results_map(
    db: Session,
    rows: list[AuditEvent],
) -> dict[int, tuple[dict[str, Any], list[str]]]:
    order_test_ids: list[int] = []
    for row in rows:
        if row.targetType != "order_test":
            continue
        if row.eventType not in _ENRICH_RESULTS_FROM_ORDER_TEST:
            continue
        if _event_has_results_payload(row.eventType, row.eventMetadata, row.changes):
            continue
        try:
            order_test_ids.append(int(row.targetId))
        except (TypeError, ValueError):
            continue

    if not order_test_ids:
        return {}

    unique_ids = list(dict.fromkeys(order_test_ids))
    tests = db.query(OrderTest).filter(OrderTest.id.in_(unique_ids)).all()
    out: dict[int, tuple[dict[str, Any], list[str]]] = {}
    for test in tests:
        if not test.results:
            continue
        flags = [str(f) for f in (test.flags or []) if f is not None]
        out[test.id] = (test.results, flags)
    return out


def audit_event_to_response(
    row: AuditEvent,
    order_test_results: dict[int, tuple[dict[str, Any], list[str]]] | None = None,
) -> AuditEventResponse:
    metadata: dict[str, Any] | None = dict(row.eventMetadata) if row.eventMetadata else None
    if (
        order_test_results
        and row.targetType == "order_test"
        and row.eventType in _ENRICH_RESULTS_FROM_ORDER_TEST
        and not _event_has_results_payload(row.eventType, metadata, row.changes)
    ):
        try:
            enriched = order_test_results.get(int(row.targetId))
        except (TypeError, ValueError):
            enriched = None
        if enriched:
            metadata = dict(metadata or {})
            metadata["results"] = enriched[0]
            if enriched[1]:
                metadata["flags"] = enriched[1]

    return AuditEventResponse(
        eventId=row.eventId,
        createdAt=row.createdAt,
        eventType=row.eventType,
        actorId=row.actorId,
        actorSnapshot=_actor_snapshot_for_api(row.actorSnapshot),
        targetType=row.targetType,
        targetId=row.targetId,
        patientId=row.patientId,
        orderId=row.orderId,
        testId=row.testId,
        eventScope=row.eventScope or stored_event_scope_for_type(row.eventType),
        changes=_changes_for_api(row.changes),
        metadata=metadata,
    )


class AuditEventQueryService:
    def __init__(self, db: Session):
        self.db = db

    def _lab_scope_ids(
        self,
        *,
        test_id: int | None,
        sample_id: str | None,
    ) -> tuple[list[int], list[str]]:
        """
        Expand a lab lens into order_test ids and sample ids.

        From a test: that order_test plus its sample (sibling tests stay out).
        From a sample: that sample plus every order_test on it.
        """
        order_test_ids: list[int] = []
        sample_ids: list[str] = []

        if test_id is not None:
            order_test_ids.append(test_id)
            row = self.db.query(OrderTest.sampleId).filter(OrderTest.id == test_id).first()
            if row is not None and row.sampleId is not None:
                sample_ids.append(str(row.sampleId).strip())
            return list(dict.fromkeys(order_test_ids)), list(dict.fromkeys(sample_ids))

        if sample_id is not None:
            sample_ids.append(sample_id)
            linked = self.db.query(OrderTest.id).filter(OrderTest.sampleId == sample_id).all()
            order_test_ids.extend(int(row.id) for row in linked)

        return list(dict.fromkeys(order_test_ids)), list(dict.fromkeys(sample_ids))

    def _apply_scope(
        self,
        query,
        *,
        scope: str,
        order_id: str | None,
        patient_id: str | None,
        test_id: int | None,
        sample_id: str | None,
    ):
        """Restrict the query to one containment lens. Empty identity → no rows."""
        if scope == "order":
            if order_id is None:
                return query.filter(false())
            return query.filter(
                or_(
                    AuditEvent.orderId == order_id,
                    and_(AuditEvent.targetType == "order", AuditEvent.targetId == order_id),
                )
            )

        if scope == "lab":
            order_test_ids, sample_ids = self._lab_scope_ids(test_id=test_id, sample_id=sample_id)
            clauses = []
            if order_test_ids:
                order_test_id_strs = [str(order_test_id) for order_test_id in order_test_ids]
                clauses.append(
                    and_(
                        AuditEvent.targetType == "order_test",
                        AuditEvent.targetId.in_(order_test_id_strs),
                    )
                )
                clauses.append(AuditEvent.testId.in_(order_test_ids))
            if sample_ids:
                clauses.append(
                    and_(
                        AuditEvent.targetType == "sample",
                        AuditEvent.targetId.in_(sample_ids),
                    )
                )
            if not clauses:
                return query.filter(false())
            return query.filter(or_(*clauses))

        if scope == "patient":
            if patient_id is None:
                return query.filter(false())
            return query.filter(
                AuditEvent.eventType.like("patient.%"),
                or_(
                    AuditEvent.patientId == patient_id,
                    and_(
                        AuditEvent.targetType == "patient",
                        AuditEvent.targetId == patient_id,
                    ),
                ),
            )

        if scope == "system":
            return query.filter(AuditEvent.eventType.like("system.%"))

        # stream: time window + optional kinds applied by the caller
        return query

    def list_events(
        self,
        *,
        scope: str = "stream",
        order_id: str | None = None,
        patient_id: str | None = None,
        test_id: int | None = None,
        sample_id: str | None = None,
        since: datetime | None = None,
        until: datetime | None = None,
        kinds: list[str] | None = None,
        include_access: bool = False,
        event_scope: str | None = None,
        cursor_created_at: datetime | None = None,
        cursor_event_id: UUID | None = None,
        actor_id: str | None = None,
        actor_roles: list[str] | None = None,
        actor_search: str | None = None,
        search: str | None = None,
        limit: int = 500,
    ) -> list[AuditEventResponse]:
        """
        List events for a named scope.

        Scope expands containment (order / lab graph / patient / system / stream).
        Kinds optionally restrict eventType prefixes. Access events are omitted
        unless include_access is true. Newest-first cursor uses createdAt + eventId.
        Optional actor_id restricts rows to a single user.
        actor_roles filters actor_snapshot.role; actor_search matches snapshot name or user username.
        search matches entity ids, patient name, and actor name/username on stream scope.
        """
        limit = min(max(limit, 1), 2000)
        query = self.db.query(AuditEvent)
        query = self._apply_scope(
            query,
            scope=scope,
            order_id=order_id,
            patient_id=patient_id,
            test_id=test_id,
            sample_id=sample_id,
        )

        if since is not None:
            query = query.filter(AuditEvent.createdAt >= since)

        if until is not None:
            query = query.filter(AuditEvent.createdAt <= until)

        prefixes = kinds_to_prefixes(kinds or [])
        if prefixes:
            query = query.filter(
                or_(*[AuditEvent.eventType.like(f"{prefix}%") for prefix in prefixes])
            )

        if event_scope:
            query = query.filter(AuditEvent.eventScope == event_scope)

        if actor_id is not None:
            from app.domains.lab.workflow.constants import is_analyzer_user_id

            if is_analyzer_user_id(actor_id):
                query = query.filter(
                    or_(
                        AuditEvent.actorId == actor_id,
                        AuditEvent.actorSnapshot["user_id"].astext == actor_id,
                    )
                )
            else:
                query = query.filter(AuditEvent.actorId == actor_id)

        if actor_roles:
            query = query.filter(AuditEvent.actorSnapshot["role"].astext.in_(actor_roles))

        if actor_search:
            term = actor_search.strip()
            if term:
                pattern = f"%{term}%"
                name_match = AuditEvent.actorSnapshot["name"].astext.ilike(pattern)
                query = query.outerjoin(User, User.id == AuditEvent.actorId)
                query = query.filter(or_(name_match, User.username.ilike(pattern)))

        if search:
            query = apply_unified_search(query, search, scope=scope)

        hidden_access = access_event_types_to_hide(
            scope=scope,
            kinds=kinds,
            include_access=include_access,
        )
        if hidden_access:
            query = query.filter(AuditEvent.eventType.notin_(hidden_access))

        if cursor_created_at is not None and cursor_event_id is not None:
            query = query.filter(
                tuple_(AuditEvent.createdAt, AuditEvent.eventId)
                < (cursor_created_at, cursor_event_id)
            )

        rows = (
            query.order_by(AuditEvent.createdAt.desc(), AuditEvent.eventId.desc())
            .limit(limit)
            .all()
        )
        order_test_results = _load_order_test_results_map(self.db, rows)
        return [audit_event_to_response(row, order_test_results) for row in rows]

    def list_recent(self, hours: float, limit: int = 500) -> list[AuditEventResponse]:
        since = datetime.now(UTC) - timedelta(hours=hours)
        return self.list_events(scope="stream", since=since, limit=limit)

    def search_preview(self, q: str) -> AuditSearchPreviewResponse:
        """Preview unified stream search: intent, entity suggestions, and match count."""
        trimmed = q.strip()
        raw_intent = classify_search_term(trimmed)
        parsed_raw = raw_intent.get("parsedIds")
        parsed_ids = (
            AuditSearchParsedIds(**{k: v for k, v in parsed_raw.items() if v is not None})
            if parsed_raw
            else None
        )
        intent = AuditSearchIntent(
            mode=raw_intent["mode"],
            textTerm=raw_intent.get("textTerm"),
            dimensions=raw_intent.get("dimensions") or [],
            parsedIds=parsed_ids,
            displayToken=raw_intent.get("displayToken"),
        )

        patients: list[AuditSearchPreviewPatient] = []
        users: list[AuditSearchPreviewUser] = []
        if intent.mode in ("text", "numeric"):
            from app.domains.patients.service import _patient_search_filter

            patient_rows = (
                self.db.query(Patient)
                .filter(_patient_search_filter(trimmed))
                .order_by(Patient.updatedAt.desc())
                .limit(5)
                .all()
            )
            patients = [
                AuditSearchPreviewPatient(
                    id=row.id,
                    fullName=row.fullName,
                    displayId=row.id,
                )
                for row in patient_rows
            ]
            pattern = f"%{trimmed}%"
            user_rows = (
                self.db.query(User)
                .filter(
                    or_(
                        User.name.ilike(pattern),
                        User.username.ilike(pattern),
                    )
                )
                .limit(5)
                .all()
            )
            users = [
                AuditSearchPreviewUser(id=row.id, name=row.name, username=row.username)
                for row in user_rows
            ]

        count_query = self.db.query(AuditEvent)
        count_query = self._apply_scope(
            count_query,
            scope="stream",
            order_id=None,
            patient_id=None,
            test_id=None,
            sample_id=None,
        )
        count_query = apply_unified_search(count_query, trimmed, scope="stream")
        hidden_access = access_event_types_to_hide(
            scope="stream",
            kinds=None,
            include_access=False,
        )
        if hidden_access:
            count_query = count_query.filter(AuditEvent.eventType.notin_(hidden_access))
        event_count = count_query.with_entities(func.count(func.distinct(AuditEvent.id))).scalar()

        return AuditSearchPreviewResponse(
            intent=intent,
            patients=patients,
            users=users,
            eventCount=int(event_count or 0),
        )

    def list_filtered(
        self,
        *,
        scope: str = "stream",
        order_id: str | None = None,
        patient_id: str | None = None,
        test_id: int | None = None,
        sample_id: str | None = None,
        hours: float | None = None,
        created_from: datetime | None = None,
        created_to: datetime | None = None,
        kinds: list[str] | None = None,
        include_access: bool = False,
        event_scope: str | None = None,
        cursor_created_at: datetime | None = None,
        cursor_event_id: UUID | None = None,
        actor_id: str | None = None,
        actor_roles: list[str] | None = None,
        actor_search: str | None = None,
        search: str | None = None,
        limit: int = 500,
    ) -> list[AuditEventResponse]:
        since = created_from
        if hours is not None and since is None:
            since = datetime.now(UTC) - timedelta(hours=hours)
        return self.list_events(
            scope=scope,
            order_id=order_id,
            patient_id=patient_id,
            test_id=test_id,
            sample_id=sample_id,
            since=since,
            until=created_to,
            kinds=kinds,
            include_access=include_access,
            event_scope=event_scope,
            cursor_created_at=cursor_created_at,
            cursor_event_id=cursor_event_id,
            actor_id=actor_id,
            actor_roles=actor_roles,
            actor_search=actor_search,
            search=search,
            limit=limit,
        )

