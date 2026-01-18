"""
Report Model - All fields use camelCase
"""
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from app.database import Base


class Report(Base):
    __tablename__ = "reports"

    reportId = Column(String, primary_key=True, index=True)  # RPT-YYYYMMDD-XXX
    orderId = Column(String, ForeignKey("orders.orderId"), nullable=False, unique=True, index=True)
    patientId = Column(String, ForeignKey("patients.id"), nullable=False, index=True)

    # Report generation
    generatedAt = Column(DateTime(timezone=True), nullable=False)
    generatedBy = Column(String, nullable=False)

    # PDF storage
    pdfPath = Column(String, nullable=True)  # Path to stored PDF file

    # Approval workflow
    approved = Column(Boolean, default=False)
    approvedAt = Column(DateTime(timezone=True), nullable=True)
    approvedBy = Column(String, nullable=True)

    # Metadata
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
