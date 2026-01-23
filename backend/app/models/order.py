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

    orderId = Column("order_id", Integer, primary_key=True, autoincrement=True, index=True)
    patientId = Column("patient_id", Integer, ForeignKey("patients.id"), nullable=False, index=True)
    orderDate = Column("order_date", DateTime(timezone=True), nullable=False)

    # Pricing
    totalPrice = Column("total_price", Float, nullable=False)
    paymentStatus = Column("payment_status", Enum(PaymentStatus), nullable=False, default=PaymentStatus.UNPAID)
    overallStatus = Column("overall_status", Enum(OrderStatus), nullable=False, default=OrderStatus.ORDERED)

    # Scheduling (optional - for future appointment integration)
    appointmentId = Column("appointment_id", Integer, nullable=True)
    scheduledCollectionTime = Column("scheduled_collection_time", DateTime(timezone=True), nullable=True)

    # Instructions
    specialInstructions = Column("special_instructions", JSON, nullable=True)  # Array of strings
    patientPrepInstructions = Column("patient_prep_instructions", String, nullable=True)
    clinicalNotes = Column("clinical_notes", String, nullable=True)
    referringPhysician = Column("referring_physician", String, nullable=True)
    priority = Column(Enum(PriorityLevel), nullable=False, default=PriorityLevel.ROUTINE)

    # Metadata
    createdBy = Column("created_by", String, nullable=False)
    createdAt = Column("created_at", DateTime(timezone=True), server_default=func.now())
    updatedAt = Column("updated_at", DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    patient = relationship("Patient", foreign_keys=[patientId])
    tests = relationship("OrderTest", back_populates="order", cascade="all, delete-orphan")

    @property
    def patientName(self) -> str:
        """Get patient full name from relationship"""
        return self.patient.fullName if self.patient else "Unknown"


class OrderTest(Base):
    __tablename__ = "order_tests"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    orderId = Column("order_id", Integer, ForeignKey("orders.order_id"), nullable=False, index=True)
    testCode = Column("test_code", String, ForeignKey("tests.code"), nullable=False, index=True)

    # Order-specific state
    status = Column(Enum(TestStatus), nullable=False, default=TestStatus.PENDING, index=True)
    priceAtOrder = Column("price_at_order", Float, nullable=False)  # Snapshot for billing

    # Sample linkage
    sampleId = Column("sample_id", Integer, nullable=True)  # Links to Sample

    # Results (JSON)
    results = Column(JSON, nullable=True)  # Record<string, TestResult>
    resultEnteredAt = Column("result_entered_at", DateTime(timezone=True), nullable=True)
    enteredBy = Column("entered_by", String, nullable=True)

    # Validation
    resultValidatedAt = Column("result_validated_at", DateTime(timezone=True), nullable=True)
    validatedBy = Column("validated_by", String, nullable=True)
    validationNotes = Column("validation_notes", String, nullable=True)

    # Flags and notes
    flags = Column(JSON, nullable=True)  # Array of strings
    technicianNotes = Column("technician_notes", String, nullable=True)

    # Reflex/Repeat
    isReflexTest = Column("is_reflex_test", Boolean, default=False)
    triggeredBy = Column("triggered_by", String, nullable=True)
    reflexRule = Column("reflex_rule", String, nullable=True)
    isRepeatTest = Column("is_repeat_test", Boolean, default=False)
    repeatReason = Column("repeat_reason", String, nullable=True)
    originalTestId = Column("original_test_id", Integer, nullable=True)
    repeatNumber = Column("repeat_number", Integer, nullable=True)

    # Re-test tracking (for result validation rejection flow)
    isRetest = Column("is_retest", Boolean, default=False)
    retestOfTestId = Column("retest_of_test_id", Integer, nullable=True)  # Links to original OrderTest.id that was rejected
    retestNumber = Column("retest_number", Integer, default=0)  # 0 = original, 1 = 1st retest, etc.
    retestOrderTestId = Column("retest_order_test_id", Integer, nullable=True)  # Points to the new retest entry created after rejection

    # Result rejection history (for validation rejections)
    resultRejectionHistory = Column("result_rejection_history", JSON, nullable=True, default=list)  # Array of ResultRejectionRecord

    # Critical values
    hasCriticalValues = Column("has_critical_values", Boolean, default=False)
    criticalNotificationSent = Column("critical_notification_sent", Boolean, default=False)
    criticalNotifiedAt = Column("critical_notified_at", DateTime(timezone=True), nullable=True)
    criticalNotifiedTo = Column("critical_notified_to", String, nullable=True)
    criticalAcknowledgedAt = Column("critical_acknowledged_at", DateTime(timezone=True), nullable=True)

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
