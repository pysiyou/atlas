"""
Pydantic schemas for Order
"""
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from app.schemas.enums import OrderStatus, PaymentStatus, PriorityLevel, TestStatus


class OrderTestCreate(BaseModel):
    """Schema for creating a test within an order."""
    testCode: str = Field(..., min_length=1, max_length=50, description="Test code from catalog")


class OrderTestResponse(BaseModel):
    """Schema for test response data."""
    id: str
    testCode: str
    testName: str  # From relationship
    sampleType: str  # From relationship
    status: TestStatus
    priceAtOrder: float
    sampleId: str | None = None
    results: dict | None = None
    resultEnteredAt: datetime | None = None
    enteredBy: str | None = None
    resultValidatedAt: datetime | None = None
    validatedBy: str | None = None
    validationNotes: str | None = None
    flags: list[str] | None = None
    technicianNotes: str | None = None
    
    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    """Schema for creating a new order."""
    patientId: str = Field(..., min_length=1, description="Patient ID")
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


class OrderResponse(BaseModel):
    orderId: str
    patientId: str
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
