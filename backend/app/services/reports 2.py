"""Validated test report listing."""
from app.models.order import Order, OrderTest
from app.schemas.enums import TestStatus
from app.schemas.order import OrderResponse, OrderTestResponse
from app.schemas.reports import ValidatedTestReportItem
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
