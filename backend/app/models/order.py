"""
Order and OrderTest Models - All fields use camelCase
"""
from sqlalchemy import Column, String, Float, DateTime, JSON, Enum, ForeignKey, Boolean, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
from app.schemas.enums import OrderStatus, PaymentStatus, PriorityLevel, TestStatus


class Order(Base):
    __tablename__ = "orders"

    orderId = Column(String, primary_key=True, index=True)  # ORD-YYYYMMDD-XXX
    patientId = Column(String, ForeignKey("patients.id"), nullable=False, index=True)
    orderDate = Column(DateTime(timezone=True), nullable=False)

    # Pricing
    totalPrice = Column(Float, nullable=False)
    paymentStatus = Column(Enum(PaymentStatus), nullable=False, default=PaymentStatus.PENDING)
    overallStatus = Column(Enum(OrderStatus), nullable=False, default=OrderStatus.PENDING)

    # Scheduling (optional - for future appointment integration)
    appointmentId = Column(String, nullable=True)
    scheduledCollectionTime = Column(DateTime(timezone=True), nullable=True)

    # Instructions
    specialInstructions = Column(JSON, nullable=True)  # Array of strings
    patientPrepInstructions = Column(String, nullable=True)
    clinicalNotes = Column(String, nullable=True)
    referringPhysician = Column(String, nullable=True)
    priority = Column(Enum(PriorityLevel), nullable=False, default=PriorityLevel.ROUTINE)

    # Metadata
    createdBy = Column(String, nullable=False)
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    tests = relationship("OrderTest", back_populates="order", cascade="all, delete-orphan")


class OrderTest(Base):
    __tablename__ = "order_tests"

    id = Column(String, primary_key=True)  # Composite: orderId + testCode
    orderId = Column(String, ForeignKey("orders.orderId"), nullable=False, index=True)
    testCode = Column(String, ForeignKey("tests.code"), nullable=False, index=True)

    # Order-specific state
    status = Column(Enum(TestStatus), nullable=False, default=TestStatus.PENDING)
    priceAtOrder = Column(Float, nullable=False)  # Snapshot for billing

    # Sample linkage
    sampleId = Column(String, nullable=True)  # Links to Sample

    # Results (JSON)
    results = Column(JSON, nullable=True)  # Record<string, TestResult>
    resultEnteredAt = Column(DateTime(timezone=True), nullable=True)
    enteredBy = Column(String, nullable=True)

    # Validation
    resultValidatedAt = Column(DateTime(timezone=True), nullable=True)
    validatedBy = Column(String, nullable=True)
    validationNotes = Column(String, nullable=True)

    # Flags and notes
    flags = Column(JSON, nullable=True)  # Array of strings
    technicianNotes = Column(String, nullable=True)

    # Reflex/Repeat
    isReflexTest = Column(Boolean, default=False)
    triggeredBy = Column(String, nullable=True)
    reflexRule = Column(String, nullable=True)
    isRepeatTest = Column(Boolean, default=False)
    repeatReason = Column(String, nullable=True)
    originalTestId = Column(String, nullable=True)
    repeatNumber = Column(Integer, nullable=True)

    # Critical values
    hasCriticalValues = Column(Boolean, default=False)
    criticalNotificationSent = Column(Boolean, default=False)
    criticalNotifiedAt = Column(DateTime(timezone=True), nullable=True)
    criticalNotifiedTo = Column(String, nullable=True)
    criticalAcknowledgedAt = Column(DateTime(timezone=True), nullable=True)

    # Relationship
    order = relationship("Order", back_populates="tests")
