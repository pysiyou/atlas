"""Daily sequential counter for sample accession numbers."""
from app.platform.database import Base
from sqlalchemy import Column, Date, Integer


class AccessionCounter(Base):
    """One row per UTC day; ``last_seq`` is incremented under a row lock."""

    __tablename__ = "accession_counters"

    day = Column(Date, primary_key=True)
    lastSeq = Column("last_seq", Integer, nullable=False, default=0)
