"""Per-order lab report listing."""
from datetime import UTC, date, datetime, time

from app.domains.audit.service import AuditEmitter
from app.domains.lab.rules.status_presentation import resolve_order_presentation
from app.domains.orders.models import Order, OrderTest
from app.domains.orders.schemas import OrderResponse
from app.domains.orders.search import reportable_order_search_filter
from app.domains.patients.models import Patient
from app.domains.reports.eligibility import (
    INACTIVE_TEST_STATUSES,
    active_order_tests,
    is_reportable_order,
)
from app.domains.reports.schemas import ReportableOrderItem
from app.shared.contracts.enums import OrderStatus, TestStatus
from app.shared.schemas.pagination import create_paginated_response, skip_to_page
from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload, selectinload


def _order_load_options():
    return (
        joinedload(Order.patient),
        joinedload(Order.referentDoctor),
        selectinload(Order.tests).joinedload(OrderTest.test),
    )


class ReportService:
    def __init__(self, db: Session):
        self.db = db

    def _to_item(self, order: Order, *, include_order: bool = True) -> ReportableOrderItem:
        """Map an order to the report DTO. List rows omit the nested order graph."""
        patient = order.patient
        active_tests = active_order_tests(order)
        validated_count = sum(1 for test in active_tests if test.status == TestStatus.VALIDATED)
        return ReportableOrderItem(
            orderId=order.orderId,
            orderDate=order.orderDate,
            overallStatus=order.overallStatus,
            statusPresentation=resolve_order_presentation(order.overallStatus),
            patientId=patient.id,
            patientName=patient.fullName,
            patientDob=patient.dateOfBirth,
            patientGender=patient.gender,
            patientEmail=patient.email,
            patientPhone=patient.phone,
            activeTestCount=len(active_tests),
            validatedTestCount=validated_count,
            testCodes=[test.testCode for test in active_tests],
            testNames=[test.testName for test in active_tests],
            order=OrderResponse.model_validate(order).model_dump(mode="json")
            if include_order
            else None,
        )

    def _reportable_query(self):
        """Non-cancelled orders with at least one active test line."""
        return (
            self.db.query(Order)
            .filter(Order.overallStatus != OrderStatus.CANCELLED)
            .filter(Order.tests.any(OrderTest.status.notin_(tuple(INACTIVE_TEST_STATUSES))))
        )

    def list_reportable_orders(
        self,
        skip: int = 0,
        limit: int = 20,
        search: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
    ) -> dict:
        """Return one page of reportable orders with pagination metadata."""
        query = self._reportable_query()
        if search:
            query = query.outerjoin(Patient, Order.patientId == Patient.id)
            query = query.filter(reportable_order_search_filter(search))
        if date_from:
            start = datetime.combine(date_from, time.min, tzinfo=UTC)
            query = query.filter(Order.orderDate >= start)
        if date_to:
            end = datetime.combine(date_to, time.max, tzinfo=UTC)
            query = query.filter(Order.orderDate <= end)

        id_query = query.with_entities(Order.orderId, Order.orderDate).distinct()
        total = id_query.order_by(None).count()
        page_ids = [
            row[0]
            for row in id_query.order_by(Order.orderDate.desc()).offset(skip).limit(limit).all()
        ]
        if not page_ids:
            return create_paginated_response([], total, skip_to_page(skip, limit), limit)

        orders = (
            self.db.query(Order)
            .options(*_order_load_options())
            .filter(Order.orderId.in_(page_ids))
            .order_by(Order.orderDate.desc())
            .all()
        )
        by_id = {order.orderId: order for order in orders}
        items = [
            self._to_item(by_id[order_id], include_order=False)
            for order_id in page_ids
            if order_id in by_id
        ]
        return create_paginated_response(items, total, skip_to_page(skip, limit), limit)

    def _load_reportable_order(self, order_id: int) -> Order:
        order = (
            self.db.query(Order)
            .options(*_order_load_options())
            .filter(Order.orderId == order_id)
            .first()
        )
        if not order or not is_reportable_order(order):
            raise HTTPException(status_code=404, detail="Reportable order not found")
        return order

    def get_reportable_order_view(self, order_id: int) -> ReportableOrderItem:
        """Load one reportable order without recording a download audit event."""
        return self._to_item(self._load_reportable_order(order_id))

    def get_reportable_order(self, order_id: int, user_id: int) -> ReportableOrderItem:
        order = self._load_reportable_order(order_id)
        item = self._to_item(order)
        active_tests = active_order_tests(order)
        AuditEmitter(self.db).reporting_downloaded(
            item.orderId,
            user_id,
            metadata={"test_codes": [test.testCode for test in active_tests]},
        )
        self.db.commit()
        return item
