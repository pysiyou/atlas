"""
Critical Value Notification Service

Handles critical value detection and notification workflow.
Ensures critical results are promptly communicated to ordering physicians.
"""
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from dataclasses import dataclass
from sqlalchemy.orm import Session

from app.models.order import Order, OrderTest
from app.services.flag_calculator import ResultFlag
from app.schemas.enums import ResultStatus


@dataclass
class CriticalNotification:
    """Represents a critical value notification"""
    order_test_id: int
    order_id: int
    test_code: str
    patient_id: int
    patient_name: str
    critical_values: List[Dict[str, Any]]
    notified_to: Optional[str]
    notified_at: Optional[datetime]
    acknowledged_at: Optional[datetime]
    notification_method: str = 'pending'


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

    def check_and_flag_critical(
        self,
        order_test: OrderTest,
        flags: List[ResultFlag]
    ) -> bool:
        """
        Check for critical values and update OrderTest fields.

        Args:
            order_test: The OrderTest to check
            flags: Calculated result flags

        Returns:
            True if critical values were found
        """
        critical_statuses = {ResultStatus.CRITICAL, ResultStatus.CRITICAL_HIGH, ResultStatus.CRITICAL_LOW}
        critical_flags = [f for f in flags if f.status in critical_statuses]

        has_critical = len(critical_flags) > 0

        # Update OrderTest
        order_test.hasCriticalValues = has_critical

        if has_critical:
            # Store critical value details in flags field
            order_test.flags = self._format_critical_flags(critical_flags)

        return has_critical

    def create_notification(
        self,
        order_test: OrderTest,
        order: Order,
        critical_flags: List[ResultFlag],
        notified_to: str,
        notification_method: str = 'system'
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
        now = datetime.now(timezone.utc)

        # Update OrderTest with notification info
        order_test.criticalNotificationSent = True
        order_test.criticalNotifiedAt = now
        order_test.criticalNotifiedTo = notified_to

        # Format critical values for notification
        critical_values = [
            {
                'item_code': f.item_code,
                'item_name': f.item_name,
                'value': f.value,
                'unit': f.unit,
                'status': f.status.value,
                'reference_range': f"{f.reference_low}-{f.reference_high}" if f.reference_low and f.reference_high else None
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
            notification_method=notification_method
        )

        return notification

    def acknowledge_notification(
        self,
        order_test: OrderTest,
        acknowledged_by: str
    ) -> bool:
        """
        Record acknowledgment of a critical value notification.

        Args:
            order_test: The OrderTest with the critical notification
            acknowledged_by: Name/identifier of who acknowledged

        Returns:
            True if acknowledgment was recorded
        """
        if not order_test.criticalNotificationSent:
            return False

        order_test.criticalAcknowledgedAt = datetime.now(timezone.utc)
        # Store acknowledgment info in the notification record
        # (criticalNotifiedTo already has the notification target)

        return True

    def get_unacknowledged_critical_values(self) -> List[OrderTest]:
        """
        Get all OrderTests with unacknowledged critical values.

        Returns:
            List of OrderTest objects with pending acknowledgments
        """
        return self.db.query(OrderTest).filter(
            OrderTest.hasCriticalValues == True,
            OrderTest.criticalNotificationSent == True,
            OrderTest.criticalAcknowledgedAt == None
        ).all()

    def get_critical_values_for_order(self, order_id: int) -> List[OrderTest]:
        """
        Get all OrderTests with critical values for an order.

        Args:
            order_id: The order ID to check

        Returns:
            List of OrderTest objects with critical values
        """
        return self.db.query(OrderTest).filter(
            OrderTest.orderId == order_id,
            OrderTest.hasCriticalValues == True
        ).all()

    def _format_critical_flags(self, flags: List[ResultFlag]) -> List[str]:
        """Format critical flags as string list for storage"""
        return [
            f"{f.item_code}:{f.status.value}:{f.value}"
            for f in flags
        ]

    def format_notification_message(
        self,
        notification: CriticalNotification,
        include_values: bool = True
    ) -> str:
        """
        Format a notification message for display or communication.

        Args:
            notification: The notification to format
            include_values: Whether to include specific values

        Returns:
            Formatted message string
        """
        lines = [
            f"CRITICAL VALUE ALERT",
            f"Patient: {notification.patient_name} (ID: {notification.patient_id})",
            f"Order: {notification.order_id}",
            f"Test: {notification.test_code}",
        ]

        if include_values:
            lines.append("Critical Values:")
            for cv in notification.critical_values:
                value_str = f"{cv['value']}"
                if cv.get('unit'):
                    value_str += f" {cv['unit']}"
                ref_str = f" (Ref: {cv['reference_range']})" if cv.get('reference_range') else ""
                lines.append(f"  - {cv['item_name']}: {value_str} [{cv['status'].upper()}]{ref_str}")

        lines.append(f"Notification sent to: {notification.notified_to}")
        lines.append(f"Notification time: {notification.notified_at.isoformat() if notification.notified_at else 'Pending'}")

        return "\n".join(lines)
