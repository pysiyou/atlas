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
    paymentStatus = Column(Enum(PaymentStatus), nullable=False, default=PaymentStatus.UNPAID)
    overallStatus = Column(Enum(OrderStatus), nullable=False, default=OrderStatus.ORDERED)

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
    patient = relationship("Patient", foreign_keys=[patientId])
    tests = relationship("OrderTest", back_populates="order", cascade="all, delete-orphan")

    @property
    def patientName(self) -> str:
        """Get patient full name from relationship"""
        return self.patient.fullName if self.patient else "Unknown"


class OrderTest(Base):
    __tablename__ = "order_tests"

    id = Column(String, primary_key=True)  # Composite: orderId + testCode
    orderId = Column(String, ForeignKey("orders.orderId"), nullable=False, index=True)
    testCode = Column(String, ForeignKey("tests.code"), nullable=False, index=True)

    # Order-specific state
    status = Column(Enum(TestStatus), nullable=False, default=TestStatus.PENDING, index=True)
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

    # Re-test tracking (for result validation rejection flow)
    isRetest = Column(Boolean, default=False)
    retestOfTestId = Column(String, nullable=True)  # Links to original OrderTest.id that was rejected
    retestNumber = Column(Integer, default=0)  # 0 = original, 1 = 1st retest, etc.
    retestOrderTestId = Column(String, nullable=True)  # Points to the new retest entry created after rejection

    # Result rejection history (for validation rejections)
    resultRejectionHistory = Column(JSON, nullable=True, default=list)  # Array of ResultRejectionRecord

    # Critical values
    hasCriticalValues = Column(Boolean, default=False)
    criticalNotificationSent = Column(Boolean, default=False)
    criticalNotifiedAt = Column(DateTime(timezone=True), nullable=True)
    criticalNotifiedTo = Column(String, nullable=True)
    criticalAcknowledgedAt = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    order = relationship("Order", back_populates="tests")
    test = relationship("Test", foreign_keys=[testCode])

    @property
    def testName(self) -> str:
        """Get test display name from relationship"""
        return self.test.displayName if self.test else "Unknown"

    @property
    def sampleType(self) -> str:
        """Get test sample type from relationship"""
        return self.test.sampleType if self.test else "Unknown"
