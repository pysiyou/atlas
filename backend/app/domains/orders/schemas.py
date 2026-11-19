"""
Pydantic schemas for Order
"""
from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Any, Literal

if TYPE_CHECKING:
    from app.domains.lab.public import LabWorkItemProjection

from app.domains.billing.schemas import InvoiceResponse
from app.domains.patients.schemas import PatientResponse
from app.shared.identifiers import (
    EMPLOYEE_NUMBER_PATTERN,
    FILLER_PATTERN,
    LAB_ACTOR_USER_ID_PATTERN,
    MRN_PATTERN,
    RECEIPT_NUMBER_PATTERN,
    REFERENT_DOCTOR_ID_PATTERN,
    SAMPLE_ID_PATTERN,
    TEST_MNEMONIC_PATTERN,
)
from app.domains.payments.schemas import PaymentResponse
from app.shared.enums import (
    Gender,
    OrderStatus,
    PaymentMethod,
    PaymentStatus,
    PriorityLevel,
    TestStatus,
)
from app.shared.http import StatusPresentation
from pydantic import BaseModel, Field, field_validator, model_validator


class TestResultValue(BaseModel):
    """
    Individual test result parameter value.
    Flexible to handle both numeric and text results.
    """

    value: str | float | int | None = None
    unit: str | None = None
    referenceRange: str | None = None
    flag: Literal[
        "normal", "high", "low", "critical", "critical-high", "critical-low"
    ] | None = None

    class Config:
        from_attributes = True


# Type alias for results dict - keys are parameter codes, values are result data
TestResultsDict = dict[str, TestResultValue | dict[str, Any] | str | float | int | None]


class OrderTestCreate(BaseModel):
    """Schema for creating a test within an order."""

    testCode: str = Field(
        ...,
        min_length=2,
        max_length=8,
        pattern=TEST_MNEMONIC_PATTERN,
        description="Clinical mnemonic from the test catalog",
    )


class OrderTestResponse(BaseModel):
    """Schema for test response data."""

    id: int
    testCode: str
    testName: str  # From relationship
    sampleType: str  # From relationship
    status: TestStatus
    priceAtOrder: float
    sampleId: str | None = Field(None, pattern=SAMPLE_ID_PATTERN)
    results: TestResultsDict | None = None
    resultEnteredAt: datetime | None = None
    enteredBy: str | None = Field(None, pattern=LAB_ACTOR_USER_ID_PATTERN)
    resultValidatedAt: datetime | None = None
    validatedBy: str | None = Field(None, pattern=LAB_ACTOR_USER_ID_PATTERN)
    validationNotes: str | None = None
    flags: list[str] | None = None
    technicianNotes: str | None = None
    hasCriticalValues: bool = False

    # Re-test tracking fields
    isRetest: bool = False
    retestOfTestId: int | None = None  # Original test ID that was rejected
    retestNumber: int = 0  # 0 = original, 1 = 1st retest, etc.
    retestOrderTestId: int | None = None

    lab: LabWorkItemProjection | None = None

    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    """Schema for creating a new order."""

    patientId: str = Field(..., min_length=8, max_length=8, pattern=MRN_PATTERN)
    tests: list[OrderTestCreate] = Field(
        default_factory=list, description="Explicit catalog tests"
    )
    workupCodes: list[str] = Field(
        default_factory=list, description="Clinical workup codes expanded server-side"
    )
    priority: PriorityLevel = PriorityLevel.LOW
    referentDoctorId: str | None = Field(None, pattern=REFERENT_DOCTOR_ID_PATTERN)
    clinicalNotes: str | None = Field(None, max_length=2000)
    specialInstructions: list[str] | None = None
    patientPrepInstructions: str | None = Field(None, max_length=1000)

    @field_validator("tests")
    @classmethod
    def no_duplicate_tests(cls, v: list[OrderTestCreate]) -> list[OrderTestCreate]:
        """Ensure no duplicate test codes in the order."""
        codes = [t.testCode for t in v]
        if len(codes) != len(set(codes)):
            raise ValueError("Duplicate test codes not allowed")
        return v

    @model_validator(mode="after")
    def require_tests_or_workups(self) -> OrderCreate:
        """Accept explicit tests, clinical workup codes, or both."""
        if not self.tests and not self.workupCodes:
            raise ValueError("At least one test or clinical workup is required")
        return self


