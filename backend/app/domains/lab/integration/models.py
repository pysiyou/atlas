"""Idempotency keys for analyzer REST ingest (correlation id)."""

from __future__ import annotations

from datetime import UTC, datetime

from app.platform.database import Base
from sqlalchemy import Column, DateTime, Integer, String


class AnalyzerIngestDedup(Base):
    __tablename__ = "analyzer_ingest_dedup"

    idempotency_key = Column(String(255), primary_key=True)
    order_test_id = Column(Integer, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC))
