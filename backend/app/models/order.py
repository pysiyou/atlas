"""
Order and OrderTest Models
"""
from sqlalchemy import Column, String, Float, DateTime, JSON, Enum, ForeignKey, Boolean, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
from app.schemas.enums import OrderStatus, PaymentStatus, PriorityLevel, TestStatus


class Order(Base):
    __tablename__ = "orders"
    
    order_id = Column(String, primary_key=True, index=True)  # ORD-YYYYMMDD-XXX
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False, index=True)
    order_date = Column(DateTime(timezone=True), nullable=False)
    
    # Pricing
    total_price = Column(Float, nullable=False)
    payment_status = Column(Enum(PaymentStatus), nullable=False, default=PaymentStatus.PENDING)
    overall_status = Column(Enum(OrderStatus), nullable=False, default=OrderStatus.PENDING)
    
    # Scheduling (optional - for future appointment integration)
    appointment_id = Column(String, nullable=True)
    scheduled_collection_time = Column(DateTime(timezone=True), nullable=True)
    
    # Instructions
    special_instructions = Column(JSON, nullable=True)  # Array of strings
    patient_prep_instructions = Column(String, nullable=True)
    clinical_notes = Column(String, nullable=True)
    referring_physician = Column(String, nullable=True)
    priority = Column(Enum(PriorityLevel), nullable=False, default=PriorityLevel.ROUTINE)
    
    # Metadata
    created_by = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    tests = relationship("OrderTest", back_populates="order", cascade="all, delete-orphan")


class OrderTest(Base):
    __tablename__ = "order_tests"
    
    id = Column(String, primary_key=True)  # Composite: order_id + test_code
    order_id = Column(String, ForeignKey("orders.order_id"), nullable=False, index=True)
    test_code = Column(String, ForeignKey("tests.code"), nullable=False, index=True)
    
    # Order-specific state
    status = Column(Enum(TestStatus), nullable=False, default=TestStatus.PENDING)
    price_at_order = Column(Float, nullable=False)  # Snapshot for billing
    
    # Sample linkage
    sample_id = Column(String, nullable=True)  # Links to Sample
    
    # Results (JSON)
    results = Column(JSON, nullable=True)  # Record<string, TestResult>
    result_entered_at = Column(DateTime(timezone=True), nullable=True)
    entered_by = Column(String, nullable=True)
    
    # Validation
    result_validated_at = Column(DateTime(timezone=True), nullable=True)
    validated_by = Column(String, nullable=True)
    validation_notes = Column(String, nullable=True)
    
    # Flags and notes
    flags = Column(JSON, nullable=True)  # Array of strings
    technician_notes = Column(String, nullable=True)
    
    # Reflex/Repeat
    is_reflex_test = Column(Boolean, default=False)
    triggered_by = Column(String, nullable=True)
    reflex_rule = Column(String, nullable=True)
    is_repeat_test = Column(Boolean, default=False)
    repeat_reason = Column(String, nullable=True)
    original_test_id = Column(String, nullable=True)
    repeat_number = Column(Integer, nullable=True)
    
    # Critical values
    has_critical_values = Column(Boolean, default=False)
    critical_notification_sent = Column(Boolean, default=False)
    critical_notified_at = Column(DateTime(timezone=True), nullable=True)
    critical_notified_to = Column(String, nullable=True)
    critical_acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationship
    order = relationship("Order", back_populates="tests")
