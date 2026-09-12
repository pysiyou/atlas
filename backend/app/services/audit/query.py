"""Audit log query operations."""
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from app.models.lab_audit import LabOperationLog
from app.schemas.audit import LabOperationLogResponse
from app.schemas.enums import LabOperationType
from app.services.timeline.formatter import TimelineFormatter


class AuditQueryService:
    def __init__(self, db: Session):
        self.db = db
        self._formatter = TimelineFormatter(db)

    def list_logs(
        self,
        limit: int = 10000,
        offset: int = 0,
        operation_type: Optional[LabOperationType] = None,
        entity_type: Optional[str] = None,
        hours_back: int = 24,
    ) -> list[LabOperationLogResponse]:
        query = self.db.query(LabOperationLog)
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours_back)
        query = query.filter(LabOperationLog.performedAt >= cutoff)
        if operation_type:
            query = query.filter(LabOperationLog.operationType == operation_type)
        if entity_type:
            query = query.filter(LabOperationLog.entityType == entity_type)
        logs = query.order_by(desc(LabOperationLog.performedAt)).offset(offset).limit(limit).all()
        user_map = self._formatter.build_user_map(logs)
        return [
            LabOperationLogResponse(
                id=log.id,
                operationType=log.operationType.value if log.operationType else None,
                entityType=log.entityType,
                entityId=log.entityId,
                performedBy=log.performedBy,
                performedByName=user_map.get(log.performedBy),
                performedAt=log.performedAt,
                beforeState=log.beforeState,
                afterState=log.afterState,
                operationData=log.operationData,
                comment=log.comment,
            )
            for log in logs
        ]

    def count_logs(
        self,
        operation_type: Optional[LabOperationType] = None,
        entity_type: Optional[str] = None,
        hours_back: int = 24,
    ) -> int:
        query = self.db.query(func.count(LabOperationLog.id)).filter(
            LabOperationLog.performedAt >= (datetime.now(timezone.utc) - timedelta(hours=hours_back))
        )
        if operation_type:
            query = query.filter(LabOperationLog.operationType == operation_type)
        if entity_type:
            query = query.filter(LabOperationLog.entityType == entity_type)
        return query.scalar() or 0
