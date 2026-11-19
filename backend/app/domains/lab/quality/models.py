"""Quality issue and escalation ticket ORM models."""
from __future__ import annotations

from app.platform.database import Base, contract_enum
from app.shared.generated.enums import (
    EscalationReasonCode,
    EscalationResolutionAction,
    EscalationSeverity,
    EscalationTicketStatus,
    QualityDomain,
    QualityStage,
    RemedyType,
)
from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func


class QualityIssue(Base):
    __tablename__ = "quality_issues"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    orderId = Column("order_id", String(13), ForeignKey("orders.order_id"), nullable=False, index=True)
    orderTestId = Column(
        "order_test_id",
        Integer,
        ForeignKey("order_tests.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    sampleId = Column(
        "sample_id",
        String(20),
        ForeignKey("samples.sample_id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    testCode = Column("test_code", String, nullable=True, index=True)

    stage = Column(contract_enum(QualityStage), nullable=False)
    domain = Column(contract_enum(QualityDomain), nullable=False)
    reason = Column(String, nullable=False)
    notes = Column(Text, nullable=True)
    remedy = Column(contract_enum(RemedyType), nullable=False)

    createdTestId = Column("created_test_id", Integer, nullable=True)
    createdSampleId = Column("created_sample_id", String(20), nullable=True)

    createdBy = Column("created_by", String, nullable=False)
    createdAt = Column(
        "created_at", DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class EscalationTicket(Base):
    __tablename__ = "escalation_tickets"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    orderTestId = Column(
        "order_test_id",
        Integer,
        ForeignKey("order_tests.id"),
        nullable=False,
        index=True,
    )
    sampleId = Column(
        "sample_id",
        String(20),
        ForeignKey("samples.sample_id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    reasonCode = Column(
        "reason_code",
        contract_enum(EscalationReasonCode),
        nullable=False,
        index=True,
    )
    status = Column(
        contract_enum(EscalationTicketStatus),
        nullable=False,
        default=EscalationTicketStatus.OPEN,
        index=True,
    )
    severity = Column(contract_enum(EscalationSeverity), nullable=False)
    ticketMetadata = Column("metadata", JSON, nullable=True)
    createdByUserId = Column("created_by_user_id", String(50), nullable=False)
    resolvedByUserId = Column("resolved_by_user_id", String(50), nullable=True)
    resolutionAction = Column(
        "resolution_action",
        contract_enum(EscalationResolutionAction),
        nullable=True,
    )
    resolutionNotes = Column("resolution_notes", Text, nullable=True)
    resolvedAt = Column("resolved_at", DateTime(timezone=True), nullable=True)
    createdAt = Column("created_at", DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(
        "updated_at",
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )