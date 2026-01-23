"""
Lab Audit Log Model - Tracks all laboratory operations for compliance and traceability.
"""
from sqlalchemy import Column, String, Integer, DateTime, JSON, Enum
from sqlalchemy.sql import func
from app.database import Base
from app.schemas.enums import LabOperationType


class LabOperationLog(Base):
    """
    Audit log for laboratory operations.
    Records all significant operations for compliance tracking.
    """
    __tablename__ = "lab_operation_logs"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    operationType = Column("operation_type", Enum(LabOperationType), nullable=False, index=True)
    entityType = Column("entity_type", String(20), nullable=False, index=True)  # 'sample', 'test', 'order'
    entityId = Column("entity_id", Integer, nullable=False, index=True)
    performedBy = Column("performed_by", String(50), nullable=False, index=True)
    performedAt = Column("performed_at", DateTime(timezone=True), server_default=func.now(), index=True)
    beforeState = Column("before_state", JSON, nullable=True)
    afterState = Column("after_state", JSON, nullable=True)
    operationData = Column("operation_data", JSON, nullable=True)  # Additional context-specific data
    createdAt = Column("created_at", DateTime(timezone=True), server_default=func.now())
