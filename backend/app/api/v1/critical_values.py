"""
Critical Values API Routes

Endpoints for managing critical value notifications and acknowledgments.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.database import get_db
from app.core.dependencies import get_current_user, require_validator
from app.models.user import User
from app.models.order import Order, OrderTest
from app.schemas.enums import TestStatus
from app.services.critical_notification_service import CriticalNotificationService
from app.services.audit_service import AuditService

router = APIRouter()


class CriticalValueResponse(BaseModel):
    """Response for a single critical value"""
    id: int
    orderId: int
    testCode: str
    testName: Optional[str]
    patientId: int
    patientName: str
    flags: Optional[List[str]]
    criticalNotificationSent: bool
    criticalNotifiedAt: Optional[datetime]
    criticalNotifiedTo: Optional[str]
    criticalAcknowledgedAt: Optional[datetime]
    resultEnteredAt: Optional[datetime]
    status: str

    class Config:
        from_attributes = True


class NotifyRequest(BaseModel):
    """Request to record critical value notification"""
    notifiedTo: str
    notificationMethod: str = "phone"  # phone, fax, emr, etc.
    notes: Optional[str] = None


class AcknowledgeRequest(BaseModel):
    """Request to acknowledge a critical value"""
    acknowledgedBy: str
    notes: Optional[str] = None


class BulkNotifyRequest(BaseModel):
    """Request to notify multiple critical values"""
    testIds: List[int]
    notifiedTo: str
    notificationMethod: str = "phone"


@router.get("/critical-values/pending")
def get_pending_critical_values(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_validator)
) -> List[CriticalValueResponse]:
    """
    Get all tests with critical values that have not been acknowledged.
    """
    service = CriticalNotificationService(db)
    tests = service.get_unacknowledged_critical_values()

    results = []
    for test in tests:
        order = db.query(Order).filter(Order.orderId == test.orderId).first()
        results.append(CriticalValueResponse(
            id=test.id,
            orderId=test.orderId,
            testCode=test.testCode,
            testName=test.testName,
            patientId=order.patientId if order else 0,
            patientName=order.patientName if order else "Unknown",
            flags=test.flags,
            criticalNotificationSent=test.criticalNotificationSent,
            criticalNotifiedAt=test.criticalNotifiedAt,
            criticalNotifiedTo=test.criticalNotifiedTo,
            criticalAcknowledgedAt=test.criticalAcknowledgedAt,
            resultEnteredAt=test.resultEnteredAt,
            status=test.status.value if test.status else "unknown"
        ))

    return results


@router.get("/critical-values/all")
def get_all_critical_values(
    acknowledged: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_validator)
) -> List[CriticalValueResponse]:
    """
    Get all tests with critical values, optionally filtered by acknowledgment status.
    """
    query = db.query(OrderTest).filter(OrderTest.hasCriticalValues == True)

    if acknowledged is not None:
        if acknowledged:
            query = query.filter(OrderTest.criticalAcknowledgedAt != None)
        else:
            query = query.filter(OrderTest.criticalAcknowledgedAt == None)

    tests = query.order_by(OrderTest.resultEnteredAt.desc()).all()

    results = []
    for test in tests:
        order = db.query(Order).filter(Order.orderId == test.orderId).first()
        results.append(CriticalValueResponse(
            id=test.id,
            orderId=test.orderId,
            testCode=test.testCode,
            testName=test.testName,
            patientId=order.patientId if order else 0,
            patientName=order.patientName if order else "Unknown",
            flags=test.flags,
            criticalNotificationSent=test.criticalNotificationSent,
            criticalNotifiedAt=test.criticalNotifiedAt,
            criticalNotifiedTo=test.criticalNotifiedTo,
            criticalAcknowledgedAt=test.criticalAcknowledgedAt,
            resultEnteredAt=test.resultEnteredAt,
            status=test.status.value if test.status else "unknown"
        ))

    return results


@router.post("/critical-values/{test_id}/notify")
def notify_critical_value(
    test_id: int,
    request: NotifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_validator)
):
    """
    Record that a critical value notification was sent.
    """
    test = db.query(OrderTest).filter(OrderTest.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    if not test.hasCriticalValues:
        raise HTTPException(status_code=400, detail="Test does not have critical values")

    service = CriticalNotificationService(db)
    order = db.query(Order).filter(Order.orderId == test.orderId).first()

    # Record the notification
    from app.services.flag_calculator import ResultFlag, FlagCalculatorService
    from app.schemas.enums import ResultStatus

    # Parse flags to create notification
    critical_flags = []
    if test.flags:
        for flag_str in test.flags:
            parts = flag_str.split(':')
            if len(parts) >= 2:
                critical_flags.append(ResultFlag(
                    item_code=parts[0],
                    item_name=parts[0],
                    value=float(parts[2]) if len(parts) > 2 else 0,
                    status=ResultStatus(parts[1]) if parts[1] in [s.value for s in ResultStatus] else ResultStatus.CRITICAL,
                    reference_low=None,
                    reference_high=None,
                    critical_low=None,
                    critical_high=None,
                    unit=None
                ))

    notification = service.create_notification(
        order_test=test,
        order=order,
        critical_flags=critical_flags,
        notified_to=request.notifiedTo,
        notification_method=request.notificationMethod
    )

    # Log the notification
    audit = AuditService(db)
    audit.log_critical_value_notified(
        order_id=test.orderId,
        test_id=test.id,
        test_code=test.testCode,
        user_id=current_user.id,
        notified_to=request.notifiedTo,
        notification_method=request.notificationMethod
    )

    db.commit()

    return {
        "success": True,
        "message": f"Notification recorded for {request.notifiedTo}",
        "notifiedAt": notification.notified_at.isoformat() if notification.notified_at else None
    }


@router.post("/critical-values/{test_id}/acknowledge")
def acknowledge_critical_value(
    test_id: int,
    request: AcknowledgeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_validator)
):
    """
    Record acknowledgment of a critical value notification.
    """
    test = db.query(OrderTest).filter(OrderTest.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    if not test.hasCriticalValues:
        raise HTTPException(status_code=400, detail="Test does not have critical values")

    if not test.criticalNotificationSent:
        raise HTTPException(status_code=400, detail="Notification has not been sent yet")

    if test.criticalAcknowledgedAt:
        raise HTTPException(status_code=400, detail="Critical value already acknowledged")

    service = CriticalNotificationService(db)
    service.acknowledge_notification(test, request.acknowledgedBy)

    # Log the acknowledgment
    audit = AuditService(db)
    audit.log_critical_value_acknowledged(
        order_id=test.orderId,
        test_id=test.id,
        test_code=test.testCode,
        acknowledged_by=request.acknowledgedBy,
        user_id=current_user.id
    )

    db.commit()

    return {
        "success": True,
        "message": f"Critical value acknowledged by {request.acknowledgedBy}",
        "acknowledgedAt": test.criticalAcknowledgedAt.isoformat() if test.criticalAcknowledgedAt else None
    }


@router.get("/orders/{order_id}/critical-values")
def get_order_critical_values(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[CriticalValueResponse]:
    """
    Get all critical values for a specific order.
    """
    order = db.query(Order).filter(Order.orderId == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    service = CriticalNotificationService(db)
    tests = service.get_critical_values_for_order(order_id)

    results = []
    for test in tests:
        results.append(CriticalValueResponse(
            id=test.id,
            orderId=test.orderId,
            testCode=test.testCode,
            testName=test.testName,
            patientId=order.patientId,
            patientName=order.patientName,
            flags=test.flags,
            criticalNotificationSent=test.criticalNotificationSent,
            criticalNotifiedAt=test.criticalNotifiedAt,
            criticalNotifiedTo=test.criticalNotifiedTo,
            criticalAcknowledgedAt=test.criticalAcknowledgedAt,
            resultEnteredAt=test.resultEnteredAt,
            status=test.status.value if test.status else "unknown"
        ))

    return results
