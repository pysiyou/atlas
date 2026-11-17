"""Create child aliquot tubes from a collected parent sample."""
from __future__ import annotations

from datetime import UTC, datetime

from app.domains.audit.service import AuditEmitter
from app.domains.lab.models.sample import Sample
from app.domains.lab.specimen.accession import assign_accession_number
from app.platform.utils import LabOperationError
from app.shared.contracts.enums import SampleStatus
from sqlalchemy.orm import Session


def create_aliquots(
    db: Session,
    *,
    parent_id: int,
    count: int,
    aliquot_volume: float,
    test_codes: list[str] | None,
    user_id: str,
    emitter: AuditEmitter | None = None,
) -> list[Sample]:
    """
    Split remaining parent volume into ``count`` child tubes.

    Children inherit container/priority and a subset of parent test codes.
    Parent remaining volume is decremented; children are COLLECTED copies when
    the parent is already collected.
    """
    parent = db.query(Sample).filter(Sample.sampleId == parent_id).first()
    if not parent:
        raise LabOperationError("Sample not found", status_code=404)
    if parent.status != SampleStatus.COLLECTED:
        raise LabOperationError(
            "Aliquots can only be created from a collected sample", status_code=400
        )
    remaining = float(parent.remainingVolume or 0)
    total_volume = count * aliquot_volume
    if total_volume - remaining > 1e-9:
        raise LabOperationError(
            f"Aliquot volume {total_volume} exceeds remaining volume {remaining}",
            status_code=400,
        )
    parent_codes = list(parent.testCodes or [])
    child_codes = list(test_codes) if test_codes else parent_codes
    unknown = [code for code in child_codes if code not in parent_codes]
    if unknown:
        raise LabOperationError(
            f"Aliquot test codes must be a subset of the parent: {', '.join(unknown)}",
            status_code=400,
        )
    if not child_codes:
        raise LabOperationError("Aliquot must include at least one test code", status_code=400)

    existing_indexes = [
        row.aliquotIndex or 0
        for row in db.query(Sample)
        .filter(Sample.parentSampleId == parent.sampleId, Sample.isAliquot.is_(True))
        .all()
    ]
    next_index = (max(existing_indexes) if existing_indexes else 0) + 1
    now = datetime.now(UTC)
    children: list[Sample] = []
    for offset in range(count):
        child = Sample(
            orderId=parent.orderId,
            sampleType=parent.sampleType,
            status=SampleStatus.COLLECTED,
            testCodes=list(child_codes),
            requiredVolume=aliquot_volume,
            priority=parent.priority,
            requiredContainerTypes=list(parent.requiredContainerTypes or []),
            requiredContainerColors=list(parent.requiredContainerColors or []),
            collectedAt=parent.collectedAt or now,
            collectedBy=str(user_id),
            collectedVolume=aliquot_volume,
            actualContainerType=parent.actualContainerType,
            actualContainerColor=parent.actualContainerColor,
            remainingVolume=aliquot_volume,
            isAliquot=True,
            parentSampleId=parent.sampleId,
            aliquotIndex=next_index + offset,
            aliquotVolume=aliquot_volume,
            isRecollection=False,
            recollectionAttempt=parent.recollectionAttempt or 1,
            createdBy=str(user_id),
            updatedBy=str(user_id),
        )
        db.add(child)
        db.flush()
        assign_accession_number(db, child, parent=parent)
        if emitter is not None:
            emitter.sample_aliquot_created(
                child.sampleId,
                parent.sampleId,
                parent.orderId,
                user_id,
                aliquot_index=child.aliquotIndex or 0,
            )
        children.append(child)

    parent.remainingVolume = remaining - total_volume
    parent.updatedBy = str(user_id)
    parent.updatedAt = now
    return children
