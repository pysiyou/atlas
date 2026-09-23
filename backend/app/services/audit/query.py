"""Audit log query operations."""
from datetime import UTC, datetime, timedelta

from app.models.lab_audit import LabOperationLog
from app.schemas.audit import LabOperationLogResponse
from app.schemas.enums import LabOperationType
from app.services.audit.user_names import build_performer_name_map
from sqlalchemy import desc, func
from sqlalchemy.orm import Session


class AuditQueryService:
    def __init__(self, db: Session):
        self.db = db

    def list_logs(
        self,
        limit: int = 10000,
        offset: int = 0,
        operation_type: LabOperationType | None = None,
        entity_type: str | None = None,
        hours_back: int = 24,
    ) -> list[LabOperationLogResponse]:
        query = self.db.query(LabOperationLog)
        cutoff = datetime.now(UTC) - timedelta(hours=hours_back)
        query = query.filter(LabOperationLog.performedAt >= cutoff)
        if operation_type:
            query = query.filter(LabOperationLog.operationType == operation_type)
        if entity_type:
            query = query.filter(LabOperationLog.entityType == entity_type)
        logs = query.order_by(desc(LabOperationLog.performedAt)).offset(offset).limit(limit).all()
        user_map = build_performer_name_map(self.db, logs)
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
        operation_type: LabOperationType | None = None,
        entity_type: str | None = None,
        hours_back: int = 24,
    ) -> int:
        query = self.db.query(func.count(LabOperationLog.id)).filter(
            LabOperationLog.performedAt >= (datetime.now(UTC) - timedelta(hours=hours_back))
        )
        if operation_type:
            query = query.filter(LabOperationLog.operationType == operation_type)
        if entity_type:
            query = query.filter(LabOperationLog.entityType == entity_type)
        return query.scalar() or 0