class OrderUpdate(BaseModel):
    priority: PriorityLevel | None = None
    referentDoctorId: str | None = Field(None, pattern=REFERENT_DOCTOR_ID_PATTERN)
    clinicalNotes: str | None = None
    specialInstructions: list[str] | None = None
    tests: list[OrderTestCreate] | None = None  # Optional list of tests to update (add/remove)


class LatestPaymentSnippet(BaseModel):
    """Most recent payment on an order (list embed)."""

    paymentId: str = Field(..., pattern=RECEIPT_NUMBER_PATTERN)
    paymentMethod: PaymentMethod
    paidAt: datetime


class OrderSummaryResponse(BaseModel):
    """Lightweight order projection for lists, dashboards, and aggregates."""

    orderId: str = Field(..., pattern=FILLER_PATTERN)
    placerNumber: str | None = Field(None, pattern=FILLER_PATTERN)
    patientId: str = Field(..., pattern=MRN_PATTERN)
    patientName: str
    patientDob: str | None = None
    patientGender: Gender | None = None
    orderDate: datetime
    testCount: int = 0
    testCodes: list[str] = Field(default_factory=list)
    testNames: list[str] = Field(default_factory=list)
    latestPayment: LatestPaymentSnippet | None = None
    totalPrice: float
    paymentStatus: PaymentStatus
    overallStatus: OrderStatus
    statusPresentation: StatusPresentation | None = None
    priority: PriorityLevel
    referentDoctorId: str | None = Field(None, pattern=REFERENT_DOCTOR_ID_PATTERN)
    referentDoctorName: str | None = None
    referentDoctorEmail: str | None = None
    referentDoctorPhone: str | None = None
    referentDoctorHospital: str | None = None
    referentDoctorUsername: str | None = None
    clinicalNotes: str | None = None
    specialInstructions: list[str] | None = None
    patientPrepInstructions: str | None = None
    createdBy: str = Field(..., pattern=EMPLOYEE_NUMBER_PATTERN)
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    orderId: str = Field(..., pattern=FILLER_PATTERN)
    placerNumber: str | None = Field(None, pattern=FILLER_PATTERN)
    patientId: str = Field(..., pattern=MRN_PATTERN)
    patientName: str  # From relationship
    patientDob: str | None = None
    patientGender: Gender | None = None
    orderDate: datetime
    tests: list[OrderTestResponse]
    totalPrice: float
    paymentStatus: PaymentStatus
    overallStatus: OrderStatus
    statusPresentation: StatusPresentation | None = None
    priority: PriorityLevel
    referentDoctorId: str | None = Field(None, pattern=REFERENT_DOCTOR_ID_PATTERN)
    referentDoctorName: str | None = None
    referentDoctorEmail: str | None = None
    referentDoctorPhone: str | None = None
    referentDoctorHospital: str | None = None
    referentDoctorUsername: str | None = None
    clinicalNotes: str | None = None
    specialInstructions: list[str] | None = None
    patientPrepInstructions: str | None = None
    doctorApprovedBy: str | None = Field(None, pattern=EMPLOYEE_NUMBER_PATTERN)
    doctorApprovedAt: datetime | None = None
    createdBy: str = Field(..., pattern=EMPLOYEE_NUMBER_PATTERN)
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class OrderDetailResponse(OrderResponse):
    """Order plus optional related data from GET /orders/{id}?include=."""

    payments: list[PaymentResponse] | None = None
    invoices: list[InvoiceResponse] | None = None
    patient: PatientResponse | None = None


"""Order endpoint request schemas."""


class OrderReportResponse(BaseModel):
    """Response for order report/completion confirmation."""

    orderId: str = Field(..., pattern=FILLER_PATTERN)
    status: str
    message: str


def _rebuild_order_test_lab_schema() -> None:
    from app.domains.lab.public import LabWorkItemProjection

    OrderTestResponse.model_rebuild(
        _types_namespace={"LabWorkItemProjection": LabWorkItemProjection}
    )


_rebuild_order_test_lab_schema()
