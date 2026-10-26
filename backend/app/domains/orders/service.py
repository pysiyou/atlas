"""Order business logic and status derivation."""
import logging
from datetime import UTC, date, datetime, time
from typing import Literal

from app.domains.audit.service import AuditEmitter
from app.domains.billing.models import Payment
from app.domains.billing.schemas import InvoiceResponse
from app.domains.billing.service import BillingService
from app.domains.catalog.models.catalog_test import CatalogTest
from app.domains.lab.models.sample import Sample
from app.domains.lab.public import generate_samples_for_order
from app.domains.lab.quality.recollection_snapshot import recollection_blocked_order_test_ids
from app.domains.lab.rules.order_test_lab_loader import (
    lab_projections_for_order,
    lab_projections_for_orders,
)
from app.domains.orders.models import Order, OrderTest
from app.domains.orders.schemas import (
    OrderCreate,
    OrderDetailResponse,
    OrderReportResponse,
    OrderResponse,
    OrderSummaryResponse,
    OrderUpdate,
)
from app.domains.patients.models import Patient
from app.domains.patients.schemas import PatientResponse
from app.domains.payments.schemas import PaymentCreate, PaymentResponse
from app.domains.payments.service import PaymentService, enrich_payment
from app.domains.orders.search import order_search_filter
from app.platform.cache import invalidate_lab_board_summary_cache
from app.platform.utils.common import get_or_404
from app.shared.contracts.enums import (
    OrderStatus,
    PaymentMethod,
    PaymentStatus,
    SampleStatus,
    TestStatus,
)
from app.shared.schemas.pagination import create_paginated_response, skip_to_page
from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, joinedload, selectinload

logger = logging.getLogger(__name__)


_STARTED_STATUSES = {
    TestStatus.SAMPLE_COLLECTED,
    TestStatus.RESULTED,
    TestStatus.VALIDATED,
    TestStatus.ESCALATED,
}


def _pending_test_has_started(test: OrderTest, samples_by_id: dict[int, Sample]) -> bool:
    if not test.sampleId:
        return False
    sample = samples_by_id.get(test.sampleId)
    if not sample:
        return False
    if sample.status == SampleStatus.REJECTED:
        return True
    if sample.isRecollection:
        return True
    return False


def _test_has_started(test: OrderTest, samples_by_id: dict[int, Sample]) -> bool:
    if test.status in _STARTED_STATUSES:
        return True
    if test.status == TestStatus.PENDING:
        return _pending_test_has_started(test, samples_by_id)
    return False


def _calculate_order_status(order: Order, samples: list[Sample]) -> OrderStatus:
    tests = order.tests
    if not tests:
        return order.overallStatus

    active_tests = [t for t in tests if t.status not in {TestStatus.SUPERSEDED, TestStatus.REMOVED}]
    if not active_tests:
        return order.overallStatus

    samples_by_id = {s.sampleId: s for s in samples}
    all_terminal = all(
        t.status in {TestStatus.VALIDATED, TestStatus.CANCELLED} for t in active_tests
    )
    if all_terminal:
        return OrderStatus.COMPLETED

    if any(_test_has_started(t, samples_by_id) for t in active_tests):
        return OrderStatus.RUNNING

    return OrderStatus.ORDERED


def apply_order_status_rollup(db: Session, order_id: int) -> bool:
    """Recompute order.overallStatus from samples/tests; audit without committing."""
    order = (
        db.query(Order)
        .filter(Order.orderId == order_id)
        .options(selectinload(Order.tests))
        .with_for_update()
        .first()
    )
    if not order:
        return False

    if order.overallStatus == OrderStatus.CANCELLED:
        logger.debug("Order %s is cancelled, skipping status update", order_id)
        return False

    samples = db.query(Sample).filter(Sample.orderId == order_id).all()
    new_status = _calculate_order_status(order, samples)

    if order.overallStatus == new_status:
        return False

    old_status = order.overallStatus
    order.overallStatus = new_status
    order.updatedAt = datetime.now(UTC)
    db.add(order)
    AuditEmitter(db).order_status_changed(
        order_id,
        old_status.value if old_status else None,
        new_status.value,
        user_id=None,
        metadata={"trigger": "automatic"},
    )
    logger.info("Order %s status changed from %s to %s", order_id, old_status, new_status)
    return True


