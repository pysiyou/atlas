"""
Order business logic. Router delegates create/update/payment to this service.
"""
from datetime import datetime, timezone
from typing import Any

from app.utils.time_utils import get_now

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, selectinload, joinedload
from sqlalchemy.exc import SQLAlchemyError

from app.models.order import Order, OrderTest
from app.models.patient import Patient
from app.models.test import Test
from app.models.billing import Payment
from app.models.sample import Sample
from app.schemas.order import OrderCreate, OrderUpdate
from app.schemas.enums import OrderStatus, PaymentStatus, TestStatus
from app.services.sample_generator import generate_samples_for_order
from app.services.audit_service import AuditService


class OrderService:
    def __init__(self, db: Session):
        self.db = db

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
            orderDate=get_now(),
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
                ot = OrderTest(
                    orderId=order.orderId,
                    testCode=test_code,
                    status=TestStatus.PENDING,
                    priceAtOrder=price,
                )
                self.db.add(ot)
            self.db.flush()
            generate_samples_for_order(order.orderId, self.db, user_id)
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
            tests_to_remove = existing_test_codes - new_test_codes
            tests_to_add = new_test_codes - existing_test_codes

            for ot in order.tests:
                if ot.testCode in tests_to_remove:
                    if ot.results is not None:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Cannot remove test {ot.testCode} - it has results entered",
                        )
                    if ot.status != TestStatus.PENDING:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Cannot remove test {ot.testCode} - it is in progress (status: {ot.status})",
                        )

            existing_tests_price = sum(
                ot.priceAtOrder for ot in order.tests
                if ot.testCode not in tests_to_remove and ot.status not in {TestStatus.SUPERSEDED, TestStatus.REMOVED}
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
        order.updatedAt = get_now()

        # Cascade priority change to all samples for this order (bulk update)
        if "priority" in update_data:
            self.db.query(Sample).filter(Sample.orderId == order_id).update({
                Sample.priority: order.priority,
                Sample.updatedAt: get_now(),
                Sample.updatedBy: str(user_id)
            }, synchronize_session="fetch")

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
        from app.schemas.enums import PaymentMethod

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
                paidAt=get_now(),
                receivedBy=str(user_id),
                receiptGenerated=False,
                notes="",
            )
            self.db.add(payment_record)
        order.updatedAt = get_now()
        self.db.commit()
        self.db.refresh(order)
        return self._order_with_relations(order.orderId)
