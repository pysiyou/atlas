"""Report generation API schemas."""
from datetime import datetime

from pydantic import BaseModel

from app.schemas.enums import Gender
from app.schemas.order import OrderTestResponse


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
