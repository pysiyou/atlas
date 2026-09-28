"""Validated test report listing."""
from app.models.order import Order, OrderTest
from app.schemas.enums import TestStatus
from app.schemas.order import OrderResponse, OrderTestResponse
from app.schemas.reports import ValidatedTestReportItem
from app.services.audit.emitter import AuditEmitter
from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload


class ReportService:
    def __init__(self, db: Session):
        self.db = db

    def list_validated_tests(self, limit: int = 500) -> list[ValidatedTestReportItem]:
        order_tests = (
            self.db.query(OrderTest)
            .options(
                joinedload(OrderTest.test),
                joinedload(OrderTest.order).joinedload(Order.patient),
                joinedload(OrderTest.order).selectinload(Order.tests).joinedload(OrderTest.test),
            )
            .filter(OrderTest.status == TestStatus.VALIDATED)
            .order_by(OrderTest.resultValidatedAt.desc())
            .limit(limit)
            .all()
        )

        items: list[ValidatedTestReportItem] = []
        for order_test in order_tests:
            order = order_test.order
            patient = order.patient
            order_payload = OrderResponse.model_validate(order).model_dump(mode="json")
            test_payload = OrderTestResponse.model_validate(order_test).model_dump(mode="json")
            items.append(
                ValidatedTestReportItem(
                    testId=order_test.id,
                    testCode=order_test.testCode,
                    testName=order_test.test.name if order_test.test else order_test.testCode,
                    orderId=order.orderId,
                    orderDate=order.orderDate,
                    patientId=patient.id,
                    patientName=patient.fullName,
                    patientDob=patient.dateOfBirth,
                    patientGender=patient.gender,
                    test=test_payload,
                    order=order_payload,
                )
            )
        return items

    def get_validated_test_report(
        self, order_test_id: int, user_id: int
    ) -> ValidatedTestReportItem:
        order_test = (
            self.db.query(OrderTest)
            .options(
                joinedload(OrderTest.test),
                joinedload(OrderTest.order).joinedload(Order.patient),
                joinedload(OrderTest.order).selectinload(Order.tests).joinedload(OrderTest.test),
            )
            .filter(OrderTest.id == order_test_id, OrderTest.status == TestStatus.VALIDATED)
            .first()
        )
        if not order_test:
            raise HTTPException(status_code=404, detail="Validated test report not found")

        order = order_test.order
        patient = order.patient
        order_payload = OrderResponse.model_validate(order).model_dump(mode="json")
        test_payload = OrderTestResponse.model_validate(order_test).model_dump(mode="json")
        item = ValidatedTestReportItem(
            testId=order_test.id,
            testCode=order_test.testCode,
            testName=order_test.test.name if order_test.test else order_test.testCode,
            orderId=order.orderId,
            orderDate=order.orderDate,
            patientId=patient.id,
            patientName=patient.fullName,
            patientDob=patient.dateOfBirth,
            patientGender=patient.gender,
            test=test_payload,
            order=order_payload,
        )
        AuditEmitter(self.db).reporting_downloaded(
            order.orderId,
            order_test.id,
            user_id,
            metadata={"test_code": order_test.testCode},
        )
        self.db.commit()
        return item
