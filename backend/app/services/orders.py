"""
Payment business logic. Router delegates create to this service.
"""
import logging
from datetime import UTC, datetime
from typing import Literal

from app.models.billing import Invoice, Payment
from app.models.lab_audit import LabOperationLog
from app.models.order import Order, OrderTest
from app.models.patient import Patient
from app.models.sample import Sample
from app.models.test import Test
from app.schemas.billing import InvoiceResponse
from app.schemas.enums import (
    LabOperationType,
    OrderStatus,
    PaymentMethod,
    PaymentStatus,
    SampleStatus,
    TestStatus,
)
from app.schemas.order import (
    OrderCreate,
    OrderDetailResponse,
    OrderReportResponse,
    OrderResponse,
    OrderSummaryResponse,
    OrderUpdate,
)
from app.schemas.pagination import create_paginated_response, skip_to_page
from app.schemas.patient import PatientResponse
from app.schemas.payment import PaymentCreate, PaymentResponse
from app.services.audit.logger import AuditService
from app.services.billing import BillingService
from app.services.lab.samples import generate_samples_for_order
from app.utils.common import get_or_404
from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, joinedload, selectinload


def enrich_payment(payment: Payment, order: Order | None) -> dict:
    """Build PaymentResponse dict from payment and optional order (for orderTotalPrice, numberOfTests, patientName)."""
    return {
        "paymentId": payment.paymentId,
        "orderId": payment.orderId,
        "invoiceId": payment.invoiceId,
        "amount": payment.amount,
        "paymentMethod": payment.paymentMethod,
        "paidAt": payment.paidAt,
        "receivedBy": payment.receivedBy,
        "receiptGenerated": payment.receiptGenerated,
        "notes": payment.notes,
        "orderTotalPrice": order.totalPrice if order else None,
        "numberOfTests": len(order.tests) if order else 0,
        "patientName": order.patientName if order else None,
    }


class PaymentService:
    def __init__(self, db: Session):
        self.db = db

    def _payment_query(self):
        return self.db.query(Payment).options(
            joinedload(Payment.order).joinedload(Order.patient),
            joinedload(Payment.order).selectinload(Order.tests),
        )

    def list_payments(
        self,
        skip: int,
        limit: int,
        order_id: int | None = None,
        payment_method: PaymentMethod | None = None,
    ) -> list[dict]:
        query = self._payment_query()
        if order_id:
            query = query.filter(Payment.orderId == order_id)
        if payment_method:
            query = query.filter(Payment.paymentMethod == payment_method)
        payments = query.order_by(Payment.paidAt.desc()).offset(skip).limit(limit).all()
        return [enrich_payment(p, p.order) for p in payments]

    def get_payment(self, payment_id: int) -> dict:
        payment = self._payment_query().filter(Payment.paymentId == payment_id).first()
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Payment {payment_id} not found",
            )
        return enrich_payment(payment, payment.order)

    def list_by_order(self, order_id: int) -> list[dict]:
        payments = (
            self._payment_query()
            .filter(Payment.orderId == order_id)
            .order_by(Payment.paidAt.desc())
            .all()
        )
        return [enrich_payment(p, p.order) for p in payments]

    def create_payment(self, payment_data: PaymentCreate, user_id: int) -> dict:
        order = (
            self.db.query(Order)
            .filter(Order.orderId == payment_data.orderId)
            .options(joinedload(Order.patient), selectinload(Order.tests))
            .first()
        )
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order {payment_data.orderId} not found",
            )
        if payment_data.amount <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment amount must be greater than zero",
            )
        existing_payments = (
            self.db.query(Payment).filter(Payment.orderId == payment_data.orderId).all()
        )
        total_paid = sum(p.amount for p in existing_payments)
        remaining = order.totalPrice - total_paid
        if remaining <= 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Order is already fully paid",
            )
        if payment_data.amount > remaining:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Payment amount (${payment_data.amount:.2f}) exceeds remaining balance (${remaining:.2f})",
            )
        payment = Payment(
            orderId=payment_data.orderId,
            invoiceId=None,
            amount=payment_data.amount,
            paymentMethod=payment_data.paymentMethod,
            paidAt=datetime.now(UTC),
            receivedBy=str(user_id),
            receiptGenerated=False,
            notes=payment_data.notes if payment_data.notes is not None else "",
        )
        self.db.add(payment)
        self.db.flush()
        new_total_paid = total_paid + payment_data.amount
        if new_total_paid >= order.totalPrice:
            order.paymentStatus = PaymentStatus.PAID
        else:
            order.paymentStatus = PaymentStatus.UNPAID

        invoices = self.db.query(Invoice).filter(Invoice.orderId == order.orderId).all()
        for invoice in invoices:
            invoice.amountPaid = new_total_paid
            invoice.amountDue = max(0.0, (invoice.total or 0.0) - new_total_paid)
            invoice.paymentStatus = (
                PaymentStatus.PAID if invoice.amountDue <= 0 else PaymentStatus.UNPAID
            )
            if payment.invoiceId is None:
                payment.invoiceId = invoice.invoiceId

        AuditService(self.db).log_order_payment_recorded(
            order_id=order.orderId,
            payment_id=payment.paymentId,
            user_id=user_id,
            amount=payment_data.amount,
            payment_method=payment_data.paymentMethod.value,
            payment_status=order.paymentStatus.value,
            metadata={"totalPaid": new_total_paid, "orderTotal": order.totalPrice},
        )
        self.db.commit()
        self.db.refresh(payment)
        return enrich_payment(payment, order)


