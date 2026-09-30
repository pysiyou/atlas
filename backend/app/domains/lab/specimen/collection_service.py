"""
Single entry point for pending sample creation and collection attempt numbering.

recollectionAttempt scale (matches UI 1..MAX_RECOLLECTION_ATTEMPTS):
  1 = initial collection tube
  2 = first recollection tube, etc.
"""
from __future__ import annotations

from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

from app.domains.lab.models.sample import Sample
from app.platform.utils.exceptions import LabOperationError
from app.shared.contracts.enums import PriorityLevel, SampleStatus, SampleType
from app.shared.contracts.lab_constants import MAX_RECOLLECTION_ATTEMPTS
from sqlalchemy.orm import Session

if TYPE_CHECKING:
    pass


class SampleCollectionService:
    def __init__(self, db: Session):
        self.db = db

    @staticmethod
    def next_collection_attempt(after_sample: Sample | None) -> int:
        if after_sample is None:
            return 1
        return (after_sample.recollectionAttempt or 1) + 1

    @staticmethod
    def attempts_used(sample: Sample) -> int:
        """Collection slots consumed on the 1..MAX scale (0 before first tube)."""
        return max(0, (sample.recollectionAttempt or 1) - 1)

    @staticmethod
    def attempts_remaining_after(sample: Sample) -> int:
        """How many more collection tubes may still be created after this sample."""
        return max(0, MAX_RECOLLECTION_ATTEMPTS - (sample.recollectionAttempt or 1))

    def can_request_recollection(self, source_sample: Sample) -> bool:
        return self.next_collection_attempt(source_sample) <= MAX_RECOLLECTION_ATTEMPTS

    def assert_can_request_recollection(self, source_sample: Sample) -> None:
        if not self.can_request_recollection(source_sample):
            raise LabOperationError(
                f"Maximum collection attempts ({MAX_RECOLLECTION_ATTEMPTS}) reached.",
                status_code=400,
            )

    def create_initial_pending_sample(
        self,
        *,
        order_id: int,
        sample_type: SampleType,
        test_codes: list[str],
        required_volume: float,
        priority: PriorityLevel,
        required_container_types: list[Any],
        required_container_colors: list[Any],
        created_by: int,
    ) -> Sample:
        """Create the first pending tube for a sample type (attempt 1)."""
        sample = Sample(
            orderId=order_id,
            sampleType=sample_type,
            status=SampleStatus.PENDING,
            testCodes=list(test_codes),
            requiredVolume=required_volume,
            priority=priority,
            requiredContainerTypes=list(required_container_types),
            requiredContainerColors=list(required_container_colors),
            isRecollection=False,
            recollectionAttempt=1,
            createdBy=str(created_by),
            updatedBy=str(created_by),
        )
        self.db.add(sample)
        self.db.flush()
        return sample

    def request_recollection(
        self,
        source_sample: Sample,
        user_id: int,
        reason: str,
        *,
        test_codes: list[str] | None = None,
        priority: PriorityLevel | None = None,
        supervisor_authorized: bool = False,
    ) -> Sample:
        """
        Create a pending recollection tube after rejection or supervisor authorization.
        Idempotent when a pending recollection already exists for the source sample.

        Automatic quality-issue flows enforce MAX_RECOLLECTION_ATTEMPTS. Supervisor escalation
        resolution (authorize_recollect) may pass supervisor_authorized=True to allow one more tube.
        """
        if source_sample.recollectionSampleId:
            existing = (
                self.db.query(Sample)
                .filter(Sample.sampleId == source_sample.recollectionSampleId)
                .first()
            )
            if (
                existing
                and existing.status == SampleStatus.PENDING
                and existing.collectedAt is None
            ):
                return existing
            if existing:
                raise LabOperationError(
                    f"Recollection sample {existing.sampleId} is not pending",
                    status_code=400,
                )

        if not supervisor_authorized:
            self.assert_can_request_recollection(source_sample)
        next_attempt = self.next_collection_attempt(source_sample)

        new_sample = Sample(
            orderId=source_sample.orderId,
            sampleType=source_sample.sampleType,
            status=SampleStatus.PENDING,
            testCodes=list(test_codes or source_sample.testCodes or []),
            requiredVolume=source_sample.requiredVolume,
            priority=priority or PriorityLevel.URGENT,
            requiredContainerTypes=source_sample.requiredContainerTypes,
            requiredContainerColors=source_sample.requiredContainerColors,
            isRecollection=True,
            originalSampleId=source_sample.sampleId,
            recollectionReason=reason,
            recollectionAttempt=next_attempt,
            createdAt=datetime.now(UTC),
            createdBy=str(user_id),
            updatedBy=str(user_id),
        )
        self.db.add(new_sample)
        self.db.flush()

        source_sample.recollectionSampleId = new_sample.sampleId
        source_sample.updatedBy = str(user_id)
        return new_sample


def _normalize_sample_type(sample_type: str | SampleType) -> SampleType:
    """Normalize Test.sampleType (string) to SampleType enum for comparison and assignment."""
    if isinstance(sample_type, SampleType):
        return sample_type
    # Catalog may store lowercase e.g. "blood"
    try:
        return SampleType(sample_type)
    except ValueError:
        return SampleType(sample_type.upper() if sample_type.isupper() else sample_type.lower())


def _sample_type_matches(sample: Sample, sample_type_key: str | SampleType) -> bool:
    """True if sample's type matches the key (string or enum)."""
    st = _normalize_sample_type(sample_type_key)
    return sample.sampleType == st
