"""
Audit event model — immutable event log for LIS operations (hybrid columns + JSONB).
"""
from sqlalchemy import Column, DateTime, Index, Integer, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.sql import func

from app.db.database import Base


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    eventId = Column("event_id", UUID(as_uuid=True), unique=True, nullable=False, index=True)
    eventType = Column("event_type", String(100), nullable=False)
    createdAt = Column(
        "created_at",
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    actorId = Column("actor_id", Integer, nullable=True, index=True)
    actorSnapshot = Column("actor_snapshot", JSONB, nullable=False)
    targetType = Column("target_type", String(50), nullable=False)
    targetId = Column("target_id", Integer, nullable=False, index=True)
    patientId = Column("patient_id", Integer, nullable=True, index=True)
    orderId = Column("order_id", Integer, nullable=True, index=True)
    testId = Column("test_id", Integer, nullable=True, index=True)
    changes = Column("changes", JSONB, nullable=True)
    eventMetadata = Column("metadata", JSONB, nullable=True)

    __table_args__ = (
        Index("ix_audit_events_created_at_desc", createdAt.desc()),
        Index(
            "ix_audit_events_event_type_pattern",
            eventType,
            postgresql_ops={"event_type": "varchar_pattern_ops"},
        ),
        Index("ix_audit_events_metadata_gin", eventMetadata, postgresql_using="gin"),
    )
