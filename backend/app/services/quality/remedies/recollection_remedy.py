"""
Recollection remedy - handles patient redraw requests.
"""
from datetime import datetime, timezone
from typing import Any, List, Optional

from sqlalchemy.orm import Session

from app.models.order import OrderTest
from app.models.sample import Sample
from app.schemas.enums import PriorityLevel, QualityStage, SampleStatus, TestStatus
from app.services.audit_service import AuditService
from app.services.sample_collection import SampleCollectionService
from app.services.state_machine import SampleStateMachine, TestStateMachine
from app.utils.exceptions import LabOperationError


_SAMPLE_RESET_STATUSES = {
    TestStatus.PENDING,
    TestStatus.SAMPLE_COLLECTED,
}


class RecollectionRemedy:
    """Handles request_recollection remedy - creates recollection requests."""
    
    def __init__(
        self,
        db: Session,
        audit: AuditService,
        collection: SampleCollectionService,
    ):
        self.db = db
        self.audit = audit
        self.collection = collection
        self.recollection_requests: Optional[Any] = None
    
    def reject_sample(
        self,
        sample: Sample,
        user_id: int,
        reason: str,
        notes: Optional[str],
        skip_test_ids: Optional[set[int]] = None,
        reset_unfinished: bool = True,
    ) -> None:
        """Mark sample rejected and optionally reset linked tests."""
        can_reject, reject_reason = SampleStateMachine.can_reject(sample.status)
        if not can_reject:
            raise LabOperationError(reject_reason, status_code=400)
        
        sample.status = SampleStatus.REJECTED
        sample.rejectedAt = datetime.now(timezone.utc)
        sample.rejectedBy = str(user_id)
        sample.rejectionReason = reason
        sample.rejectionNotes = notes
        sample.recollectionRequired = True
        sample.updatedBy = str(user_id)
        
        if reset_unfinished:
            self._reset_unfinished_tests(sample, skip_test_ids or set())
    
    def _reset_unfinished_tests(self, sample: Sample, skip_test_ids: set[int]) -> None:
        """Reset pending/sample-collected tests back to pending."""
        linked = self._get_linked_tests(sample)
        
        for order_test in linked:
            if order_test.id in skip_test_ids:
                continue
            if order_test.status in _SAMPLE_RESET_STATUSES:
                self._reset_test_for_rejection(order_test)
    
    def _reset_test_for_rejection(self, order_test: OrderTest) -> None:
        """Reset a test back to pending state."""
        if order_test.status not in _SAMPLE_RESET_STATUSES:
            return
        
        TestStateMachine.validate_transition(order_test.status, TestStatus.PENDING)
        order_test.status = TestStatus.PENDING
        self._clear_test_results(order_test)
    
    def _clear_test_results(self, order_test: OrderTest) -> None:
        """Clear all result data from a test."""
        order_test.results = None
        order_test.resultEnteredAt = None
        order_test.enteredBy = None
        order_test.technicianNotes = None
        order_test.resultValidatedAt = None
        order_test.validatedBy = None
        order_test.validationNotes = None
        order_test.flags = None
        order_test.hasCriticalValues = False
    
    def _get_linked_tests(
        self,
        sample: Sample,
        exclude: Optional[List[TestStatus]] = None
    ) -> List[OrderTest]:
        """Get tests linked to this sample."""
        from app.models.order import OrderTest
        
        query = self.db.query(OrderTest).filter(
            OrderTest.orderId == sample.orderId,
            OrderTest.testCode.in_(sample.testCodes),
            OrderTest.sampleId == sample.sampleId,
        )
        if exclude:
            query = query.filter(OrderTest.status.notin_(exclude))
        return query.all()
    
    def reattach_tests_to_new_sample(
        self,
        rejected_sample: Sample,
        new_sample: Sample
    ) -> None:
        """Reattach pending tests from rejected sample to new recollection sample."""
        for test in self._get_linked_tests(
            rejected_sample,
            exclude=[TestStatus.SUPERSEDED, TestStatus.REMOVED, TestStatus.CANCELLED],
        ):
            if test.status != TestStatus.PENDING:
                continue
            if test.sampleId != rejected_sample.sampleId:
                continue
            
            test.sampleId = new_sample.sampleId
            self._clear_test_results(test)
    
    def create_recollection_sample(
        self,
        rejected_sample: Sample,
        user_id: int,
        reason: str,
        test_codes: Optional[list[str]] = None,
        priority: Optional[PriorityLevel] = None,
        supervisor_authorized: bool = False,
    ) -> Sample:
        """Create a new recollection sample."""
        return self.collection.request_recollection(
            rejected_sample,
            user_id,
            reason,
            test_codes=test_codes,
            priority=priority,
            supervisor_authorized=supervisor_authorized,
        )
