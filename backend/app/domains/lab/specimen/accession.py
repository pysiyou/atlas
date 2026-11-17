"""Yearly sequential accession numbers (YY-NNNNN) assigned as the sample row id."""
from __future__ import annotations

from app.domains.lab.models.sample import Sample
from app.platform.utils import allocate_accession_number, format_aliquot_accession
from sqlalchemy.orm import Session


def assign_accession_number(db: Session, sample: Sample, parent: Sample | None = None) -> str:
    """
    Allocate the next yearly accession and store it as ``sample.sampleId``.

    Aliquots inherit ``{parentAccession}.{aliquotIndex}`` so the parent barcode
    remains the lineage key. Recollections and original tubes get a new yearly
    number. Idempotent when ``sampleId`` is already set.
    """
    if sample.sampleId:
        return sample.sampleId

    if sample.isAliquot:
        if parent is None or not parent.sampleId:
            raise ValueError("Aliquot requires a parent sample with an accession number")
        index = int(sample.aliquotIndex or 1)
        sample.sampleId = format_aliquot_accession(parent.sampleId, index)
        return sample.sampleId

    sample.sampleId = allocate_accession_number(db)
    return sample.sampleId
