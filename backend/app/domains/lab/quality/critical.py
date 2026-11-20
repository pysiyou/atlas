"""
Critical Value Notification Service

Handles critical value detection and notification workflow.
Ensures critical results are promptly communicated to ordering physicians.
"""
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

from app.domains.audit.emitter import AuditEmitter
from app.domains.lab.quality.schemas import (
    AcknowledgeRequest,
    CriticalValueResponse,
    NotifyRequest,
)
from app.domains.lab.results.flags import ResultFlag
from app.domains.lab.results.numeric import parse_numeric_result_value
from app.domains.lab.specimen.models import Sample
from app.domains.orders.models import Order, OrderTest
from app.shared.errors import LabOperationError
from app.shared.generated.enums import ResultStatus
from sqlalchemy.orm import Session


@dataclass
class CriticalNotification:
    """Represents a critical value notification"""

    order_test_id: int
    order_id: str
    test_code: str
    patient_id: str
    patient_name: str
    critical_values: list[dict[str, Any]]
    notified_to: str | None
    notified_at: datetime | None
    acknowledged_at: datetime | None
    notification_method: str = "pending"


class CriticalNotificationService:
    """
    Service for managing critical value notifications.

    Responsibilities:
    - Detect critical values from calculated flags
    - Create notification records
    - Track notification status
    - Handle acknowledgment workflow
    """

    def __init__(self, db: Session):
        self.db = db
        self.emitter = AuditEmitter(db)

    def create_notification(
        self,
        order_test: OrderTest,
        order: Order,
        critical_flags: list[ResultFlag],
        notified_to: str,
        notification_method: str = "system",
    ) -> CriticalNotification:
        """
        Create and record a critical value notification.

        Args:
            order_test: The OrderTest with critical values
            order: The parent Order
            critical_flags: List of critical flags
            notified_to: Name/identifier of who was notified
            notification_method: How notification was sent (phone, fax, EMR, etc.)

        Returns:
            CriticalNotification object
        """
        now = datetime.now(UTC)

        # Update OrderTest with notification info
        order_test.criticalNotificationSent = True
        order_test.criticalNotifiedAt = now
        order_test.criticalNotifiedTo = notified_to

        # Format critical values for notification
        critical_values = [
            {
                "analyte_code": f.analyte_code,
                "analyte_name": f.analyte_name,
                "value": f.value,
                "unit": f.unit,
                "status": f.status.value,
                "reference_range": f"{f.reference_low}-{f.reference_high}"
                if f.reference_low and f.reference_high
                else None,
            }
            for f in critical_flags
        ]

        notification = CriticalNotification(
            order_test_id=order_test.id,
            order_id=order.orderId,
            test_code=order_test.testCode,
            patient_id=order.patientId,
            patient_name=order.patientName,
            critical_values=critical_values,
            notified_to=notified_to,
            notified_at=now,
            acknowledged_at=None,
            notification_method=notification_method,
        )

        return notification

    def acknowledge_notification(self, order_test: OrderTest, _acknowledged_by: str) -> bool:
        """
        Record acknowledgment of a critical value notification.

        Args:
            order_test: The OrderTest with the critical notification
        Returns:
            True if acknowledgment was recorded
        """
        if not order_test.criticalNotificationSent:
            return False

        order_test.criticalAcknowledgedAt = datetime.now(UTC)
        # Store acknowledgment info in the notification record
        # (criticalNotifiedTo already has the notification target)

        return True

    def get_unacknowledged_critical_values(self) -> list[OrderTest]:
        """
        Get all OrderTests with unacknowledged critical values.

        Returns:
            List of OrderTest objects with pending acknowledgments
        """
        return (
            self.db.query(OrderTest)
            .filter(
                OrderTest.hasCriticalValues.is_(True),
                OrderTest.criticalNotificationSent.is_(True),
                OrderTest.criticalAcknowledgedAt.is_(None),
            )
            .all()
        )

    def _to_response(self, test: OrderTest, order: Order) -> CriticalValueResponse:
        sample = None
        if test.sampleId:
            sample = self.db.query(Sample).filter(Sample.sampleId == test.sampleId).first()
        return CriticalValueResponse(
            id=test.id,
            orderId=test.orderId,
            testCode=test.testCode,
            testName=test.testName,
            patientId=order.patientId,
            patientName=order.patientName,
            sampleId=sample.sampleId if sample else None,
            flags=test.flags,
            criticalNotificationSent=test.criticalNotificationSent,
            criticalNotifiedAt=test.criticalNotifiedAt,
            criticalNotifiedTo=test.criticalNotifiedTo,
            criticalAcknowledgedAt=test.criticalAcknowledgedAt,
            resultEnteredAt=test.resultEnteredAt,
            status=test.status.value if test.status else "unknown",
        )

    def list_pending(self) -> list[CriticalValueResponse]:
        tests = self.get_unacknowledged_critical_values()
        results = []
        for test in tests:
            order = self.db.query(Order).filter(Order.orderId == test.orderId).first()
            if not order:
                continue
            results.append(self._to_response(test, order))
        return results

    _CRITICAL_STATUS_WIRES = frozenset(
        {
            ResultStatus.CRITICAL.value,
            ResultStatus.CRITICAL_HIGH.value,
            ResultStatus.CRITICAL_LOW.value,
        }
    )

    @staticmethod
    def _parse_critical_flags(test: OrderTest) -> list[ResultFlag]:
        """Parse stored ``analyte:status`` flags; ignore DELTA and non-critical rows."""
        critical_flags: list[ResultFlag] = []
        if not test.flags:
            return critical_flags
        stored_results = test.results or {}
        for flag_str in test.flags:
            if not flag_str or flag_str.startswith("DELTA:"):
                continue
            if ":" not in flag_str:
                continue
            analyte_code, status_wire = flag_str.split(":", 1)
            if status_wire not in CriticalNotificationService._CRITICAL_STATUS_WIRES:
                continue
            try:
                flag_status = ResultStatus(status_wire)
            except ValueError:
                flag_status = ResultStatus.CRITICAL
            raw = stored_results.get(analyte_code)
            numeric = parse_numeric_result_value(raw) if raw is not None else None
            unit = raw.get("unit") if isinstance(raw, dict) else None
            critical_flags.append(
                ResultFlag(
                    analyte_code=analyte_code,
                    analyte_name=analyte_code,
                    value=numeric if numeric is not None else 0.0,
                    status=flag_status,
                    reference_low=None,
                    reference_high=None,
                    critical_low=None,
                    critical_high=None,
                    unit=unit,
                )
            )
        return critical_flags

    def notify(self, test_id: int, request: NotifyRequest, user_id: str) -> dict:
        test = self.db.query(OrderTest).filter(OrderTest.id == test_id).with_for_update().first()
        if not test:
            raise LabOperationError("Test not found", status_code=404)
        if not test.hasCriticalValues:
            raise LabOperationError("Test does not have critical values", status_code=400)
        order = self.db.query(Order).filter(Order.orderId == test.orderId).first()
        if not order:
            raise LabOperationError("Order not found", status_code=404)
        notification = self.create_notification(
            order_test=test,
            order=order,
            critical_flags=self._parse_critical_flags(test),
            notified_to=request.notifiedTo,
            notification_method=request.notificationMethod,
        )
        self.emitter.result_critical_notified(
            test.orderId,
            test.id,
            test.testCode,
            user_id,
            metadata={
                "notified_to": request.notifiedTo,
                "notification_method": request.notificationMethod,
            },
        )
        return {
            "success": True,
            "message": f"Notification recorded for {request.notifiedTo}",
            "notifiedAt": notification.notified_at.isoformat()
            if notification.notified_at
            else None,
        }

    def acknowledge(self, test_id: int, request: AcknowledgeRequest, user_id: str) -> dict:
        test = self.db.query(OrderTest).filter(OrderTest.id == test_id).with_for_update().first()
        if not test:
            raise LabOperationError("Test not found", status_code=404)
        if not test.hasCriticalValues:
            raise LabOperationError("Test does not have critical values", status_code=400)
        if not test.criticalNotificationSent:
            raise LabOperationError("Notification has not been sent yet", status_code=400)
        if test.criticalAcknowledgedAt:
            raise LabOperationError("Critical value already acknowledged", status_code=400)
        self.acknowledge_notification(test, request.acknowledgedBy)
        self.emitter.result_critical_acknowledged(
            test.orderId,
            test.id,
            test.testCode,
            user_id,
            metadata={"acknowledged_by": request.acknowledgedBy},
        )
        return {
            "success": True,
            "message": f"Critical value acknowledged by {request.acknowledgedBy}",
            "acknowledgedAt": (
                test.criticalAcknowledgedAt.isoformat() if test.criticalAcknowledgedAt else None
            ),
        }