def update_order_status(db: Session, order_id: int, *, commit: bool = True) -> None:
    """Lab legacy entry: rollup and optionally commit (prefer facade run_lab_mutation)."""
    changed = apply_order_status_rollup(db, order_id)
    if commit and changed:
        db.commit()


def _parse_include(include: str | None) -> set[str]:
    if not include:
        return set()
    return {part.strip().lower() for part in include.split(",") if part.strip()}


_INACTIVE_TEST_STATUSES = (
    TestStatus.REMOVED,
    TestStatus.SUPERSEDED,
    TestStatus.CANCELLED,
)


def _active_test_codes_by_order_id(db, order_ids: list[int]) -> dict[int, list[str]]:
    if not order_ids:
        return {}
    rows = (
        db.query(OrderTest.orderId, OrderTest.testCode)
        .filter(OrderTest.orderId.in_(order_ids))
        .filter(OrderTest.status.notin_(_INACTIVE_TEST_STATUSES))
        .order_by(OrderTest.orderId, OrderTest.id)
        .all()
    )
    codes_by_order: dict[int, list[str]] = {}
    for order_id, test_code in rows:
        codes_by_order.setdefault(order_id, []).append(test_code)
    return codes_by_order


def _order_to_summary(order: Order, test_count: int, test_codes: list[str] | None = None) -> dict:
    from app.domains.lab.rules.status_presentation import resolve_order_presentation

    patient_name = order.patient.fullName if order.patient else "Unknown"
    return OrderSummaryResponse(
        orderId=order.orderId,
        patientId=order.patientId,
        patientName=patient_name,
        orderDate=order.orderDate,
        testCount=test_count,
        testCodes=test_codes or [],
        totalPrice=float(order.totalPrice or 0),
        paymentStatus=order.paymentStatus,
        overallStatus=order.overallStatus,
        statusPresentation=resolve_order_presentation(order.overallStatus),
        priority=order.priority,
        referentDoctor=order.referentDoctor,
        clinicalNotes=order.clinicalNotes,
        specialInstructions=order.specialInstructions,
        patientPrepInstructions=order.patientPrepInstructions,
        createdBy=str(order.createdBy),
        createdAt=order.createdAt,
        updatedAt=order.updatedAt,
    ).model_dump(mode="json")


