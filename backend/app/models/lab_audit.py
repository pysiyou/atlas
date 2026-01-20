"""
Lab Audit Log Model - Tracks all laboratory operations for compliance and traceability.
"""
from sqlalchemy import Column, String, DateTime, JSON, Enum
from sqlalchemy.sql import func
from app.database import Base
from app.schemas.enums import LabOperationType


class LabOperationLog(Base):
    """
    Audit log for laboratory operations.
    Records all significant operations for compliance tracking.
    """
    __tablename__ = "lab_operation_logs"

    id = Column(String, primary_key=True, index=True)
    operationType = Column(Enum(LabOperationType), nullable=False, index=True)
    entityType = Column(String(20), nullable=False, index=True)  # 'sample', 'test', 'order'
    entityId = Column(String(50), nullable=False, index=True)
    performedBy = Column(String(50), nullable=False, index=True)
    performedAt = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    beforeState = Column(JSON, nullable=True)
    afterState = Column(JSON, nullable=True)
    operationData = Column(JSON, nullable=True)  # Additional context-specific data
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