"""
Order business logic and status derivation.
"""


logger = logging.getLogger(__name__)

TERMINAL_STATUSES = {OrderStatus.CANCELLED}

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


def build_order_completion_metadata(order: Order) -> dict:
    active_tests = [
        t for t in order.tests if t.status not in {TestStatus.SUPERSEDED, TestStatus.REMOVED}
    ]
    active_count = len(active_tests)
    all_terminal = all(
        t.status in {TestStatus.VALIDATED, TestStatus.CANCELLED} for t in active_tests
    )
    return {
        "orderCompleted": bool(all_terminal and active_count > 0),
        "activeTestCount": active_count,
        "singleTestOrder": active_count == 1,
    }


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
        return OrderStatus.IN_PROGRESS

    return OrderStatus.ORDERED


def update_order_status(db: Session, order_id: int) -> None:
    order = db.query(Order).filter(Order.orderId == order_id).first()
    if not order:
        return

    if order.overallStatus == OrderStatus.CANCELLED:
        logger.debug("Order %s is cancelled, skipping status update", order_id)
        return

    samples = db.query(Sample).filter(Sample.orderId == order_id).all()
    new_status = _calculate_order_status(order, samples)

    if order.overallStatus != new_status:
        old_status = order.overallStatus
        order.overallStatus = new_status
        order.updatedAt = datetime.now(UTC)
        db.add(
            LabOperationLog(
                operationType=LabOperationType.ORDER_STATUS_CHANGE,
                entityType="order",
                entityId=order_id,
                performedBy="system",
                performedAt=datetime.now(UTC),
                beforeState={"status": old_status.value if old_status else None},
                afterState={"status": new_status.value},
                operationData={"trigger": "automatic"},
            )
        )
        db.add(order)
        db.commit()
        logger.info("Order %s status changed from %s to %s", order_id, old_status, new_status)


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
        priority=order.priority,
        referringPhysician=order.referringPhysician,
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

    def list_orders(
        self,
        skip: int,
        limit: int,
        patient_id: int | None = None,
        order_status: OrderStatus | None = None,
        payment_status: PaymentStatus | None = None,
        sort: Literal["createdAt", "updatedAt"] = "updatedAt",
        paginated: bool = False,
        summary: bool = False,
    ):
        query = self.db.query(Order)
        if patient_id:
            query = query.filter(Order.patientId == patient_id)
        if order_status:
            query = query.filter(Order.overallStatus == order_status)
        if payment_status:
            query = query.filter(Order.paymentStatus == payment_status)
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
                serialized = [
                    OrderResponse.model_validate(o).model_dump(mode="json") for o in orders
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
            order_dump = OrderResponse.model_validate(order).model_dump(mode="json")
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
                from app.services.patients import patient_to_response_dict

                detail["patient"] = PatientResponse.model_validate(
                    patient_to_response_dict(order.patient)
                ).model_dump(mode="json")
            return OrderDetailResponse(**detail)
        return OrderResponse.model_validate(order)

    def delete_order(self, order_id: int) -> None:
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
            self.db.query(Sample).filter(Sample.orderId == order_id).delete()
            self.db.delete(order)
            self.db.commit()
        except Exception:
            self.db.rollback()
            logger.exception("Failed to delete order %s", order_id)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete order",
            )

    def mark_as_reported(self, order_id: int) -> OrderReportResponse:
        order = get_or_404(self.db, Order, order_id, "orderId")
        if order.overallStatus != OrderStatus.COMPLETED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Order must be COMPLETED before reporting. Current status: {order.overallStatus}",
            )
        return OrderReportResponse(
            orderId=order_id, status="completed", message="Order is complete"
        )

    def create_order(self, order_data: OrderCreate, user_id: int) -> Order:
        patient = self.db.query(Patient).filter(Patient.id == order_data.patientId).first()
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Patient {order_data.patientId} not found",
            )
        total_price = 0.0
        test_entries = []
        for test_data in order_data.tests:
            test = self.db.query(Test).filter(Test.code == test_data.testCode).first()
            if not test:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Test {test_data.testCode} not found",
                )
            total_price += test.price
            test_entries.append((test.code, test.price))

        order = Order(
            patientId=order_data.patientId,
            orderDate=datetime.now(UTC),
            totalPrice=total_price,
            paymentStatus=PaymentStatus.UNPAID,
            overallStatus=OrderStatus.ORDERED,
            priority=order_data.priority,
            referringPhysician=order_data.referringPhysician,
            clinicalNotes=order_data.clinicalNotes,
            specialInstructions=order_data.specialInstructions,
            patientPrepInstructions=order_data.patientPrepInstructions,
            createdBy=user_id,
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
            generate_samples_for_order(order.orderId, self.db, user_id)

            BillingService(self.db).create_invoice_for_order(order.orderId)
            self.db.commit()
            self.db.refresh(order)
        except SQLAlchemyError:
            self.db.rollback()
            raise HTTPException(status_code=500, detail="Failed to create order")
        return self._order_with_relations(order.orderId)

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

    def update_order(self, order_id: int, order_data: OrderUpdate, user_id: int) -> Order:
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
            audit = AuditService(self.db)

            for ot in order.tests:
                if ot.testCode in tests_to_remove:
                    old_status = ot.status.value if ot.status else "unknown"
                    ot.status = TestStatus.REMOVED
                    audit.log_test_removed(
                        order_id=order.orderId,
                        test_id=ot.id,
                        test_code=ot.testCode,
                        user_id=user_id,
                        old_status=old_status,
                    )

            total_price_adjustment = 0.0
            for test_data in tests_to_update:
                test_code = test_data["testCode"]
                if test_code in tests_to_add:
                    test = self.db.query(Test).filter(Test.code == test_code).first()
                    if not test:
                        raise HTTPException(
                            status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Test {test_code} not found",
                        )
                    order_test = OrderTest(
                        orderId=order.orderId,
                        testCode=test.code,
                        status=TestStatus.PENDING,
                        priceAtOrder=test.price,
                    )
                    self.db.add(order_test)
                    self.db.flush()
                    total_price_adjustment += test.price
                    audit.log_test_added(
                        order_id=order.orderId,
                        test_id=order_test.id,
                        test_code=test.code,
                        user_id=user_id,
                    )

            order.totalPrice = existing_tests_price + total_price_adjustment
            generate_samples_for_order(order.orderId, self.db, user_id)

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
        return self._order_with_relations(order.orderId)

    def update_order_payment(
        self,
        order_id: int,
        payment_status: PaymentStatus,
        amount_paid: float | None,
        user_id: int,
    ) -> Order:
        order = self.db.query(Order).filter(Order.orderId == order_id).first()
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order {order_id} not found",
            )
        order.paymentStatus = payment_status
        if amount_paid is not None and amount_paid > 0:
            payment_record = Payment(
                orderId=order_id,
                invoiceId=None,
                amount=amount_paid,
                paymentMethod=PaymentMethod.CASH,
                paidAt=datetime.now(UTC),
                receivedBy=str(user_id),
                receiptGenerated=False,
                notes="",
            )
            self.db.add(payment_record)
            self.db.flush()
            AuditService(self.db).log_order_payment_recorded(
                order_id=order_id,
                payment_id=payment_record.paymentId,
                user_id=user_id,
                amount=amount_paid,
                payment_method=PaymentMethod.CASH.value,
                payment_status=payment_status.value,
            )
        order.updatedAt = datetime.now(UTC)
        self.db.commit()
        self.db.refresh(order)
        return self._order_with_relations(order.orderId)
