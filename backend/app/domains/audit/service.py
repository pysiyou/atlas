"""
Audit event log — persist rows, query for the API, and emit domain events.

Dot-notation types match ``EventType`` in ``domains.audit.schemas``. Rows store target
(entity type + id), optional context (orderId, patientId, testId), metadata
(e.g. ``test_code`` vs ``test_codes``), and actor snapshot (user or system).
"""
from __future__ import annotations

import logging
from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID, uuid4

from app.domains.audit.kinds import (
    ACCESS_EVENT_TYPES,
    kinds_to_prefixes,
    stored_event_scope_for_type,
)
from app.domains.audit.models import AuditEvent
from app.domains.audit.schemas import (
    AuditEventCreate,
    AuditEventResponse,
    EventChanges,
    EventContext,
    EventTarget,
    EventType,
)
from app.domains.orders.models import Order, OrderTest
from app.domains.users.models import User
from sqlalchemy import and_, false, or_, tuple_
from sqlalchemy.orm import Session

# ── Persist ──────────────────────────────────────────────────────────────

logger = logging.getLogger(__name__)

_SYSTEM_SNAPSHOT: dict[str, Any] = {
    "user_id": "system",
    "name": "Atlas Backend",
    "role": "system",
}


def build_actor_snapshot(
    user: User | None,
    ip_address: str | None = None,
) -> tuple[int | None, dict[str, Any]]:
    """Return (actor_id, actor_snapshot) for DB insert. Snapshot uses snake_case keys in JSONB."""
    if user is None:
        snapshot = dict(_SYSTEM_SNAPSHOT)
        if ip_address:
            snapshot["ip_address"] = ip_address
        return None, snapshot

    snapshot: dict[str, Any] = {
        "user_id": user.id,
        "name": user.name,
        "role": user.role.value,
    }
    if ip_address:
        snapshot["ip_address"] = ip_address
    return user.id, snapshot


def _changes_to_jsonb(changes: EventChanges | None) -> dict[str, Any] | None:
    if changes is None:
        return None
    if not changes.oldValues and not changes.newValues:
        return None
    return {
        "old_values": changes.oldValues,
        "new_values": changes.newValues,
    }


def _build_row_dict(
    create: AuditEventCreate,
    user: User | None,
    ip_address: str | None,
) -> dict[str, Any]:
    actor_id, actor_snapshot = build_actor_snapshot(user, ip_address)
    event_id = uuid4()
    created_at = datetime.now(UTC)
    context = create.context

    return {
        "eventId": event_id,
        "eventType": create.eventType.value,
        "createdAt": created_at,
        "actorId": actor_id,
        "actorSnapshot": actor_snapshot,
        "targetType": create.target.entityType,
        "targetId": create.target.entityId,
        "patientId": context.patientId if context else None,
        "orderId": context.orderId if context else None,
        "testId": context.testId if context else None,
        "eventScope": stored_event_scope_for_type(create.eventType.value),
        "changes": _changes_to_jsonb(create.changes),
        "eventMetadata": create.metadata,
    }


class AuditWriter:
    """Writes audit events in the current database session."""

    def __init__(self, db: Session):
        self.db = db

    def log_event_sync(
        self,
        create: AuditEventCreate,
        user: User | None,
        ip_address: str | None = None,
    ) -> AuditEvent:
        validated = AuditEventCreate.model_validate(create)
        row = _build_row_dict(validated, user, ip_address)
        entry = AuditEvent(**row)
        self.db.add(entry)
        return entry


