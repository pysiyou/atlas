"""
Audit Service for Laboratory Operations

Records all significant lab operations for compliance and traceability.
Provides a complete audit trail for regulatory requirements.
"""
from datetime import datetime, timezone
from typing import Dict, Any, Optional

from sqlalchemy.orm import Session
from app.models.lab_audit import LabOperationLog
from app.schemas.enums import LabOperationType


from app.services.audit.log_methods import AuditLogMixin


class AuditService(AuditLogMixin):
    """
    Service for logging laboratory operations.

    All significant operations (sample collection, rejection, result entry,
    validation, etc.) should be logged through this service.
    """

    def __init__(self, db: Session):
        self.db = db

    def log_operation(
        self,
        operation_type: LabOperationType,
        entity_type: str,
        entity_id: int,
        user_id: int,
        before_state: Optional[Dict[str, Any]] = None,
        after_state: Optional[Dict[str, Any]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        comment: Optional[str] = None
    ) -> LabOperationLog:
        """
        Log a laboratory operation.

        Args:
            operation_type: The type of operation being performed
            entity_type: The type of entity ('sample', 'test', 'order')
            entity_id: The ID of the entity being operated on
            user_id: The ID of the user performing the operation
            before_state: State of the entity before the operation (optional)
            after_state: State of the entity after the operation (optional)
            metadata: Additional context-specific data (optional)
            comment: Optional free-text note for this operation (e.g. rejection reason)

        Returns:
            The created LabOperationLog record
        """
        log_entry = LabOperationLog(
            operationType=operation_type,
            entityType=entity_type,
            entityId=entity_id,
            performedBy=str(user_id),
            performedAt=datetime.now(timezone.utc),
            beforeState=before_state,
            afterState=after_state,
            operationData=metadata,
            comment=comment
        )

        self.db.add(log_entry)
        return log_entry

    def get_entity_history(
        self,
        entity_type: str,
        entity_id: int
    ) -> list[LabOperationLog]:
        """
        Get the operation history for an entity.

        Args:
            entity_type: The type of entity ('sample', 'test', 'order')
            entity_id: The ID of the entity

        Returns:
            List of operation logs for the entity, ordered by timestamp
        """
        return self.db.query(LabOperationLog).filter(
            LabOperationLog.entityType == entity_type,
            LabOperationLog.entityId == entity_id
        ).order_by(LabOperationLog.performedAt.desc()).all()

    def get_user_operations(
        self,
        user_id: int,
        operation_types: Optional[list[LabOperationType]] = None,
        limit: int = 10000
    ) -> list[LabOperationLog]:
        """
        Get operations performed by a user.

        Args:
            user_id: The ID of the user
            operation_types: Optional filter for operation types
            limit: Maximum number of records to return

        Returns:
            List of operation logs, ordered by timestamp
        """
        query = self.db.query(LabOperationLog).filter(
            LabOperationLog.performedBy == user_id
        )

        if operation_types:
            query = query.filter(LabOperationLog.operationType.in_(operation_types))

        return query.order_by(LabOperationLog.performedAt.desc()).limit(limit).all()
