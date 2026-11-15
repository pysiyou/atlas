"""Daily sequential accession numbers (YYMMDD-NNNN) assigned at sample create."""
from __future__ import annotations

from datetime import UTC, datetime

from app.domains.lab.models.accession_counter import AccessionCounter
from app.domains.lab.models.sample import Sample
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session


def assign_accession_number(db: Session, sample: Sample) -> str:
    """
    Allocate the next accession for the current UTC day and store it on the sample.

    Uses INSERT … ON CONFLICT DO NOTHING then SELECT FOR UPDATE so concurrent
    creators on a new day cannot insert duplicate counter rows.
    """
    if sample.accessionNumber:
        return sample.accessionNumber

    day = datetime.now(UTC).date()
    db.execute(
        insert(AccessionCounter)
        .values(day=day, lastSeq=0)
        .on_conflict_do_nothing(index_elements=["day"])
    )
    db.flush()
    counter = db.query(AccessionCounter).filter(AccessionCounter.day == day).with_for_update().one()
    counter.lastSeq = int(counter.lastSeq or 0) + 1
    accession = f"{day.strftime('%y%m%d')}-{counter.lastSeq:04d}"
    sample.accessionNumber = accession
    return accession
