"""Clinical diagnostic workup / order set."""
from __future__ import annotations

from app.platform.database import Base
from sqlalchemy import Boolean, Column, DateTime, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func


class ClinicalWorkup(Base):
    __tablename__ = "clinical_workups"

    code = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    isActive = Column("is_active", Boolean, default=True, nullable=False)
    createdAt = Column("created_at", DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(
        "updated_at",
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    testLinks = relationship(
        "ClinicalWorkupTest",
        back_populates="workup",
        cascade="all, delete-orphan",
    )