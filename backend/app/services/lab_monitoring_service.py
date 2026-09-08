"""
Lab Monitoring Service - Aggregated metrics and timeline for command center.
"""
from datetime import datetime, timedelta, timezone
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.lab_audit import LabOperationLog
from app.models.user import User


class LabMonitoringService:
    """
    Service for command center monitoring data.
    Provides aggregated timeline and metrics without hitting primary tables.
    """

    def __init__(self, db: Session):
        self.db = db

    def get_timeline_events(
        self,
        hours_back: int = 24,
        limit: int = 100,
        offset: int = 0
    ) -> List[dict]:
        """
        Get simplified timeline events for command center.
        
        Returns recent lab operations with minimal formatting.
        Frontend handles all display logic.
        """
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours_back)
        
        # Query audit logs
        logs = (
            self.db.query(LabOperationLog)
            .filter(LabOperationLog.performedAt >= cutoff)
            .order_by(LabOperationLog.performedAt.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )
        
        # Collect unique user IDs that are numeric
        user_ids = set()
        for log in logs:
            if log.performedBy and log.performedBy.isdigit():
                user_ids.add(int(log.performedBy))
        
        # Batch fetch user names
        user_map = {}
        if user_ids:
            users = self.db.query(User.id, User.name).filter(User.id.in_(user_ids)).all()
            user_map = {str(u.id): u.name for u in users}
        
        # Build events with resolved names
        events = []
        for log in logs:
            performed_by_name = None
            if log.performedBy == "system":
                performed_by_name = "System"
            elif log.performedBy in user_map:
                performed_by_name = user_map[log.performedBy]
            
            event = {
                "id": log.id,
                "type": log.operationType,
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
            events.append(event)
        
        return events

    def get_timeline_count(
        self,
        hours_back: int = 24
    ) -> int:
        """Get total count of timeline events in window."""
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours_back)
        
        return self.db.query(func.count(LabOperationLog.id))\
            .filter(LabOperationLog.performedAt >= cutoff)\
            .scalar() or 0
