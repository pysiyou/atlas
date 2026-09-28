"""Persist audit events (sync or background)."""
from __future__ import annotations

import logging
from datetime import UTC, datetime
from typing import Any
from uuid import UUID, uuid4

from app.db.database import SessionLocal
from app.models.audit_event import AuditEvent
from app.models.user import User
from app.schemas.audit import AuditEventCreate, EventChanges
from fastapi import BackgroundTasks
from sqlalchemy.orm import Session

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
        "changes": _changes_to_jsonb(create.changes),
        "eventMetadata": create.metadata,
    }


def _persist_audit_event(row: dict[str, Any]) -> None:
    """Insert one audit row in a dedicated session (for BackgroundTasks)."""
    db = SessionLocal()
    try:
        entry = AuditEvent(**row)
        db.add(entry)
        db.commit()
    except Exception:
        logger.exception("Failed to persist audit event %s", row.get("eventId"))
        db.rollback()
    finally:
        db.close()


class AuditWriter:
    """Writes audit events; use background_tasks for fire-and-forget HTTP paths."""

    def __init__(self, db: Session):
        self.db = db

    def log_event(
        self,
        create: AuditEventCreate,
        user: User | None,
        background_tasks: BackgroundTasks | None = None,
        ip_address: str | None = None,
    ) -> UUID:
        validated = AuditEventCreate.model_validate(create)
        row = _build_row_dict(validated, user, ip_address)
        event_id: UUID = row["eventId"]

        if background_tasks is not None:
            background_tasks.add_task(_persist_audit_event, row)
            return event_id

        entry = AuditEvent(**row)
        self.db.add(entry)
        return event_id

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


# Back-compat alias for opt-in example router
EventLogger = AuditWriter
