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


class AuditService:
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
        metadata: Optional[Dict[str, Any]] = None
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
            operationData=metadata
        )

        self.db.add(log_entry)
        return log_entry

    def log_sample_collection(
        self,
        sample_id: int,
        user_id: int,
        before_state: Dict[str, Any],
        after_state: Dict[str, Any],
        metadata: Optional[Dict[str, Any]] = None
    ) -> LabOperationLog:
        """Log a sample collection operation"""
        return self.log_operation(
            operation_type=LabOperationType.SAMPLE_COLLECT,
            entity_type="sample",
            entity_id=sample_id,
            user_id=user_id,
            before_state=before_state,
            after_state=after_state,
            metadata=metadata
        )

    def log_sample_rejection(
        self,
        sample_id: int,
        user_id: int,
        before_state: Dict[str, Any],
        after_state: Dict[str, Any],
        rejection_reasons: list[str],
        recollection_required: bool,
        metadata: Optional[Dict[str, Any]] = None
    ) -> LabOperationLog:
        """Log a sample rejection operation"""
        full_metadata = {
            "rejectionReasons": rejection_reasons,
            "recollectionRequired": recollection_required,
            **(metadata or {})
        }
        return self.log_operation(
            operation_type=LabOperationType.SAMPLE_REJECT,
            entity_type="sample",
            entity_id=sample_id,
            user_id=user_id,
            before_state=before_state,
            after_state=after_state,
            metadata=full_metadata
        )

    def log_recollection_request(
        self,
        original_sample_id: int,
        new_sample_id: int,
        user_id: int,
        recollection_reason: str,
        recollection_attempt: int,
        metadata: Optional[Dict[str, Any]] = None
    ) -> LabOperationLog:
        """Log a recollection request operation"""
        full_metadata = {
            "originalSampleId": original_sample_id,
            "newSampleId": new_sample_id,
            "recollectionReason": recollection_reason,
            "recollectionAttempt": recollection_attempt,
            **(metadata or {})
        }
        return self.log_operation(
            operation_type=LabOperationType.SAMPLE_RECOLLECTION_REQUEST,
            entity_type="sample",
            entity_id=new_sample_id,
            user_id=user_id,
            before_state={"status": "rejected", "sampleId": original_sample_id},
            after_state={"status": "pending", "sampleId": new_sample_id},
            metadata=full_metadata
        )

    def log_result_entry(
        self,
        order_id: int,
        test_code: str,
        test_id: int,
        user_id: int,
        results: Dict[str, Any],
        metadata: Optional[Dict[str, Any]] = None
    ) -> LabOperationLog:
        """Log a result entry operation"""
        full_metadata = {
            "orderId": order_id,
            "testCode": test_code,
            **(metadata or {})
        }
        return self.log_operation(
            operation_type=LabOperationType.RESULT_ENTRY,
            entity_type="test",
            entity_id=test_id,
            user_id=user_id,
            before_state={"status": "sample-collected"},
            after_state={"status": "completed", "results": results},
            metadata=full_metadata
        )

    def log_result_validation_approve(
        self,
        order_id: int,
        test_code: str,
        test_id: int,
        user_id: int,
        validation_notes: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> LabOperationLog:
        """Log a result validation approval"""
        full_metadata = {
            "orderId": order_id,
            "testCode": test_code,
            "validationNotes": validation_notes,
            **(metadata or {})
        }
        return self.log_operation(
            operation_type=LabOperationType.RESULT_VALIDATION_APPROVE,
            entity_type="test",
            entity_id=test_id,
            user_id=user_id,
            before_state={"status": "completed"},
            after_state={"status": "validated"},
            metadata=full_metadata
        )

    def log_result_validation_reject_retest(
        self,
        order_id: int,
        test_code: str,
        original_test_id: int,
        new_test_id: int,
        user_id: int,
        rejection_reason: str,
        retest_number: int,
        metadata: Optional[Dict[str, Any]] = None
    ) -> LabOperationLog:
        """Log a result rejection with retest action"""
        full_metadata = {
            "orderId": order_id,
            "testCode": test_code,
            "originalTestId": original_test_id,
            "newTestId": new_test_id,
            "rejectionReason": rejection_reason,
            "retestNumber": retest_number,
            "sampleReused": True,
            **(metadata or {})
        }
        return self.log_operation(
            operation_type=LabOperationType.RESULT_VALIDATION_REJECT_RETEST,
            entity_type="test",
            entity_id=original_test_id,
            user_id=user_id,
            before_state={"status": "completed", "testId": original_test_id},
            after_state={"status": "superseded", "retestOrderTestId": new_test_id},
            metadata=full_metadata
        )

    def log_result_validation_reject_recollect(
        self,
        order_id: int,
        test_code: str,
        test_id: int,
        sample_id: int,
        new_sample_id: int,
        user_id: int,
        rejection_reason: str,
        recollection_attempt: int,
        metadata: Optional[Dict[str, Any]] = None
    ) -> LabOperationLog:
        """Log a result rejection with recollection action"""
        full_metadata = {
            "orderId": order_id,
            "testCode": test_code,
            "originalSampleId": sample_id,
            "newSampleId": new_sample_id,
            "rejectionReason": rejection_reason,
            "recollectionAttempt": recollection_attempt,
            **(metadata or {})
        }
        return self.log_operation(
            operation_type=LabOperationType.RESULT_VALIDATION_REJECT_RECOLLECT,
            entity_type="test",
            entity_id=test_id,
            user_id=user_id,
            before_state={"status": "completed", "sampleId": sample_id},
            after_state={"status": "pending", "sampleId": new_sample_id},
            metadata=full_metadata
        )

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
        limit: int = 100
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
