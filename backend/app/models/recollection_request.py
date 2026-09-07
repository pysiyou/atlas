"""
RecollectionRequest — supervisor-gated patient redraw workflow.
"""
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Text, JSON, Boolean
from sqlalchemy.sql import func

from app.database import Base, contract_enum
from app.schemas.enums import QualityStage, RecollectionRequestStatus


class RecollectionRequest(Base):
    __tablename__ = "recollection_requests"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    orderId = Column("order_id", Integer, ForeignKey("orders.order_id"), nullable=False, index=True)
    qualityIssueId = Column(
        "quality_issue_id",
        Integer,
        ForeignKey("quality_issues.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    rejectedSampleId = Column(
        "rejected_sample_id",
        Integer,
        ForeignKey("samples.sample_id", ondelete="SET NULL"),
        nullable=False,
        index=True,
    )
    orderTestId = Column(
        "order_test_id",
        Integer,
        ForeignKey("order_tests.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    stage = Column(contract_enum(QualityStage), nullable=False)
    status = Column(
        contract_enum(RecollectionRequestStatus),
        nullable=False,
        default=RecollectionRequestStatus.PENDING_APPROVAL,
        index=True,
    )
    reason = Column(String, nullable=False)
    notes = Column(Text, nullable=True)
    testCodes = Column("test_codes", JSON, nullable=False)
    affectedOrderTestIds = Column("affected_order_test_ids", JSON, nullable=False)
    recollectionAttemptsUsed = Column("recollection_attempts_used", Integer, nullable=False, default=0)
    recollectionAttemptsRemaining = Column("recollection_attempts_remaining", Integer, nullable=False, default=0)
    requiresSupervisorOverride = Column("requires_supervisor_override", Boolean, default=False)

    requestedByUserId = Column("requested_by_user_id", String(50), nullable=False)
    reviewedByUserId = Column("reviewed_by_user_id", String(50), nullable=True)
    reviewNotes = Column("review_notes", Text, nullable=True)
    reviewedAt = Column("reviewed_at", DateTime(timezone=True), nullable=True)

    createdSampleId = Column("created_sample_id", Integer, nullable=True)
    createdTestId = Column("created_test_id", Integer, nullable=True)

    createdAt = Column("created_at", DateTime(timezone=True), server_default=func.now(), nullable=False)
    updatedAt = Column(
        "updated_at",
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
