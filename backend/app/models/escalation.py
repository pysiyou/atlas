"""
EscalationTicket Model - Tracks LIS escalation events and supervisor resolutions.
"""
from sqlalchemy import Column, String, DateTime, JSON, Enum, ForeignKey, Integer, Text
from sqlalchemy.sql import func
from app.database import Base
from app.schemas.enums import (
    EscalationReasonCode,
    EscalationTicketStatus,
    EscalationSeverity,
    EscalationResolutionAction,
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
        Integer,
        ForeignKey("samples.sample_id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    reasonCode = Column(
        "reason_code",
        Enum(EscalationReasonCode),
        nullable=False,
        index=True,
    )
    status = Column(
        Enum(EscalationTicketStatus),
        nullable=False,
        default=EscalationTicketStatus.OPEN,
        index=True,
    )
    severity = Column(Enum(EscalationSeverity), nullable=False)
    ticketMetadata = Column("metadata", JSON, nullable=True)
    createdByUserId = Column("created_by_user_id", String(50), nullable=False)
    resolvedByUserId = Column("resolved_by_user_id", String(50), nullable=True)
    resolutionAction = Column(
        "resolution_action",
        Enum(EscalationResolutionAction),
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
