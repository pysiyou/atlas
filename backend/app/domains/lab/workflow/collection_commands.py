"""Sample collection operations for lab workflow."""
from datetime import UTC, datetime

from app.domains.lab.models.sample import Sample
from app.domains.lab.rules.eligibility import assert_can_collect
from app.domains.lab.rules.state_machines import (
    SampleStateMachine,
    StateTransitionError,
    TestStateMachine,
)
from app.domains.orders.models import Order
from app.platform.utils.exceptions import LabOperationError
from app.shared.contracts.enums import SampleStatus, TestStatus


class CollectionCommandHandler:
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
        collection_notes: str | None = None,
    ) -> Sample:
        sample = self._svc._get_sample(sample_id, for_update=True)
        order = self.db.query(Order).filter(Order.orderId == sample.orderId).first()
        if not order:
            raise LabOperationError(f"Order {sample.orderId} not found", status_code=404)
        order_tests_all = self._svc._linked_order_tests(sample)
        assert_can_collect(sample, order, order_tests_all)
        order_tests = [
            ot
            for ot in order_tests_all
            if ot.status
            not in (
                TestStatus.SUPERSEDED,
                TestStatus.REMOVED,
                TestStatus.VALIDATED,
                TestStatus.CANCELLED,
            )
        ]
        before_state = self._svc._serialize_sample_state(sample)
        try:
            SampleStateMachine.validate_transition(sample.status, SampleStatus.COLLECTED)
        except StateTransitionError as e:
            raise LabOperationError(e.message, status_code=400, error_code="INVALID_TRANSITION")

        sample.status = SampleStatus.COLLECTED
        sample.collectedAt = datetime.now(UTC)
        sample.collectedBy = str(user_id)
        sample.collectedVolume = collected_volume
        sample.actualContainerType = container_type
        sample.actualContainerColor = container_color
        sample.collectionNotes = collection_notes
        sample.remainingVolume = collected_volume
        sample.updatedBy = str(user_id)

        for order_test in order_tests:
            if TestStateMachine.can_transition(order_test.status, TestStatus.SAMPLE_COLLECTED):
                order_test.status = TestStatus.SAMPLE_COLLECTED
                order_test.sampleId = sample_id
            elif order_test.status not in (
                TestStatus.SAMPLE_COLLECTED,
                TestStatus.RESULTED,
                TestStatus.ESCALATED,
            ):
                status_val = (
                    order_test.status.value if order_test.status else str(order_test.status)
                )
                raise LabOperationError(
                    f"Test {order_test.testCode} cannot be marked collected (status {status_val})",
                    status_code=400,
                    error_code="INVALID_TRANSITION",
                )

        after_state = self._svc._serialize_sample_state(sample)
        self._svc.emitter.sample_collected(
            sample_id,
            sample.orderId,
            user_id,
            before_state,
            after_state,
            metadata={"test_codes": sample.testCodes},
        )
        self._svc.recollection.mark_fulfilled_when_sample_collected(sample_id)
        return sample
