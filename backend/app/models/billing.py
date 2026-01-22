"""
Billing Models - Invoice, Payment, InsuranceClaim - All fields use camelCase
"""
from sqlalchemy import Column, String, Float, DateTime, JSON, Enum, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
from app.schemas.enums import PaymentStatus, PaymentMethod, ClaimStatus


class Invoice(Base):
    __tablename__ = "invoices"

    invoiceId = Column("invoice_id", String, primary_key=True, index=True)  # INV-YYYYMMDD-XXX
    orderId = Column("order_id", String, ForeignKey("orders.order_id"), nullable=False, index=True)
    patientId = Column("patient_id", String, ForeignKey("patients.id"), nullable=False, index=True)
    patientName = Column("patient_name", String, nullable=False)

    # Items (JSON array)
    items = Column(JSON, nullable=False)  # Array of {testCode, testName, quantity, unitPrice, totalPrice}

    # Amounts
    subtotal = Column(Float, nullable=False)
    discount = Column(Float, default=0.0)
    tax = Column(Float, default=0.0)
    total = Column(Float, nullable=False)

    # Payment tracking
    paymentStatus = Column("payment_status", Enum(PaymentStatus), nullable=False, default=PaymentStatus.UNPAID)
    amountPaid = Column("amount_paid", Float, default=0.0)
    amountDue = Column("amount_due", Float, nullable=False)

    # Dates
    createdAt = Column("created_at", DateTime(timezone=True), server_default=func.now())
    dueDate = Column("due_date", DateTime(timezone=True), nullable=True)


class Payment(Base):
    __tablename__ = "payments"

    paymentId = Column("payment_id", String, primary_key=True, index=True)  # PAY-YYYYMMDD-XXX
    orderId = Column("order_id", String, ForeignKey("orders.order_id"), nullable=False, index=True)
    invoiceId = Column("invoice_id", String, ForeignKey("invoices.invoice_id"), nullable=True, index=True)

    amount = Column(Float, nullable=False)
    paymentMethod = Column("payment_method", Enum(PaymentMethod), nullable=False)

    paidAt = Column("paid_at", DateTime(timezone=True), nullable=False)
    receivedBy = Column("received_by", String, nullable=False)
    receiptGenerated = Column("receipt_generated", Boolean, default=False)
    notes = Column(String, nullable=True)

    # Relationship for eager loading
    order = relationship("Order", foreign_keys=[orderId])


class InsuranceClaim(Base):
    __tablename__ = "insurance_claims"

    claimId = Column("claim_id", String, primary_key=True, index=True)  # CLM-YYYYMMDD-XXX
    orderId = Column("order_id", String, ForeignKey("orders.order_id"), nullable=False, index=True)
    invoiceId = Column("invoice_id", String, ForeignKey("invoices.invoice_id"), nullable=False, index=True)
    patientId = Column("patient_id", String, ForeignKey("patients.id"), nullable=False, index=True)

    insuranceProvider = Column("insurance_provider", String, nullable=False)
    insuranceNumber = Column("insurance_number", String, nullable=False)

    claimAmount = Column("claim_amount", Float, nullable=False)
    approvedAmount = Column("approved_amount", Float, nullable=True)

    claimStatus = Column("claim_status", Enum(ClaimStatus), nullable=False, default=ClaimStatus.SUBMITTED)

    submittedDate = Column("submitted_date", DateTime(timezone=True), nullable=False)
    processedDate = Column("processed_date", DateTime(timezone=True), nullable=True)

    denialReason = Column("denial_reason", String, nullable=True)
    notes = Column(String, nullable=True)
