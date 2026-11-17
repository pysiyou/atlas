"""Junction: orderable test comprises 1..N analytes."""
from __future__ import annotations

from app.platform.database import Base
from sqlalchemy import Column, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship


class OrderableTestAnalyte(Base):
    __tablename__ = "orderable_test_analytes"
    __table_args__ = (UniqueConstraint("test_code", "analyte_code", name="uq_orderable_test_analyte"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    testCode = Column("test_code", String, ForeignKey("orderable_tests.code", ondelete="CASCADE"), nullable=False)
    analyteCode = Column(
        "analyte_code",
        String,
        ForeignKey("catalog_analytes.code", ondelete="CASCADE"),
        nullable=False,
    )
    sortOrder = Column("sort_order", Integer, nullable=False, default=0)

    test = relationship("OrderableTest", back_populates="analyteLinks")
    analyte = relationship("CatalogAnalyte")