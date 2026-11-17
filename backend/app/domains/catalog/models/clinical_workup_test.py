"""Junction: clinical workup groups orderable tests."""
from __future__ import annotations

from app.platform.database import Base
from sqlalchemy import Column, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship


class ClinicalWorkupTest(Base):
    __tablename__ = "clinical_workup_tests"
    __table_args__ = (UniqueConstraint("workup_code", "test_code", name="uq_clinical_workup_test"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    workupCode = Column(
        "workup_code",
        String,
        ForeignKey("clinical_workups.code", ondelete="CASCADE"),
        nullable=False,
    )
    testCode = Column(
        "test_code",
        String,
        ForeignKey("orderable_tests.code", ondelete="CASCADE"),
        nullable=False,
    )

    workup = relationship("ClinicalWorkup", back_populates="testLinks")
    test = relationship("OrderableTest")