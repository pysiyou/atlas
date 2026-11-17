"""Persisted issued lab-report PDF documents."""
from app.platform.database import Base
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.sql import func


class ReportDocument(Base):
    """One generated PDF per order (latest overwrite is allowed by path)."""

    __tablename__ = "report_documents"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    orderId = Column("order_id", String(13), ForeignKey("orders.order_id"), nullable=False, index=True)
    path = Column(String, nullable=False)
    sha256 = Column(String, nullable=False)
    createdAt = Column("created_at", DateTime(timezone=True), server_default=func.now())
    createdBy = Column("created_by", String, nullable=False)
