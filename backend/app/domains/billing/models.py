"""
Billing Models - Invoice, Payment - All fields use camelCase
"""
from app.platform.database import Base, contract_enum
from app.shared.contracts.enums import PaymentMethod, PaymentStatus
from sqlalchemy import JSON, Boolean, Column, DateTime, Float, ForeignKey, Integer, String, text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func


class Invoice(Base):
    __tablename__ = "invoices"

    invoiceId = Column("invoice_id", String(12), primary_key=True, index=True)
    orderId = Column("order_id", String(13), ForeignKey("orders.order_id"), nullable=False, index=True)
    patientId = Column("patient_id", String(8), ForeignKey("patients.id"), nullable=False, index=True)
    patientName = Column("patient_name", String, nullable=False)

    # Items (JSON array)
    items = Column(
        JSON, nullable=False
    )  # Array of {testCode, testName, quantity, unitPrice, totalPrice}

    # Amounts
    subtotal = Column(Float, nullable=False)
    discount = Column(Float, default=0.0)
    tax = Column(Float, default=0.0)
    total = Column(Float, nullable=False)

    # Payment tracking
    paymentStatus = Column(
        "payment_status", contract_enum(PaymentStatus), nullable=False, default=PaymentStatus.UNPAID
    )
    amountPaid = Column("amount_paid", Float, default=0.0)
    amountDue = Column("amount_due", Float, nullable=False)

    # Dates
    createdAt = Column("created_at", DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(
        "updated_at", DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    dueDate = Column("due_date", DateTime(timezone=True), nullable=True)


class Payment(Base):
    __tablename__ = "payments"

    paymentId = Column("payment_id", String(8), primary_key=True, index=True)
    orderId = Column("order_id", String(13), ForeignKey("orders.order_id"), nullable=False, index=True)
    invoiceId = Column(
        "invoice_id", String(12), ForeignKey("invoices.invoice_id"), nullable=True, index=True
    )

    amount = Column(Float, nullable=False)
    paymentMethod = Column("payment_method", contract_enum(PaymentMethod), nullable=False)

    paidAt = Column("paid_at", DateTime(timezone=True), nullable=False)
    createdBy = Column("created_by", String, nullable=False)
    receiptGenerated = Column(
        "receipt_generated", Boolean, default=False, server_default=text("false")
    )
    notes = Column(String, nullable=True)
    createdAt = Column("created_at", DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(
        "updated_at", DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationship for eager loading
    order = relationship("Order", back_populates="payments", foreign_keys=[orderId])
