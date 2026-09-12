"""Sample collection operations for lab workflow."""
from datetime import datetime, timezone
from typing import Optional

from app.models.sample import Sample
from app.schemas.enums import SampleStatus, TestStatus
from app.services.lab.state import SampleStateMachine, TestStateMachine, StateTransitionError
from app.services.orders.order import update_order_status
from app.utils.exceptions import LabOperationError


class CollectionOperations:
    def __init__(self, svc):
        self._svc = svc

    @property
    def db(self):
        return self._svc.db

    def collect_sample(
        self,
        sample_id: int,
        user_id: int,
        collected_volume: float,
        container_type: str,
        container_color: str,
        collection_notes: Optional[str] = None,
    ) -> Sample:
        sample = self._svc._get_sample(sample_id, for_update=True)
        self._svc._assert_order_paid_for_collection(sample.orderId)
        before_state = self._svc._serialize_sample_state(sample)

        try:
            SampleStateMachine.validate_transition(sample.status, SampleStatus.COLLECTED)
        except StateTransitionError as e:
            raise LabOperationError(e.message, status_code=400)

        sample.status = SampleStatus.COLLECTED
        sample.collectedAt = datetime.now(timezone.utc)
        sample.collectedBy = str(user_id)
        sample.collectedVolume = collected_volume
        sample.actualContainerType = container_type
        sample.actualContainerColor = container_color
        sample.collectionNotes = collection_notes
        sample.remainingVolume = collected_volume
        sample.updatedBy = str(user_id)

        order_tests = self._svc._linked_order_tests(
            sample,
            exclude_statuses=[TestStatus.SUPERSEDED, TestStatus.REMOVED, TestStatus.VALIDATED, TestStatus.CANCELLED],
        )
        for order_test in order_tests:
            # Validate state machine transition before forcing status change
            if TestStateMachine.can_transition(order_test.status, TestStatus.SAMPLE_COLLECTED):
                order_test.status = TestStatus.SAMPLE_COLLECTED
                order_test.sampleId = sample_id
            # else: Skip invalid transitions (log warning if needed in production)

        after_state = self._svc._serialize_sample_state(sample)
        self._svc.audit.log_sample_collection(
            sample_id=sample_id,
            user_id=user_id,
            before_state=before_state,
            after_state=after_state,
            metadata={"testCodes": sample.testCodes},
            comment=collection_notes,
        )

        self.db.commit()
        self._svc.recollection.mark_fulfilled_when_sample_collected(sample_id)
        self.db.commit()
        self.db.refresh(sample)
        update_order_status(self.db, sample.orderId)
        return sample

