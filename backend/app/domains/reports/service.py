"""Per-order lab report listing."""
from app.domains.audit.service import AuditEmitter
from app.domains.orders.models import Order, OrderTest
from app.domains.orders.schemas import OrderResponse
from app.domains.reports.eligibility import (
    INACTIVE_TEST_STATUSES,
    active_order_tests,
    is_reportable_order,
)
from app.domains.reports.schemas import ReportableOrderItem
from app.shared.contracts.enums import OrderStatus, TestStatus
from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload, selectinload


def _order_load_options():
    return (
        joinedload(Order.patient),
        selectinload(Order.tests).joinedload(OrderTest.test),
    )


class ReportService:
    def __init__(self, db: Session):
        self.db = db

    def _to_item(self, order: Order) -> ReportableOrderItem:
        patient = order.patient
        active_tests = active_order_tests(order)
        validated_count = sum(1 for test in active_tests if test.status == TestStatus.VALIDATED)
        order_payload = OrderResponse.model_validate(order).model_dump(mode="json")
        return ReportableOrderItem(
            orderId=order.orderId,
            orderDate=order.orderDate,
            patientId=patient.id,
            patientName=patient.fullName,
            patientDob=patient.dateOfBirth,
            patientGender=patient.gender,
            activeTestCount=len(active_tests),
            validatedTestCount=validated_count,
            order=order_payload,
        )

    def list_reportable_orders(self, limit: int = 500) -> list[ReportableOrderItem]:
        orders = (
            self.db.query(Order)
            .options(*_order_load_options())
            .filter(Order.overallStatus != OrderStatus.CANCELLED)
            .filter(Order.tests.any(OrderTest.status.notin_(tuple(INACTIVE_TEST_STATUSES))))
            .order_by(Order.orderDate.desc())
            .limit(limit)
            .all()
        )
        return [self._to_item(order) for order in orders]

    def get_reportable_order(self, order_id: int, user_id: int) -> ReportableOrderItem:
        order = (
            self.db.query(Order)
            .options(*_order_load_options())
            .filter(Order.orderId == order_id)
            .first()
        )
        if not order or not is_reportable_order(order):
            raise HTTPException(status_code=404, detail="Reportable order not found")

        item = self._to_item(order)
        active_tests = active_order_tests(order)
        AuditEmitter(self.db).reporting_downloaded(
            order.orderId,
            user_id,
            metadata={"test_codes": [test.testCode for test in active_tests]},
        )
        self.db.commit()
        return item
