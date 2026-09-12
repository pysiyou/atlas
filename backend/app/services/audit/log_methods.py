"""Audit log convenience methods — delegates to AuditService.log_operation."""
from typing import Any, Dict, Optional

from app.models.lab_audit import LabOperationLog
from app.schemas.enums import LabOperationType


class AuditLogMixin:
    def log_sample_collection(
        self,
        sample_id: int,
        user_id: int,
        before_state: Dict[str, Any],
        after_state: Dict[str, Any],
        metadata: Optional[Dict[str, Any]] = None,
        comment: Optional[str] = None
    ) -> LabOperationLog:
        """Log a sample collection operation"""
        return self.log_operation(
            operation_type=LabOperationType.SAMPLE_COLLECT,
            entity_type="sample",
            entity_id=sample_id,
            user_id=user_id,
            before_state=before_state,
            after_state=after_state,
            metadata=metadata,
            comment=comment
        )

    def log_sample_rejection(
        self,
        sample_id: int,
        user_id: int,
        before_state: Dict[str, Any],
        after_state: Dict[str, Any],
        rejection_reason: str,
        recollection_required: bool,
        metadata: Optional[Dict[str, Any]] = None,
        comment: Optional[str] = None
    ) -> LabOperationLog:
        """Log a sample rejection operation"""
        full_metadata = {
            "rejectionReason": rejection_reason,
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
            metadata=full_metadata,
            comment=comment or rejection_reason
        )

    def log_recollection_request(
        self,
        original_sample_id: int,
        new_sample_id: int,
        user_id: int,
        recollection_reason: str,
        recollection_attempt: int,
        metadata: Optional[Dict[str, Any]] = None,
        comment: Optional[str] = None
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
            metadata=full_metadata,
            comment=comment or recollection_reason
        )

    def log_result_entry(
        self,
        order_id: int,
        test_code: str,
        test_id: int,
        user_id: int,
        results: Dict[str, Any],
        metadata: Optional[Dict[str, Any]] = None,
        comment: Optional[str] = None
    ) -> LabOperationLog:
        """Log a result entry operation"""
        full_metadata = {
            "orderId": order_id,
            "testCode": test_code,
            "orderTestId": test_id,
            **(metadata or {})
        }
        return self.log_operation(
            operation_type=LabOperationType.RESULT_ENTRY,
            entity_type="order_test",
            entity_id=test_id,
            user_id=user_id,
            before_state={"status": "sample-collected"},
            after_state={"status": "completed", "results": results},
            metadata=full_metadata,
            comment=comment
        )

    def log_result_validation_approve(
        self,
        order_id: int,
        test_code: str,
        test_id: int,
        user_id: int,
        validation_notes: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        comment: Optional[str] = None
    ) -> LabOperationLog:
        """Log a result validation approval"""
        full_metadata = {
            "orderId": order_id,
            "testCode": test_code,
            "orderTestId": test_id,
            "validationNotes": validation_notes,
            **(metadata or {})
        }
        return self.log_operation(
            operation_type=LabOperationType.RESULT_VALIDATION_APPROVE,
            entity_type="order_test",
            entity_id=test_id,
            user_id=user_id,
            before_state={"status": "completed"},
            after_state={"status": "validated"},
            metadata=full_metadata,
            comment=comment or validation_notes
        )

    def log_quality_issue_reported(
        self,
        issue_id: int,
        order_id: int,
        user_id: int,
        stage: str,
        domain: str,
        remedy: str,
        reason: str,
        test_code: Optional[str] = None,
        sample_id: Optional[int] = None,
        order_test_id: Optional[int] = None,
        created_test_id: Optional[int] = None,
        created_sample_id: Optional[int] = None,
        comment: Optional[str] = None,
    ) -> LabOperationLog:
        """Log a unified quality issue report."""
        metadata: Dict[str, Any] = {
            "orderId": order_id,
            "testCode": test_code,
            "sampleId": sample_id,
            "reason": reason,
        }
        if order_test_id is not None:
            metadata["orderTestId"] = order_test_id
        if created_test_id is not None:
            metadata["newTestId"] = created_test_id
        if created_sample_id is not None:
            metadata["newSampleId"] = created_sample_id

        return self.log_operation(
            operation_type=LabOperationType.QUALITY_ISSUE_REPORTED,
            entity_type="quality_issue",
            entity_id=issue_id,
            user_id=user_id,
            before_state=None,
            after_state={"stage": stage, "domain": domain, "remedy": remedy},
            metadata=metadata,
            comment=comment or reason,
        )

    def log_escalation_resolution_authorize_retest(
        self,
        order_id: int,
        test_code: str,
        original_test_id: int,
        new_test_id: int,
        user_id: int,
        reason: str,
        metadata: Optional[Dict[str, Any]] = None,
        comment: Optional[str] = None
    ) -> LabOperationLog:
        """Log escalation resolution: authorize re-test (Path 2)."""
        full_metadata = {
            "orderId": order_id,
            "testCode": test_code,
            "escalatedTestId": original_test_id,
            "newTestId": new_test_id,
            "reason": reason,
            **(metadata or {})
        }
        return self.log_operation(
            operation_type=LabOperationType.ESCALATION_RESOLUTION_AUTHORIZE_RETEST,
            entity_type="order_test",
            entity_id=original_test_id,
            user_id=user_id,
            before_state={"status": "escalated"},
            after_state={"status": "superseded", "retestOrderTestId": new_test_id},
            metadata=full_metadata,
            comment=comment or reason
        )


    def log_escalation_trigger(
        self,
        operation_type: LabOperationType,
        order_id: int,
        test_code: str,
        test_id: int,
        ticket_id: int,
        user_id: int,
        reason_code: str,
        before_status: str,
        metadata: Optional[Dict[str, Any]] = None,
        comment: Optional[str] = None,
    ) -> LabOperationLog:
        """Log automatic escalation trigger (CRIT-VAL, REJ-SAMP, LIMIT-HIT, AMEND-RES)."""
        full_metadata = {
            "orderId": order_id,
            "testCode": test_code,
            "ticketId": ticket_id,
            "reasonCode": reason_code,
            **(metadata or {}),
        }
        return self.log_operation(
            operation_type=operation_type,
            entity_type="order_test",
            entity_id=test_id,
            user_id=user_id,
            before_state={"status": before_status},
            after_state={"status": "escalated", "ticketId": ticket_id},
            metadata=full_metadata,
            comment=comment or reason_code,
        )

    def log_escalation_resolution_force_validate(
        self,
        order_id: int,
        test_code: str,
        test_id: int,
        ticket_id: int,
        user_id: int,
        validation_notes: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> LabOperationLog:
        """Log escalation resolution: force validate."""
        full_metadata = {
            "orderId": order_id,
            "testCode": test_code,
            "ticketId": ticket_id,
            **(metadata or {}),
        }
        return self.log_operation(
            operation_type=LabOperationType.ESCALATION_RESOLUTION_FORCE_VALIDATE,
            entity_type="order_test",
            entity_id=test_id,
            user_id=user_id,
            before_state={"status": "escalated"},
            after_state={"status": "validated"},
            metadata=full_metadata,
            comment=validation_notes,
        )

    def log_escalation_resolution_authorize_recollect(
        self,
        order_id: int,
        test_code: str,
        original_test_id: int,
        new_test_id: int,
        new_sample_id: int,
        ticket_id: int,
        user_id: int,
        reason: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> LabOperationLog:
        """Log escalation resolution: authorize re-collect."""
        full_metadata = {
            "orderId": order_id,
            "testCode": test_code,
            "escalatedTestId": original_test_id,
            "newTestId": new_test_id,
            "newSampleId": new_sample_id,
            "ticketId": ticket_id,
            "reason": reason,
            **(metadata or {}),
        }
        return self.log_operation(
            operation_type=LabOperationType.ESCALATION_RESOLUTION_AUTHORIZE_RECOLLECT,
            entity_type="order_test",
            entity_id=original_test_id,
            user_id=user_id,
            before_state={"status": "escalated"},
            after_state={"status": "superseded", "newTestId": new_test_id, "newSampleId": new_sample_id},
            metadata=full_metadata,
            comment=reason,
        )

    def log_escalation_resolution_cancel_test(
        self,
        order_id: int,
        test_code: str,
        test_id: int,
        sample_id: int,
        user_id: int,
        reason: str,
        metadata: Optional[Dict[str, Any]] = None,
        comment: Optional[str] = None,
    ) -> LabOperationLog:
        """Log escalation resolution: cancel test (terminal)."""
        full_metadata = {
            "orderId": order_id,
            "testCode": test_code,
            "sampleId": sample_id,
            "reason": reason,
            **(metadata or {}),
        }
        return self.log_operation(
            operation_type=LabOperationType.ESCALATION_RESOLUTION_CANCEL_TEST,
            entity_type="order_test",
            entity_id=test_id,
            user_id=user_id,
            before_state={"status": "escalated", "sampleId": sample_id},
            after_state={"status": "cancelled"},
            metadata=full_metadata,
            comment=comment or reason,
        )

    def log_escalation_resolution_apply_amendment(
        self,
        order_id: int,
        test_code: str,
        test_id: int,
        ticket_id: int,
        user_id: int,
        validation_notes: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> LabOperationLog:
        """Log escalation resolution: apply proposed amendment results."""
        full_metadata = {
            "orderId": order_id,
            "testCode": test_code,
            "ticketId": ticket_id,
            **(metadata or {}),
        }
        return self.log_operation(
            operation_type=LabOperationType.ESCALATION_RESOLUTION_APPLY_AMENDMENT,
            entity_type="order_test",
            entity_id=test_id,
            user_id=user_id,
            before_state={"status": "escalated"},
            after_state={"status": "validated"},
            metadata=full_metadata,
            comment=validation_notes,
        )

    def log_order_status_change(
        self,
        order_id: int,
        old_status: str,
        new_status: str,
        user_id: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> LabOperationLog:
        return self.log_operation(
            operation_type=LabOperationType.ORDER_STATUS_CHANGE,
            entity_type="order",
            entity_id=order_id,
            user_id=user_id or 0,
            before_state={"status": old_status},
            after_state={"status": new_status},
            metadata={"trigger": "automatic", **(metadata or {})},
        )

    def log_test_removed(
        self,
        order_id: int,
        test_id: int,
        test_code: str,
        user_id: int,
        old_status: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> LabOperationLog:
        return self.log_operation(
            operation_type=LabOperationType.TEST_REMOVED,
            entity_type="order_test",
            entity_id=test_id,
            user_id=user_id,
            before_state={"status": old_status},
            after_state={"status": "removed"},
            metadata={"orderId": order_id, "testCode": test_code, **(metadata or {})},
        )

    def log_order_payment_recorded(
        self,
        order_id: int,
        payment_id: int,
        user_id: int,
        amount: float,
        payment_method: str,
        payment_status: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> LabOperationLog:
        return self.log_operation(
            operation_type=LabOperationType.ORDER_PAYMENT_RECORDED,
            entity_type="order",
            entity_id=order_id,
            user_id=user_id,
            before_state=None,
            after_state={"paymentStatus": payment_status},
            metadata={
                "orderId": order_id,
                "paymentId": payment_id,
                "amount": amount,
                "paymentMethod": payment_method,
                "paymentStatus": payment_status,
                **(metadata or {}),
            },
        )

    def log_test_added(
        self,
        order_id: int,
        test_id: int,
        test_code: str,
        user_id: int,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> LabOperationLog:
        return self.log_operation(
            operation_type=LabOperationType.TEST_ADDED,
            entity_type="order_test",
            entity_id=test_id,
            user_id=user_id,
            before_state=None,
            after_state={"status": "pending"},
            metadata={"orderId": order_id, "testCode": test_code, **(metadata or {})},
        )

    def log_critical_value_detected(
        self,
        order_id: int,
        test_id: int,
        test_code: str,
        user_id: int,
        critical_values: list,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> LabOperationLog:
        return self.log_operation(
            operation_type=LabOperationType.CRITICAL_VALUE_DETECTED,
            entity_type="order_test",
            entity_id=test_id,
            user_id=user_id,
            before_state={"hasCriticalValues": False},
            after_state={"hasCriticalValues": True},
            metadata={
                "orderId": order_id,
                "testCode": test_code,
                "criticalValues": critical_values,
                **(metadata or {}),
            },
        )

    def log_critical_value_notified(
        self,
        order_id: int,
        test_id: int,
        test_code: str,
        user_id: int,
        notified_to: str,
        notification_method: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> LabOperationLog:
        return self.log_operation(
            operation_type=LabOperationType.CRITICAL_VALUE_NOTIFIED,
            entity_type="order_test",
            entity_id=test_id,
            user_id=user_id,
            before_state={"criticalNotificationSent": False},
            after_state={"criticalNotificationSent": True, "criticalNotifiedTo": notified_to},
            metadata={
                "orderId": order_id,
                "testCode": test_code,
                "notifiedTo": notified_to,
                "notificationMethod": notification_method,
                **(metadata or {}),
            },
        )

    def log_critical_value_acknowledged(
        self,
        order_id: int,
        test_id: int,
        test_code: str,
        acknowledged_by: str,
        user_id: int,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> LabOperationLog:
        return self.log_operation(
            operation_type=LabOperationType.CRITICAL_VALUE_ACKNOWLEDGED,
            entity_type="order_test",
            entity_id=test_id,
            user_id=user_id,
            before_state={"criticalAcknowledgedAt": None},
            after_state={"criticalAcknowledged": True},
            metadata={
                "orderId": order_id,
                "testCode": test_code,
                "acknowledgedBy": acknowledged_by,
                **(metadata or {}),
            },
        )

