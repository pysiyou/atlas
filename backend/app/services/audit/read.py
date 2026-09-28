"""Read-only queries for audit_events."""
from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

from app.models.audit_event import AuditEvent
from app.models.order import OrderTest
from app.schemas.audit import AuditEventResponse
from sqlalchemy import and_, or_
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
    metadata: dict[str, Any] | None = (
        dict(row.eventMetadata) if row.eventMetadata else None
    )
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
        changes=_changes_for_api(row.changes),
        metadata=metadata,
    )


class AuditEventQueryService:
    def __init__(self, db: Session):
        self.db = db

    def list_events(
        self,
        *,
        order_id: int | None = None,
        patient_id: int | None = None,
        target_type: str | None = None,
        target_id: int | None = None,
        since: datetime | None = None,
        limit: int = 500,
    ) -> list[AuditEventResponse]:
        limit = min(max(limit, 1), 2000)
        query = self.db.query(AuditEvent)

        if order_id is not None:
            query = query.filter(
                or_(
                    AuditEvent.orderId == order_id,
                    and_(AuditEvent.targetType == "order", AuditEvent.targetId == order_id),
                )
            )

        if patient_id is not None:
            query = query.filter(
                or_(
                    AuditEvent.patientId == patient_id,
                    and_(AuditEvent.targetType == "patient", AuditEvent.targetId == patient_id),
                )
            )

        if target_type is not None and target_id is not None:
            if target_type == "order_test":
                query = query.filter(
                    or_(
                        and_(
                            AuditEvent.targetType == "order_test",
                            AuditEvent.targetId == target_id,
                        ),
                        AuditEvent.testId == target_id,
                    )
                )
            else:
                query = query.filter(
                    AuditEvent.targetType == target_type,
                    AuditEvent.targetId == target_id,
                )

        if since is not None:
            query = query.filter(AuditEvent.createdAt >= since)

        rows = query.order_by(AuditEvent.createdAt.desc()).limit(limit).all()
        order_test_results = _load_order_test_results_map(self.db, rows)
        return [
            audit_event_to_response(row, order_test_results) for row in rows
        ]

    def list_recent(self, hours: float, limit: int = 500) -> list[AuditEventResponse]:
        since = datetime.now(UTC) - timedelta(hours=hours)
        return self.list_events(since=since, limit=limit)
