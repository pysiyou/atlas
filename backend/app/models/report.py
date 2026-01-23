"""
Report Model - All fields use camelCase
"""
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from app.database import Base


class Report(Base):
    __tablename__ = "reports"

    reportId = Column("report_id", Integer, primary_key=True, autoincrement=True, index=True)
    orderId = Column("order_id", Integer, ForeignKey("orders.order_id"), nullable=False, unique=True, index=True)
    patientId = Column("patient_id", Integer, ForeignKey("patients.id"), nullable=False, index=True)

    # Report generation
    generatedAt = Column("generated_at", DateTime(timezone=True), nullable=False)
    generatedBy = Column("generated_by", String, nullable=False)

    # PDF storage
    pdfPath = Column("pdf_path", String, nullable=True)  # Path to stored PDF file

    # Approval workflow
    approved = Column(Boolean, default=False)
    approvedAt = Column("approved_at", DateTime(timezone=True), nullable=True)
    approvedBy = Column("approved_by", String, nullable=True)

    # Metadata
    createdAt = Column("created_at", DateTime(timezone=True), server_default=func.now())
