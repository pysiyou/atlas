"""
Pydantic schemas for Order
"""
from pydantic import BaseModel
from datetime import datetime
from app.schemas.enums import OrderStatus, PaymentStatus, PriorityLevel, TestStatus


class OrderTestCreate(BaseModel):
    testCode: str


class OrderTestResponse(BaseModel):
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
    patientId: str
    tests: list[OrderTestCreate]
    priority: PriorityLevel = PriorityLevel.ROUTINE
    referringPhysician: str | None = None
    clinicalNotes: str | None = None
    specialInstructions: list[str] | None = None
    patientPrepInstructions: str | None = None


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