# ── Query ───────────────────────────────────────────────────────────────

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
        user_id: int | str = "system"
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
        order_test_ids.append(row.targetId)

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
        enriched = order_test_results.get(row.targetId)
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
        sample_id: int | None,
    ) -> tuple[list[int], list[int]]:
        """
        Expand a lab lens into order_test ids and sample ids.

        From a test: that order_test plus its sample (sibling tests stay out).
        From a sample: that sample plus every order_test on it.
        """
        order_test_ids: list[int] = []
        sample_ids: list[int] = []

        if test_id is not None:
            order_test_ids.append(test_id)
            row = (
                self.db.query(OrderTest.sampleId).filter(OrderTest.id == test_id).first()
            )
            if row is not None and row.sampleId is not None:
                sample_ids.append(int(row.sampleId))
            return list(dict.fromkeys(order_test_ids)), list(dict.fromkeys(sample_ids))

        if sample_id is not None:
            sample_ids.append(sample_id)
            linked = (
                self.db.query(OrderTest.id).filter(OrderTest.sampleId == sample_id).all()
            )
            order_test_ids.extend(int(row.id) for row in linked)

        return list(dict.fromkeys(order_test_ids)), list(dict.fromkeys(sample_ids))

    def _apply_scope(
        self,
        query,
        *,
        scope: str,
        order_id: int | None,
        patient_id: int | None,
        test_id: int | None,
        sample_id: int | None,
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
            order_test_ids, sample_ids = self._lab_scope_ids(
                test_id=test_id, sample_id=sample_id
            )
            clauses = []
            if order_test_ids:
                clauses.append(
                    and_(
                        AuditEvent.targetType == "order_test",
                        AuditEvent.targetId.in_(order_test_ids),
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
        order_id: int | None = None,
        patient_id: int | None = None,
        test_id: int | None = None,
        sample_id: int | None = None,
        since: datetime | None = None,
        until: datetime | None = None,
        kinds: list[str] | None = None,
        include_access: bool = False,
        event_scope: str | None = None,
        cursor_created_at: datetime | None = None,
        cursor_event_id: UUID | None = None,
        actor_id: int | None = None,
        actor_roles: list[str] | None = None,
        actor_search: str | None = None,
        limit: int = 500,
    ) -> list[AuditEventResponse]:
        """
        List events for a named scope.

        Scope expands containment (order / lab graph / patient / system / stream).
        Kinds optionally restrict eventType prefixes. Access events are omitted
        unless include_access is true. Newest-first cursor uses createdAt + eventId.
        Optional actor_id restricts rows to a single user.
        actor_roles filters actor_snapshot.role; actor_search matches snapshot name or user username.
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
            query = query.filter(AuditEvent.actorId == actor_id)

        if actor_roles:
            query = query.filter(AuditEvent.actorSnapshot["role"].astext.in_(actor_roles))

        if actor_search:
            term = actor_search.strip()
            if term:
                pattern = f"%{term}%"
                name_match = AuditEvent.actorSnapshot["name"].astext.ilike(pattern)
                query = query.outerjoin(User, User.id == AuditEvent.actorId)
                query = query.filter(
                    or_(name_match, User.username.ilike(pattern))
                )

        if not include_access and scope in ("stream", "patient"):
            query = query.filter(AuditEvent.eventType.notin_(ACCESS_EVENT_TYPES))

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

    def list_filtered(
        self,
        *,
        scope: str = "stream",
        order_id: int | None = None,
        patient_id: int | None = None,
        test_id: int | None = None,
        sample_id: int | None = None,
        hours: float | None = None,
        created_from: datetime | None = None,
        created_to: datetime | None = None,
        kinds: list[str] | None = None,
        include_access: bool = False,
        event_scope: str | None = None,
        cursor_created_at: datetime | None = None,
        cursor_event_id: UUID | None = None,
        actor_id: int | None = None,
        actor_roles: list[str] | None = None,
        actor_search: str | None = None,
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
            limit=limit,
        )


# ── Domain emissions ────────────────────────────────────────────────────


class AuditEmitter:
    """Central helper for writing audit events from service-layer code."""

    def __init__(self, db: Session):
        self.db = db
        self._writer = AuditWriter(db)

    def _actor(self, user_id: int | None) -> User | None:
        if user_id is None or user_id <= 0:
            return None
        return self.db.query(User).filter(User.id == user_id).first()

    def _order_context(self, order_id: int, test_id: int | None = None) -> EventContext:
        order = self.db.query(Order).filter(Order.orderId == order_id).first()
        return EventContext(
            orderId=order_id,
            patientId=order.patientId if order else None,
            testId=test_id,
        )

    def emit(self, create: AuditEventCreate, user_id: int | None) -> None:
        self._writer.log_event_sync(create, self._actor(user_id))

    def _emit(
        self,
        event_type: EventType,
        target_type: str,
        target_id: int,
        user_id: int | None,
        *,
        context: EventContext | None = None,
        changes: EventChanges | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        self.emit(
            AuditEventCreate(
                eventType=event_type,
                target=EventTarget(entityType=target_type, entityId=target_id),
                context=context,
                changes=changes,
                metadata=metadata,
            ),
            user_id,
        )

    # ── Patient ──────────────────────────────────────────────────────────

    def patient_created(self, patient_id: int, user_id: int) -> None:
        self._emit(
            EventType.PATIENT_CREATE,
            "patient",
            patient_id,
            user_id,
            context=EventContext(patientId=patient_id),
        )

    def patient_updated(
        self, patient_id: int, user_id: int, changes: dict[str, Any] | None = None
    ) -> None:
        self._emit(
            EventType.PATIENT_UPDATE,
            "patient",
            patient_id,
            user_id,
            context=EventContext(patientId=patient_id),
            changes=EventChanges(newValues=changes or {}) if changes else None,
        )

    def patient_deleted(self, patient_id: int, user_id: int) -> None:
        self._emit(
            EventType.PATIENT_DELETE,
            "patient",
            patient_id,
            user_id,
            context=EventContext(patientId=patient_id),
        )

    def patient_viewed(self, patient_id: int, user_id: int) -> None:
        self._emit(
            EventType.PATIENT_VIEW,
            "patient",
            patient_id,
            user_id,
            context=EventContext(patientId=patient_id),
        )

    # ── Order ────────────────────────────────────────────────────────────

    def order_created(self, order_id: int, patient_id: int, user_id: int) -> None:
        self._emit(
            EventType.ORDER_CREATE,
            "order",
            order_id,
            user_id,
            context=EventContext(orderId=order_id, patientId=patient_id),
        )

    def order_updated(
        self, order_id: int, user_id: int, metadata: dict[str, Any] | None = None
    ) -> None:
        self._emit(
            EventType.ORDER_UPDATE,
            "order",
            order_id,
            user_id,
            context=self._order_context(order_id),
            metadata=metadata,
        )

    def order_deleted(self, order_id: int, user_id: int) -> None:
        self._emit(
            EventType.ORDER_DELETE,
            "order",
            order_id,
            user_id,
            context=self._order_context(order_id),
        )

    def order_status_changed(
        self,
        order_id: int,
        old_status: str | None,
        new_status: str,
        user_id: int | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        meta = {"trigger": metadata.get("trigger", "automatic") if metadata else "automatic"}
        if metadata:
            meta.update(metadata)
        self._emit(
            EventType.ORDER_STATUS,
            "order",
            order_id,
            user_id,
            context=self._order_context(order_id),
            changes=EventChanges(
                oldValues={"status": old_status},
                newValues={"status": new_status},
            ),
            metadata=meta,
        )

    def order_test_added(
        self, order_id: int, order_test_id: int, test_code: str, user_id: int
    ) -> None:
        self._emit(
            EventType.ORDER_TEST_ADD,
            "order_test",
            order_test_id,
            user_id,
            context=self._order_context(order_id, test_id=order_test_id),
            metadata={"test_code": test_code},
        )

    def order_test_removed(
        self,
        order_id: int,
        order_test_id: int,
        test_code: str,
        user_id: int,
        old_status: str,
    ) -> None:
        self._emit(
            EventType.ORDER_TEST_REMOVE,
            "order_test",
            order_test_id,
            user_id,
            context=self._order_context(order_id, test_id=order_test_id),
            changes=EventChanges(oldValues={"status": old_status}, newValues={"status": "removed"}),
            metadata={"test_code": test_code},
        )

    def order_test_cancelled(
        self,
        order_id: int,
        order_test_id: int,
        test_code: str,
        user_id: int,
        reason: str | None = None,
    ) -> None:
        self._emit(
            EventType.ORDER_TEST_CANCEL,
            "order_test",
            order_test_id,
            user_id,
            context=self._order_context(order_id, test_id=order_test_id),
            changes=EventChanges(newValues={"status": "cancelled"}),
            metadata={"test_code": test_code, "reason": reason},
        )

    def order_test_retest(
        self,
        order_id: int,
        original_test_id: int,
        new_test_id: int,
        test_code: str,
        user_id: int,
        reason: str | None = None,
    ) -> None:
        self._emit(
            EventType.ORDER_TEST_RETEST,
            "order_test",
            new_test_id,
            user_id,
            context=self._order_context(order_id, test_id=new_test_id),
            metadata={
                "test_code": test_code,
                "superseded_test_id": original_test_id,
                "reason": reason,
            },
        )

    def order_test_reflex(
        self,
        order_id: int,
        new_test_id: int,
        added_test_code: str,
        triggered_by_test_code: str,
        user_id: int | None,
    ) -> None:
        self._emit(
            EventType.ORDER_TEST_REFLEX,
            "order_test",
            new_test_id,
            user_id,
            context=self._order_context(order_id, test_id=new_test_id),
            metadata={
                "added_test_code": added_test_code,
                "triggered_by": triggered_by_test_code,
            },
        )

    # ── Laboratory — sample ──────────────────────────────────────────────

    def sample_created(
        self,
        sample_id: int,
        order_id: int,
        user_id: int | None,
        *,
        test_codes: list[str] | None = None,
    ) -> None:
        metadata: dict[str, Any] | None = None
        if test_codes:
            metadata = {"test_codes": list(test_codes)}
        self._emit(
            EventType.LABORATORY_SAMPLE_CREATE,
            "sample",
            sample_id,
            user_id,
            context=self._order_context(order_id),
            metadata=metadata,
        )

    def sample_collected(
        self,
        sample_id: int,
        order_id: int,
        user_id: int,
        before: dict[str, Any],
        after: dict[str, Any],
        metadata: dict[str, Any] | None = None,
    ) -> None:
        self._emit(
            EventType.LABORATORY_SAMPLE_COLLECT,
            "sample",
            sample_id,
            user_id,
            context=self._order_context(order_id),
            changes=EventChanges(oldValues=before, newValues=after),
            metadata=metadata,
        )

    def sample_rejected(
        self,
        sample_id: int,
        order_id: int,
        user_id: int,
        reason: str,
        metadata: dict[str, Any] | None = None,
        old_status: str | None = None,
    ) -> None:
        self._emit(
            EventType.LABORATORY_SAMPLE_REJECT,
            "sample",
            sample_id,
            user_id,
            context=self._order_context(order_id),
            changes=EventChanges(
                oldValues={"status": old_status or "collected"},
                newValues={"status": "rejected"},
            ),
            metadata={"rejection_reason": reason, **(metadata or {})},
        )

    def sample_recollect_requested(
        self,
        sample_id: int,
        order_id: int,
        user_id: int,
        metadata: dict[str, Any],
    ) -> None:
        self._emit(
            EventType.LABORATORY_SAMPLE_RECOLLECT_REQUEST,
            "sample",
            sample_id,
            user_id,
            context=self._order_context(order_id),
            metadata=metadata,
        )

    def sample_recollect_approved(
        self,
        sample_id: int,
        order_id: int,
        user_id: int,
        metadata: dict[str, Any],
    ) -> None:
        self._emit(
            EventType.LABORATORY_SAMPLE_RECOLLECT_APPROVE,
            "sample",
            sample_id,
            user_id,
            context=self._order_context(order_id),
            metadata=metadata,
        )

    def sample_recollect_denied(
        self,
        sample_id: int,
        order_id: int,
        user_id: int,
        metadata: dict[str, Any],
    ) -> None:
        self._emit(
            EventType.LABORATORY_SAMPLE_RECOLLECT_DENY,
            "sample",
            sample_id,
            user_id,
            context=self._order_context(order_id),
            metadata=metadata,
        )

    # ── Laboratory — analyzer / result / validation ──────────────────────

    def analyzer_duplicate_ingest(
        self,
        order_id: int,
        order_test_id: int,
        test_code: str,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        self._emit(
            EventType.LABORATORY_ANALYZER_DUPLICATE_INGEST,
            "order_test",
            order_test_id,
            None,
            context=self._order_context(order_id, test_id=order_test_id),
            metadata={"test_code": test_code, **(metadata or {})},
        )

    def analyzer_ingest_rejected(
        self,
        order_id: int | None,
        order_test_id: int | None,
        test_code: str | None,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        if order_id is None and order_test_id is None:
            logger.warning(
                "Skipping analyzer_ingest_rejected persist: no order_id or order_test_id"
            )
            return
        target_id = order_test_id if order_test_id is not None else order_id
        if target_id is None:
            return
        target_type = "order_test" if order_test_id is not None else "order"
        # Unmatched analyzer rejects have no orderId — they only appear on stream feeds.
        ctx = EventContext(orderId=order_id, testId=order_test_id) if order_id else None
        self._emit(
            EventType.LABORATORY_ANALYZER_INGEST_REJECTED,
            target_type,
            target_id,
            None,
            context=ctx,
            metadata={
                **({"test_code": test_code} if test_code else {}),
                **(metadata or {}),
            },
        )

    def result_entered(
        self,
        order_id: int,
        order_test_id: int,
        test_code: str,
        user_id: int,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        self._emit(
            EventType.LABORATORY_RESULT_ENTER,
            "order_test",
            order_test_id,
            user_id,
            context=self._order_context(order_id, test_id=order_test_id),
            changes=EventChanges(
                oldValues={"status": "sample-collected"},
                newValues={"status": "resulted"},
            ),
            metadata={"test_code": test_code, **(metadata or {})},
        )

    def result_updated(
        self,
        order_id: int,
        order_test_id: int,
        test_code: str,
        user_id: int,
        old_results: dict[str, Any] | list[Any] | None,
        new_results: dict[str, Any] | list[Any] | None,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        self._emit(
            EventType.LABORATORY_RESULT_UPDATE,
            "order_test",
            order_test_id,
            user_id,
            context=self._order_context(order_id, test_id=order_test_id),
            changes=EventChanges(
                oldValues={"results": old_results or {}},
                newValues={"results": new_results or {}},
            ),
            metadata={"test_code": test_code, **(metadata or {})},
        )

    def result_critical_detected(
        self,
        order_id: int,
        order_test_id: int,
        test_code: str,
        user_id: int,
        metadata: dict[str, Any],
    ) -> None:
        self._emit(
            EventType.LABORATORY_RESULT_CRITICAL_DETECT,
            "order_test",
            order_test_id,
            user_id,
            context=self._order_context(order_id, test_id=order_test_id),
            metadata={"test_code": test_code, **metadata},
        )

    def result_critical_notified(
        self,
        order_id: int,
        order_test_id: int,
        test_code: str,
        user_id: int,
        metadata: dict[str, Any],
    ) -> None:
        self._emit(
            EventType.LABORATORY_RESULT_CRITICAL_NOTIFY,
            "order_test",
            order_test_id,
            user_id,
            context=self._order_context(order_id, test_id=order_test_id),
            metadata={"test_code": test_code, **metadata},
        )

    def result_critical_acknowledged(
        self,
        order_id: int,
        order_test_id: int,
        test_code: str,
        user_id: int,
        metadata: dict[str, Any],
    ) -> None:
        self._emit(
            EventType.LABORATORY_RESULT_CRITICAL_ACKNOWLEDGE,
            "order_test",
            order_test_id,
            user_id,
            context=self._order_context(order_id, test_id=order_test_id),
            metadata={"test_code": test_code, **metadata},
        )

    def validation_approved(
        self,
        order_id: int,
        order_test_id: int,
        test_code: str,
        user_id: int,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        self._emit(
            EventType.LABORATORY_VALIDATION_APPROVE,
            "order_test",
            order_test_id,
            user_id,
            context=self._order_context(order_id, test_id=order_test_id),
            changes=EventChanges(
                oldValues={"status": "resulted"},
                newValues={"status": "validated"},
            ),
            metadata={"test_code": test_code, **(metadata or {})},
        )

    def validation_rejected(
        self,
        order_id: int,
        order_test_id: int | None,
        sample_id: int | None,
        user_id: int,
        metadata: dict[str, Any],
    ) -> None:
        target_type = "order_test" if order_test_id else "sample"
        target_id = order_test_id if order_test_id else (sample_id or 0)
        # Always attach orderId so sample-targeted rejects still appear on order scope.
        self._emit(
            EventType.LABORATORY_VALIDATION_REJECT,
            target_type,
            target_id,
            user_id,
            context=self._order_context(order_id, test_id=order_test_id if order_test_id else None),
            metadata=metadata,
        )

    def escalation_triggered(
        self,
        order_id: int,
        order_test_id: int,
        test_code: str,
        user_id: int,
        metadata: dict[str, Any],
    ) -> None:
        self._emit(
            EventType.LABORATORY_ESCALATION_TRIGGER,
            "order_test",
            order_test_id,
            user_id,
            context=self._order_context(order_id, test_id=order_test_id),
            changes=EventChanges(newValues={"status": "escalated"}),
            metadata={"test_code": test_code, **metadata},
        )

    def escalation_resolved(
        self,
        order_id: int,
        order_test_id: int,
        test_code: str,
        user_id: int,
        metadata: dict[str, Any],
    ) -> None:
        self._emit(
            EventType.LABORATORY_ESCALATION_RESOLVE,
            "order_test",
            order_test_id,
            user_id,
            context=self._order_context(order_id, test_id=order_test_id),
            metadata={"test_code": test_code, **metadata},
        )

    # ── Billing ──────────────────────────────────────────────────────────

    def payment_processed(
        self,
        order_id: int,
        payment_id: int,
        user_id: int,
        metadata: dict[str, Any],
    ) -> None:
        self._emit(
            EventType.BILLING_PAYMENT_PROCESS,
            "payment",
            payment_id,
            user_id,
            context=self._order_context(order_id),
            metadata=metadata,
        )

    def invoice_generated(self, order_id: int, invoice_id: int, user_id: int | None) -> None:
        self._emit(
            EventType.BILLING_INVOICE_GENERATE,
            "invoice",
            invoice_id,
            user_id,
            context=self._order_context(order_id),
        )

    def invoice_voided(
        self,
        order_id: int,
        invoice_id: int,
        user_id: int,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        self._emit(
            EventType.BILLING_INVOICE_VOID,
            "invoice",
            invoice_id,
            user_id,
            context=self._order_context(order_id),
            metadata=metadata,
        )

    def insurance_submitted(
        self,
        order_id: int,
        claim_id: int,
        user_id: int,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        self._emit(
            EventType.BILLING_INSURANCE_SUBMIT,
            "insurance_claim",
            claim_id,
            user_id,
            context=self._order_context(order_id),
            metadata=metadata,
        )

    # ── Reporting / system ───────────────────────────────────────────────

    def reporting_generated(self, order_id: int, user_id: int) -> None:
        self._emit(
            EventType.REPORTING_GENERATE,
            "order",
            order_id,
            user_id,
            context=self._order_context(order_id),
        )

    def reporting_downloaded(
        self,
        order_id: int,
        order_test_id: int,
        user_id: int,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        self._emit(
            EventType.REPORTING_DOWNLOAD,
            "order_test",
            order_test_id,
            user_id,
            context=self._order_context(order_id, test_id=order_test_id),
            metadata=metadata,
        )

    def user_login(self, user_id: int) -> None:
        self._emit(EventType.SYSTEM_USER_LOGIN, "user", user_id, user_id)

    def user_logout(self, user_id: int) -> None:
        self._emit(EventType.SYSTEM_USER_LOGOUT, "user", user_id, user_id)

    def user_created(self, new_user_id: int, actor_user_id: int) -> None:
        self._emit(EventType.SYSTEM_USER_CREATE, "user", new_user_id, actor_user_id)

    def user_updated(self, target_user_id: int, actor_user_id: int) -> None:
        self._emit(EventType.SYSTEM_USER_UPDATE, "user", target_user_id, actor_user_id)

    def catalog_test_created(self, test_id: int, test_code: str, actor_user_id: int) -> None:
        self._emit(
            EventType.SYSTEM_CATALOG_CREATE,
            "test_catalog",
            test_id,
            actor_user_id,
            metadata={"test_code": test_code},
        )

    def catalog_test_updated(self, test_id: int, test_code: str, actor_user_id: int) -> None:
        self._emit(
            EventType.SYSTEM_CATALOG_UPDATE,
            "test_catalog",
            test_id,
            actor_user_id,
            metadata={"test_code": test_code},
        )


__all__ = [
    "AuditEmitter",
    "AuditEventQueryService",
    "AuditWriter",
    "audit_event_to_response",
    "build_actor_snapshot",
]
