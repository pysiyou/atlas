"""
Report Model
"""
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from app.database import Base


class Report(Base):
    __tablename__ = "reports"
    
    report_id = Column(String, primary_key=True, index=True)  # RPT-YYYYMMDD-XXX
    order_id = Column(String, ForeignKey("orders.order_id"), nullable=False, unique=True, index=True)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False, index=True)
    
    # Report generation
    generated_at = Column(DateTime(timezone=True), nullable=False)
    generated_by = Column(String, nullable=False)
    
    # PDF storage
    pdf_path = Column(String, nullable=True)  # Path to stored PDF file
    
    # Approval workflow
    approved = Column(Boolean, default=False)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    approved_by = Column(String, nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
