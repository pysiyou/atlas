"""
Lab Monitoring Service - Aggregated metrics and timeline for command center.
"""
from datetime import datetime, timedelta, timezone
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.lab_audit import LabOperationLog
from app.models.order import Order, OrderTest
from app.models.test import Test
from app.models.user import User
from app.models.escalation import EscalationTicket
from app.models.quality_issue import QualityIssue
from app.models.recollection_request import RecollectionRequest
from app.schemas.enums import TestStatus, EscalationTicketStatus, RecollectionRequestStatus


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

    def get_category_summary(self, days: int = 90) -> dict:
        """Aggregate order tests by catalog category within a date window."""
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)

        rows = (
            self.db.query(Test.category, func.count(OrderTest.id))
            .join(Test, OrderTest.testCode == Test.code)
            .join(Order, OrderTest.orderId == Order.orderId)
            .filter(Order.createdAt >= cutoff)
            .filter(OrderTest.status != TestStatus.SUPERSEDED)
            .group_by(Test.category)
            .order_by(func.count(OrderTest.id).desc())
            .all()
        )

        total = sum(count for _, count in rows)
        categories = []
        for category, count in rows:
            percentage = round((count / total) * 100) if total else 0
            categories.append({
                "category": category,
                "count": count,
                "percentage": percentage,
            })

        return {"total": total, "categories": categories}

    def get_operations_overview(self, hours_back: int = 24) -> dict:
        """
        Aggregate lab operations metrics for command center overview.
        Shows test flow, escalations, quality issues, and requests.
        """
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours_back)

        # Test status distribution
        test_statuses = (
            self.db.query(OrderTest.status, func.count(OrderTest.id))
            .join(Order, OrderTest.orderId == Order.orderId)
            .filter(Order.createdAt >= cutoff)
            .filter(OrderTest.status != TestStatus.SUPERSEDED)
            .group_by(OrderTest.status)
            .all()
        )
        status_map = {str(status.value): count for status, count in test_statuses}

        # Escalation tickets
        open_escalations = (
            self.db.query(func.count(EscalationTicket.id))
            .filter(EscalationTicket.status == EscalationTicketStatus.OPEN)
            .filter(EscalationTicket.createdAt >= cutoff)
            .scalar() or 0
        )
        resolved_escalations = (
            self.db.query(func.count(EscalationTicket.id))
            .filter(EscalationTicket.status == EscalationTicketStatus.RESOLVED)
            .filter(EscalationTicket.resolvedAt >= cutoff)
            .scalar() or 0
        )

        # Quality issues
        quality_issues = (
            self.db.query(func.count(QualityIssue.id))
            .filter(QualityIssue.createdAt >= cutoff)
            .scalar() or 0
        )

        # Recollection requests
        pending_recollections = (
            self.db.query(func.count(RecollectionRequest.id))
            .filter(RecollectionRequest.status == RecollectionRequestStatus.PENDING_APPROVAL)
            .scalar() or 0
        )
        approved_recollections = (
            self.db.query(func.count(RecollectionRequest.id))
            .filter(RecollectionRequest.status == RecollectionRequestStatus.APPROVED)
            .filter(RecollectionRequest.reviewedAt >= cutoff)
            .scalar() or 0
        )
        denied_recollections = (
            self.db.query(func.count(RecollectionRequest.id))
            .filter(RecollectionRequest.status == RecollectionRequestStatus.DENIED)
            .filter(RecollectionRequest.reviewedAt >= cutoff)
            .scalar() or 0
        )

        return {
            "testFlow": status_map,
            "escalations": {
                "open": open_escalations,
                "resolved": resolved_escalations,
            },
            "qualityIssues": quality_issues,
            "recollectionRequests": {
                "pending": pending_recollections,
                "approved": approved_recollections,
                "denied": denied_recollections,
            },
        }
