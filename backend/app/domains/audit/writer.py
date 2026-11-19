"""Persist audit events to the database."""
from __future__ import annotations

import logging
from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from app.domains.audit.kinds import stored_event_scope_for_type
from app.domains.audit.models import AuditEvent
from app.domains.audit.schemas import AuditEventCreate, EventChanges
from app.domains.users.models import User
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
    *,
    acting_user_id: str | None = None,
) -> tuple[str | None, dict[str, Any]]:
    """Return (actor_id, actor_snapshot) for DB insert. Snapshot uses snake_case keys in JSONB."""
    from app.domains.lab.workflow.constants import ANALYZER_USER_ID, is_analyzer_user_id

    if user is not None:
        snapshot: dict[str, Any] = {
            "user_id": user.id,
            "name": user.name,
            "role": user.role.value,
        }
        if ip_address:
            snapshot["ip_address"] = ip_address
        return user.id, snapshot

    if acting_user_id and is_analyzer_user_id(acting_user_id):
        snapshot = {
            "user_id": ANALYZER_USER_ID,
            "name": "Analyzer",
            "role": "analyzer",
        }
        if ip_address:
            snapshot["ip_address"] = ip_address
        return ANALYZER_USER_ID, snapshot

    snapshot = dict(_SYSTEM_SNAPSHOT)
    if ip_address:
        snapshot["ip_address"] = ip_address
    return None, snapshot


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
    *,
    acting_user_id: str | None = None,
) -> dict[str, Any]:
    actor_id, actor_snapshot = build_actor_snapshot(
        user, ip_address, acting_user_id=acting_user_id
    )
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
        *,
        acting_user_id: str | None = None,
    ) -> AuditEvent:
        validated = AuditEventCreate.model_validate(create)
        row = _build_row_dict(validated, user, ip_address, acting_user_id=acting_user_id)
        entry = AuditEvent(**row)
        self.db.add(entry)
        return entry

