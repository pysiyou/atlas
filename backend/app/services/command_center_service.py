"""
Command Center Service — activity timeline for the lab command center.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import List

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.lab_audit import LabOperationLog
from app.models.user import User


class CommandCenterService:
    """Global lab activity timeline."""

    def __init__(self, db: Session):
        self.db = db

    def get_timeline_events(
        self,
        hours_back: int = 24,
        limit: int = 100,
        offset: int = 0,
    ) -> List[dict]:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours_back)

        logs = (
            self.db.query(LabOperationLog)
            .filter(LabOperationLog.performedAt >= cutoff)
            .order_by(LabOperationLog.performedAt.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

        user_ids = {
            int(log.performedBy)
            for log in logs
            if log.performedBy and log.performedBy.isdigit()
        }
        user_map: dict[str, str] = {}
        if user_ids:
            users = self.db.query(User.id, User.name).filter(User.id.in_(user_ids)).all()
            user_map = {str(user.id): user.name for user in users}

        events = []
        for log in logs:
            performed_by_name = None
            if log.performedBy == "system":
                performed_by_name = "System"
            elif log.performedBy in user_map:
                performed_by_name = user_map[log.performedBy]

            op_type = log.operationType.value if log.operationType else None
            events.append(
                {
                    "id": log.id,
                    "type": op_type,
                    "entityType": log.entityType,
                    "entityId": log.entityId,
                    "timestamp": log.performedAt.isoformat(),
                    "performedBy": log.performedBy,
                    "performedByName": performed_by_name,
                    "metadata": log.operationData or {},
                    "beforeState": log.beforeState,
                    "afterState": log.afterState,
                    "comment": log.comment,
                }
            )

        return events

    def get_timeline_count(self, hours_back: int = 24) -> int:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours_back)
        return (
            self.db.query(func.count(LabOperationLog.id))
            .filter(LabOperationLog.performedAt >= cutoff)
            .scalar()
            or 0
        )
