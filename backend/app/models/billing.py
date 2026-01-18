"""
Billing Models - Invoice, Payment, InsuranceClaim - All fields use camelCase
"""
from sqlalchemy import Column, String, Float, DateTime, JSON, Enum, ForeignKey, Boolean
from sqlalchemy.sql import func
from app.database import Base
from app.schemas.enums import PaymentStatus, PaymentMethod, ClaimStatus


class Invoice(Base):
    __tablename__ = "invoices"

    invoiceId = Column(String, primary_key=True, index=True)  # INV-YYYYMMDD-XXX
    orderId = Column(String, ForeignKey("orders.orderId"), nullable=False, index=True)
    patientId = Column(String, ForeignKey("patients.id"), nullable=False, index=True)
    patientName = Column(String, nullable=False)

    # Items (JSON array)
    items = Column(JSON, nullable=False)  # Array of {testCode, testName, quantity, unitPrice, totalPrice}

    # Amounts
    subtotal = Column(Float, nullable=False)
    discount = Column(Float, default=0.0)
    tax = Column(Float, default=0.0)
    total = Column(Float, nullable=False)

    # Payment tracking
    paymentStatus = Column(Enum(PaymentStatus), nullable=False, default=PaymentStatus.PENDING)
    amountPaid = Column(Float, default=0.0)
    amountDue = Column(Float, nullable=False)

    # Dates
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    dueDate = Column(DateTime(timezone=True), nullable=True)


class Payment(Base):
    __tablename__ = "payments"

    paymentId = Column(String, primary_key=True, index=True)  # PAY-YYYYMMDD-XXX
    orderId = Column(String, ForeignKey("orders.orderId"), nullable=False, index=True)
    invoiceId = Column(String, ForeignKey("invoices.invoiceId"), nullable=False, index=True)

    amount = Column(Float, nullable=False)
    paymentMethod = Column(Enum(PaymentMethod), nullable=False)

    paidAt = Column(DateTime(timezone=True), nullable=False)
    receivedBy = Column(String, nullable=False)
    receiptGenerated = Column(Boolean, default=False)
    notes = Column(String, nullable=True)

    # For cash payments
    amountTendered = Column(Float, nullable=True)
    change = Column(Float, nullable=True)


class InsuranceClaim(Base):
    __tablename__ = "insurance_claims"

    claimId = Column(String, primary_key=True, index=True)  # CLM-YYYYMMDD-XXX
    orderId = Column(String, ForeignKey("orders.orderId"), nullable=False, index=True)
    invoiceId = Column(String, ForeignKey("invoices.invoiceId"), nullable=False, index=True)
    patientId = Column(String, ForeignKey("patients.id"), nullable=False, index=True)

    insuranceProvider = Column(String, nullable=False)
    insuranceNumber = Column(String, nullable=False)

    claimAmount = Column(Float, nullable=False)
    approvedAmount = Column(Float, nullable=True)

    claimStatus = Column(Enum(ClaimStatus), nullable=False, default=ClaimStatus.SUBMITTED)

    submittedDate = Column(DateTime(timezone=True), nullable=False)
    processedDate = Column(DateTime(timezone=True), nullable=True)

    denialReason = Column(String, nullable=True)
    notes = Column(String, nullable=True)
