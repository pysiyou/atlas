"""Report generation API schemas."""
from datetime import datetime

from app.domains.orders.schemas import OrderTestResponse
from app.shared.contracts.enums import Gender
from pydantic import BaseModel


class ValidatedTestReportItem(BaseModel):
    testId: int
    testCode: str
    testName: str
    orderId: int
    orderDate: datetime
    patientId: int
    patientName: str
    patientDob: str | None = None
    patientGender: Gender | None = None
    test: OrderTestResponse
    order: dict
