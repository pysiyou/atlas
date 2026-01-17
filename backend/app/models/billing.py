"""
Billing Models - Invoice, Payment, InsuranceClaim
"""
from sqlalchemy import Column, String, Float, DateTime, JSON, Enum, ForeignKey, Boolean
from sqlalchemy.sql import func
from app.database import Base
from app.schemas.enums import PaymentStatus, PaymentMethod, ClaimStatus


class Invoice(Base):
    __tablename__ = "invoices"
    
    invoice_id = Column(String, primary_key=True, index=True)  # INV-YYYYMMDD-XXX
    order_id = Column(String, ForeignKey("orders.order_id"), nullable=False, index=True)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False, index=True)
    patient_name = Column(String, nullable=False)
    
    # Items (JSON array)
    items = Column(JSON, nullable=False)  # Array of {testCode, testName, quantity, unitPrice, totalPrice}
    
    # Amounts
    subtotal = Column(Float, nullable=False)
    discount = Column(Float, default=0.0)
    tax = Column(Float, default=0.0)
    total = Column(Float, nullable=False)
    
    # Payment tracking
    payment_status = Column(Enum(PaymentStatus), nullable=False, default=PaymentStatus.PENDING)
    amount_paid = Column(Float, default=0.0)
    amount_due = Column(Float, nullable=False)
    
    # Dates
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    due_date = Column(DateTime(timezone=True), nullable=True)


class Payment(Base):
    __tablename__ = "payments"
    
    payment_id = Column(String, primary_key=True, index=True)  # PAY-YYYYMMDD-XXX
    order_id = Column(String, ForeignKey("orders.order_id"), nullable=False, index=True)
    invoice_id = Column(String, ForeignKey("invoices.invoice_id"), nullable=False, index=True)
    
    amount = Column(Float, nullable=False)
    payment_method = Column(Enum(PaymentMethod), nullable=False)
    
    paid_at = Column(DateTime(timezone=True), nullable=False)
    received_by = Column(String, nullable=False)
    receipt_generated = Column(Boolean, default=False)
    notes = Column(String, nullable=True)
    
    # For cash payments
    amount_tendered = Column(Float, nullable=True)
    change = Column(Float, nullable=True)


class InsuranceClaim(Base):
    __tablename__ = "insurance_claims"
    
    claim_id = Column(String, primary_key=True, index=True)  # CLM-YYYYMMDD-XXX
    order_id = Column(String, ForeignKey("orders.order_id"), nullable=False, index=True)
    invoice_id = Column(String, ForeignKey("invoices.invoice_id"), nullable=False, index=True)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False, index=True)
    
    insurance_provider = Column(String, nullable=False)
    insurance_number = Column(String, nullable=False)
    
    claim_amount = Column(Float, nullable=False)
    approved_amount = Column(Float, nullable=True)
    
    claim_status = Column(Enum(ClaimStatus), nullable=False, default=ClaimStatus.SUBMITTED)
    
    submitted_date = Column(DateTime(timezone=True), nullable=False)
    processed_date = Column(DateTime(timezone=True), nullable=True)
    
    denial_reason = Column(String, nullable=True)
    notes = Column(String, nullable=True)
