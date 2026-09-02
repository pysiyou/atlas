"""
Quality Issue Model — unified record of lab quality problems and remedies.
"""
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Text
from sqlalchemy.sql import func
from app.database import Base, contract_enum
from app.schemas.enums import QualityStage, QualityDomain, RemedyType


class QualityIssue(Base):
    __tablename__ = "quality_issues"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    orderId = Column("order_id", Integer, ForeignKey("orders.order_id"), nullable=False, index=True)
    orderTestId = Column("order_test_id", Integer, ForeignKey("order_tests.id", ondelete="SET NULL"), nullable=True, index=True)
    sampleId = Column("sample_id", Integer, ForeignKey("samples.sample_id", ondelete="SET NULL"), nullable=True, index=True)
    testCode = Column("test_code", String, nullable=True, index=True)

    stage = Column(contract_enum(QualityStage), nullable=False)
    domain = Column(contract_enum(QualityDomain), nullable=False)
    reason = Column(String, nullable=False)
    notes = Column(Text, nullable=True)
    remedy = Column(contract_enum(RemedyType), nullable=False)

    createdTestId = Column("created_test_id", Integer, nullable=True)
    createdSampleId = Column("created_sample_id", Integer, nullable=True)

    createdBy = Column("created_by", String, nullable=False)
    createdAt = Column("created_at", DateTime(timezone=True), server_default=func.now(), nullable=False)