class OrderService:
    def __init__(self, db: Session):
        self.db = db
        self.emitter = AuditEmitter(db)

    def _order_response_with_lab(
        self,
        order: Order,
        projections: dict[int, object] | None = None,
        blocked: set[int] | None = None,
    ) -> OrderResponse:
        from app.domains.lab.rules.status_presentation import resolve_order_presentation

        base = OrderResponse.model_validate(order)
        resolved = (
            projections
            if projections is not None
            else lab_projections_for_order(self.db, order, blocked=blocked)
        )
        enriched_tests = [
            test.model_copy(update={"lab": resolved.get(test.id)}) for test in base.tests
        ]
        return base.model_copy(
            update={
                "tests": enriched_tests,
                "statusPresentation": resolve_order_presentation(order.overallStatus),
            }
        )

    def _catalog_tests_by_code(self, codes: list[str]) -> dict[str, CatalogTest]:
        """Load catalog rows for the given codes once; 404 if any code is missing."""
        unique_codes = list(dict.fromkeys(codes))
        if not unique_codes:
            return {}
        found = self.db.query(CatalogTest).filter(CatalogTest.code.in_(unique_codes)).all()
        by_code = {test.code: test for test in found}
        missing = [code for code in unique_codes if code not in by_code]
        if missing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"CatalogTest {', '.join(missing)} not found",
            )
        return by_code

    def list_orders(
        self,
        skip: int,
        limit: int,
        patient_id: int | None = None,
        order_status: OrderStatus | list[OrderStatus] | None = None,
        payment_status: PaymentStatus | list[PaymentStatus] | None = None,
        sort: Literal["createdAt", "updatedAt"] = "updatedAt",
        paginated: bool = True,
        summary: bool = True,
        order_id: int | None = None,
        payment_methods: list[PaymentMethod] | None = None,
        search: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
    ):
        query = self.db.query(Order)
        if search:
            query = query.outerjoin(Patient, Order.patientId == Patient.id)
        if patient_id:
            query = query.filter(Order.patientId == patient_id)
        if order_id:
            query = query.filter(Order.orderId == order_id)
        statuses = (
            order_status
            if isinstance(order_status, list)
            else [order_status]
            if order_status
            else []
        )
        if statuses:
            query = query.filter(Order.overallStatus.in_(statuses))
        payment_statuses = (
            payment_status
            if isinstance(payment_status, list)
            else [payment_status]
            if payment_status
            else []
        )
        if payment_statuses:
            query = query.filter(Order.paymentStatus.in_(payment_statuses))
        if payment_methods:
            query = query.filter(
                Order.orderId.in_(
                    self.db.query(Payment.orderId).filter(Payment.paymentMethod.in_(payment_methods))
                )
            )
        if search:
            query = query.filter(order_search_filter(search))
        if date_from:
            start = datetime.combine(date_from, time.min, tzinfo=UTC)
            query = query.filter(Order.orderDate >= start)
        if date_to:
            end = datetime.combine(date_to, time.max, tzinfo=UTC)
            query = query.filter(Order.orderDate <= end)
        if summary:
            query = query.options(joinedload(Order.patient))
        else:
            query = query.options(
                joinedload(Order.patient),
                selectinload(Order.tests).joinedload(OrderTest.test),
            )
        total = query.count() if paginated else 0
        order_by = Order.updatedAt.desc() if sort == "updatedAt" else Order.createdAt.desc()
        orders = query.order_by(order_by).offset(skip).limit(limit).all()
        try:
            if summary:
                order_ids = [order.orderId for order in orders]
                test_counts: dict[int, int] = {}
                test_codes_by_order: dict[int, list[str]] = {}
                if order_ids:
                    rows = (
                        self.db.query(OrderTest.orderId, func.count(OrderTest.id))
                        .filter(OrderTest.orderId.in_(order_ids))
                        .filter(OrderTest.status.notin_(_INACTIVE_TEST_STATUSES))
                        .group_by(OrderTest.orderId)
                        .all()
                    )
                    test_counts = {order_id: count for order_id, count in rows}
                    test_codes_by_order = _active_test_codes_by_order_id(self.db, order_ids)
                serialized = [
                    _order_to_summary(
                        order,
                        test_counts.get(order.orderId, 0),
                        test_codes_by_order.get(order.orderId, []),
                    )
                    for order in orders
                ]
            else:
                blocked = recollection_blocked_order_test_ids(self.db)
                projections_by_order = lab_projections_for_orders(
                    self.db, orders, blocked=blocked
                )
                serialized = [
                    self._order_response_with_lab(
                        order,
                        projections=projections_by_order.get(order.orderId, {}),
                    ).model_dump(mode="json")
                    for order in orders
                ]
        except Exception:
            logger.exception("Error serializing orders")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error processing order data",
            )
        if paginated:
            return create_paginated_response(serialized, total, skip_to_page(skip, limit), limit)
        return serialized

    def get_order(self, order_id: int, include: str | None = None):
        includes = _parse_include(include)
        options = [
            joinedload(Order.patient),
            selectinload(Order.tests).joinedload(OrderTest.test),
        ]
        if "payments" in includes:
            options.append(selectinload(Order.payments))
        order = self.db.query(Order).filter(Order.orderId == order_id).options(*options).first()
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order {order_id} not found",
            )
        if includes:
            order_dump = self._order_response_with_lab(order).model_dump(mode="json")
            detail: dict = {**order_dump}
            if "payments" in includes:
                detail["payments"] = [
                    PaymentResponse(**enrich_payment(p, order)).model_dump(mode="json")
                    for p in order.payments
                ]
            if "invoices" in includes:
                invoices = BillingService(self.db).list_invoices_for_order(order_id)
                detail["invoices"] = [
                    InvoiceResponse.model_validate(inv).model_dump(mode="json") for inv in invoices
                ]
            if "patient" in includes and order.patient:
                from app.domains.patients.service import patient_to_response_dict

                detail["patient"] = PatientResponse.model_validate(
                    patient_to_response_dict(order.patient)
                ).model_dump(mode="json")
            return OrderDetailResponse(**detail)
        return self._order_response_with_lab(order)

    def delete_order(self, order_id: int, user_id: int) -> None:
        order = get_or_404(self.db, Order, order_id, "orderId")
        has_payments = (
            self.db.query(Payment).filter(Payment.orderId == order_id).first() is not None
        )
        if has_payments:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete order that has payments. Remove or void payments first.",
            )
        try:
            self.emitter.order_deleted(order_id, user_id)
            self.db.query(Sample).filter(Sample.orderId == order_id).delete()
            self.db.delete(order)
            self.db.commit()
            invalidate_lab_board_summary_cache()
        except Exception:
            self.db.rollback()
            logger.exception("Failed to delete order %s", order_id)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete order",
            )

    def mark_as_reported(self, order_id: int, user_id: int) -> OrderReportResponse:
        order = get_or_404(self.db, Order, order_id, "orderId")
        if order.overallStatus != OrderStatus.COMPLETED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Order must be COMPLETED before reporting. Current status: {order.overallStatus}",
            )
        self.emitter.reporting_generated(order_id, user_id)
        self.db.commit()
        return OrderReportResponse(
            orderId=order_id, status="completed", message="Order is complete"
        )

    def create_order(self, order_data: OrderCreate, user_id: int) -> OrderResponse:
        patient = self.db.query(Patient).filter(Patient.id == order_data.patientId).first()
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Patient {order_data.patientId} not found",
            )
        catalog_by_code = self._catalog_tests_by_code(
            [test_data.testCode for test_data in order_data.tests]
        )
        total_price = 0.0
        test_entries = []
        for test_data in order_data.tests:
            test = catalog_by_code[test_data.testCode]
            total_price += test.price
            test_entries.append((test.code, test.price))

        order = Order(
            patientId=order_data.patientId,
            orderDate=datetime.now(UTC),
            totalPrice=total_price,
            paymentStatus=PaymentStatus.UNPAID,
            overallStatus=OrderStatus.ORDERED,
            priority=order_data.priority,
            referentDoctor=order_data.referentDoctor,
            clinicalNotes=order_data.clinicalNotes,
            specialInstructions=order_data.specialInstructions,
            patientPrepInstructions=order_data.patientPrepInstructions,
            createdBy=str(user_id),
        )
        try:
            self.db.add(order)
            self.db.flush()
            for test_code, price in test_entries:
                self.db.add(
                    OrderTest(
                        orderId=order.orderId,
                        testCode=test_code,
                        status=TestStatus.PENDING,
                        priceAtOrder=price,
                    )
                )
            self.db.flush()
            self.emitter.order_created(order.orderId, order_data.patientId, user_id)
            generate_samples_for_order(order.orderId, self.db, user_id, emitter=self.emitter)

            BillingService(self.db).create_invoice_for_order(order.orderId, user_id)
            self.db.commit()
            invalidate_lab_board_summary_cache()
            self.db.refresh(order)
        except SQLAlchemyError:
            self.db.rollback()
            raise HTTPException(status_code=500, detail="Failed to create order")
        order = self._order_with_relations(order.orderId)
        return self._order_response_with_lab(order)

    def _order_with_relations(self, order_id: int) -> Order:
        return (
            self.db.query(Order)
            .filter(Order.orderId == order_id)
            .options(
                joinedload(Order.patient),
                selectinload(Order.tests).joinedload(OrderTest.test),
            )
            .first()
        )

    def update_order(self, order_id: int, order_data: OrderUpdate, user_id: int) -> OrderResponse:
        order = (
            self.db.query(Order)
            .filter(Order.orderId == order_id)
            .options(selectinload(Order.tests))
            .first()
        )
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order {order_id} not found",
            )
        update_data = order_data.model_dump(exclude_unset=True)
        tests_to_update = update_data.pop("tests", None)

        if tests_to_update is not None:
            existing_test_codes = {ot.testCode for ot in order.tests}
            new_test_codes = {t["testCode"] for t in tests_to_update}
            omitted_codes = existing_test_codes - new_test_codes
            tests_to_add = new_test_codes - existing_test_codes
            # Only pending rows can be removed; in-progress / terminal omissions are ignored.
            tests_to_remove = {
                ot.testCode
                for ot in order.tests
                if ot.testCode in omitted_codes and ot.status == TestStatus.PENDING
            }

            for ot in order.tests:
                if ot.testCode in tests_to_remove and ot.results is not None:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Cannot remove test {ot.testCode} - it has results entered",
                    )

            existing_tests_price = sum(
                ot.priceAtOrder
                for ot in order.tests
                if ot.testCode not in tests_to_remove
                and ot.status not in {TestStatus.SUPERSEDED, TestStatus.REMOVED}
            )
            for ot in order.tests:
                if ot.testCode in tests_to_remove:
                    old_status = ot.status.value if ot.status else "unknown"
                    ot.status = TestStatus.REMOVED
                    self.emitter.order_test_removed(
                        order.orderId,
                        ot.id,
                        ot.testCode,
                        user_id,
                        old_status,
                    )

            catalog_by_code = self._catalog_tests_by_code(list(tests_to_add))
            total_price_adjustment = 0.0
            for test_data in tests_to_update:
                test_code = test_data["testCode"]
                if test_code in tests_to_add:
                    test = catalog_by_code[test_code]
                    order_test = OrderTest(
                        orderId=order.orderId,
                        testCode=test.code,
                        status=TestStatus.PENDING,
                        priceAtOrder=test.price,
                    )
                    self.db.add(order_test)
                    self.db.flush()
                    total_price_adjustment += test.price
                    self.emitter.order_test_added(order.orderId, order_test.id, test.code, user_id)

            order.totalPrice = existing_tests_price + total_price_adjustment
            generate_samples_for_order(order.orderId, self.db, user_id, emitter=self.emitter)

        if update_data or tests_to_update is not None:
            self.emitter.order_updated(
                order_id,
                user_id,
                metadata={
                    "fields": list(update_data.keys()) if update_data else [],
                    "tests_changed": tests_to_update is not None,
                },
            )

        for field, value in update_data.items():
            setattr(order, field, value)
        order.updatedAt = datetime.now(UTC)

        if "priority" in update_data:
            self.db.query(Sample).filter(Sample.orderId == order_id).update(
                {
                    Sample.priority: order.priority,
                    Sample.updatedAt: datetime.now(UTC),
                    Sample.updatedBy: str(user_id),
                },
                synchronize_session="fetch",
            )

        self.db.commit()
        self.db.refresh(order)
        order = self._order_with_relations(order.orderId)
        return self._order_response_with_lab(order)

    def update_order_payment(
        self,
        order_id: int,
        payment_status: PaymentStatus,
        amount_paid: float | None,
        user_id: int,
    ) -> OrderResponse:
        order = self.db.query(Order).filter(Order.orderId == order_id).first()
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order {order_id} not found",
            )
        if amount_paid is not None and amount_paid > 0:
            # Single emit path: PaymentService.create_payment writes billing.payment.process.
            PaymentService(self.db).create_payment(
                PaymentCreate(
                    orderId=order_id,
                    amount=amount_paid,
                    paymentMethod=PaymentMethod.CASH,
                    notes="",
                ),
                user_id,
            )
            order = self._order_with_relations(order_id)
            if order.paymentStatus != payment_status:
                order.paymentStatus = payment_status
                order.updatedAt = datetime.now(UTC)
                self.db.commit()
                order = self._order_with_relations(order_id)
            return self._order_response_with_lab(order)

        order.paymentStatus = payment_status
        order.updatedAt = datetime.now(UTC)
        self.db.commit()
        self.db.refresh(order)
        order = self._order_with_relations(order.orderId)
        return self._order_response_with_lab(order)
