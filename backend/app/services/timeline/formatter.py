"""Shared audit log → timeline event formatting."""
from __future__ import annotations

from typing import Optional

from sqlalchemy.orm import Session

from app.models.lab_audit import LabOperationLog
from app.models.user import User
from app.services.timeline.taxonomy import get_event_phase, get_event_tone


class TimelineFormatter:
    def __init__(self, db: Session):
        self.db = db

    def build_user_map(self, logs: list[LabOperationLog]) -> dict[str, str]:
        user_ids = {
            int(log.performedBy)
            for log in logs
            if log.performedBy and log.performedBy.isdigit()
        }
        if not user_ids:
            return {}
        users = self.db.query(User.id, User.name).filter(User.id.in_(user_ids)).all()
        return {str(user.id): user.name for user in users}

    @staticmethod
    def performer_name(log: LabOperationLog, user_map: dict[str, str]) -> Optional[str]:
        if log.performedBy == "system":
            return "System"
        return user_map.get(log.performedBy)

    def format_command_center_event(self, log: LabOperationLog, user_map: dict[str, str]) -> dict:
        op_type = log.operationType.value if log.operationType else None
        return {
            "id": log.id,
            "type": op_type,
            "entityType": log.entityType,
            "entityId": log.entityId,
            "timestamp": log.performedAt.isoformat(),
            "performedBy": log.performedBy,
            "performedByName": self.performer_name(log, user_map),
            "metadata": log.operationData or {},
            "beforeState": log.beforeState,
            "afterState": log.afterState,
            "comment": log.comment,
        }

    def format_entity_event(self, log: LabOperationLog, user_map: dict[str, str]) -> dict:
        op_type = log.operationType.value if log.operationType else None
        metadata = log.operationData or {}
        quality_stage = metadata.get("stage") or (log.afterState or {}).get("stage")
        return {
            "id": log.id,
            "type": op_type,
            "phase": get_event_phase(op_type, quality_stage=quality_stage),
            "tone": get_event_tone(op_type),
            "entityType": log.entityType,
            "entityId": log.entityId,
            "timestamp": log.performedAt.isoformat(),
            "performedBy": log.performedBy,
            "performedByName": self.performer_name(log, user_map),
            "metadata": metadata,
            "beforeState": log.beforeState,
            "afterState": log.afterState,
            "comment": log.comment,
        }
