"""
Pydantic schemas for Order
"""
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Literal, Optional, List
from app.schemas.enums import OrderStatus, PaymentStatus, PriorityLevel, TestStatus
from app.schemas.payment import PaymentResponse


class ResultRejectionRecord(BaseModel):
    """
    Record of a result rejection event during validation.
    Stored in resultRejectionHistory array on OrderTest.
    """
    rejectedAt: datetime
    rejectedBy: str
    rejectionReason: str
    rejectionType: Literal['re-test', 're-collect', 'escalate', 'authorize_retest']


class ResultRejectionRequest(BaseModel):
    """
    Request body for rejecting test results during validation.
    """
    rejectionReason: str = Field(..., min_length=1, max_length=1000, description="Reason for rejection")
    rejectionType: Literal['re-test', 're-collect', 'escalate'] = Field(
        ...,
        description="'re-test' = re-run with same sample, 're-collect' = new sample needed, 'escalate' = escalate to supervisor"
    )


class OrderTestCreate(BaseModel):
    """Schema for creating a test within an order."""
    testCode: str = Field(..., min_length=1, max_length=50, description="Test code from catalog")


class OrderTestResponse(BaseModel):
    """Schema for test response data."""
    id: int
    testCode: str
    testName: str  # From relationship
    sampleType: str  # From relationship
    status: TestStatus
    priceAtOrder: float
    sampleId: int | None = None
    results: dict | None = None
    resultEnteredAt: datetime | None = None
    enteredBy: str | None = None
    resultValidatedAt: datetime | None = None
    validatedBy: str | None = None
    validationNotes: str | None = None
    flags: list[str] | None = None
    technicianNotes: str | None = None

    # Re-test tracking fields
    isRetest: bool = False
    retestOfTestId: int | None = None  # Original test ID that was rejected
    retestNumber: int = 0  # 0 = original, 1 = 1st retest, etc.
    retestOrderTestId: int | None = None  # New test ID created after rejection
    
    # Result rejection history
    resultRejectionHistory: list[ResultRejectionRecord] | None = None
    
    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    """Schema for creating a new order."""
    patientId: int = Field(..., gt=0, description="Patient ID")
    tests: list[OrderTestCreate] = Field(..., min_length=1, description="At least one test required")
    priority: PriorityLevel = PriorityLevel.ROUTINE
    referringPhysician: str | None = Field(None, max_length=200)
    clinicalNotes: str | None = Field(None, max_length=2000)
    specialInstructions: list[str] | None = None
    patientPrepInstructions: str | None = Field(None, max_length=1000)

    @field_validator('tests')
    @classmethod
    def no_duplicate_tests(cls, v: list[OrderTestCreate]) -> list[OrderTestCreate]:
        """Ensure no duplicate test codes in the order."""
        codes = [t.testCode for t in v]
        if len(codes) != len(set(codes)):
            raise ValueError('Duplicate test codes not allowed')
        return v


class OrderUpdate(BaseModel):
  priority: PriorityLevel | None = None
  referringPhysician: str | None = None
  clinicalNotes: str | None = None
  specialInstructions: list[str] | None = None
  tests: list[OrderTestCreate] | None = None  # Optional list of tests to update (add/remove)


class OrderResponse(BaseModel):
    orderId: int
    patientId: int
    patientName: str  # From relationship
    orderDate: datetime
    tests: list[OrderTestResponse]
    totalPrice: float
    paymentStatus: PaymentStatus
    overallStatus: OrderStatus
    priority: PriorityLevel
    referringPhysician: str | None = None
    clinicalNotes: str | None = None
    specialInstructions: list[str] | None = None
    patientPrepInstructions: str | None = None
    createdBy: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class OrderDetailResponse(OrderResponse):
    """Order plus optional payments for GET /orders/{id}?include=payments."""
    payments: Optional[List[PaymentResponse]] = None
