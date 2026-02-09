"""
Lab Rejection Handler

Encapsulates result rejection options and actions (retest, escalate, recollect).
Used by LabOperationsService to keep lab_operations.py focused on orchestration.
"""
from datetime import datetime, timezone
from typing import Tuple, List, Optional, Callable

from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from pydantic import BaseModel

from app.models.sample import Sample
from app.models.order import OrderTest
from app.schemas.enums import TestStatus, RejectionAction
from app.services.state_machine import SampleStateMachine, TestStateMachine
from app.services.audit_service import AuditService
from app.utils.exceptions import LabOperationError

MAX_RETEST_ATTEMPTS = 3
MAX_RECOLLECTION_ATTEMPTS = 3


class AvailableAction(BaseModel):
    """Represents an available rejection action"""
    action: RejectionAction
    enabled: bool
    disabledReason: Optional[str] = None
    label: str
    description: str


class RejectionOptions(BaseModel):
    """Response for rejection options query"""
    canRetest: bool
    retestAttemptsRemaining: int
    canRecollect: bool
    recollectionAttemptsRemaining: int
    availableActions: List[AvailableAction]
    escalationRequired: bool = False


class RejectionResult(BaseModel):
    """Result of a rejection operation"""
    success: bool
    action: RejectionAction
    message: str
    originalTestId: int
    newTestId: Optional[int] = None
    newSampleId: Optional[int] = None
    escalationRequired: bool = False


RejectAndRecollectFn = Callable[
    [int, int, List[str], Optional[str], Optional[str]],
    Tuple[Sample, Sample]
]


class LabRejectionHandler:
    """
    Handles result rejection options and actions.
    Requires update_order_status and reject_and_recollect from LabOperationsService.
    """

    def __init__(
        self,
        db: Session,
        audit: AuditService,
        update_order_status_fn: Callable[[Session, int], None],
        reject_and_recollect_fn: RejectAndRecollectFn,
    ):
        self.db = db
        self.audit = audit
        self._update_order_status = update_order_status_fn
        self._reject_and_recollect = reject_and_recollect_fn

    def _get_sample(self, sample_id: int) -> Sample:
        sample = self.db.query(Sample).filter(Sample.sampleId == sample_id).first()
        if not sample:
            raise LabOperationError(f"Sample {sample_id} not found", status_code=404)
        return sample

    def _get_order_test(
        self,
        order_id: int,
        test_code: str,
        status: Optional[TestStatus] = None
    ) -> OrderTest:
        query = self.db.query(OrderTest).filter(
            OrderTest.orderId == order_id,
            OrderTest.testCode == test_code
        )
        if status:
            query = query.filter(OrderTest.status == status)
        order_test = query.first()
        if not order_test:
            status_msg = f" with status '{status.value}'" if status else ""
            raise LabOperationError(
                f"Test {test_code} not found in order {order_id}{status_msg}",
                status_code=404
            )
        return order_test

    def get_rejection_options(self, order_id: int, test_code: str) -> RejectionOptions:
        order_test = self._get_order_test(order_id, test_code, status=TestStatus.RESULTED)
        sample = self._get_sample(order_test.sampleId) if order_test.sampleId else None

        current_retest_number = order_test.retestNumber or 0
        can_retest = current_retest_number < MAX_RETEST_ATTEMPTS
        retest_attempts_remaining = MAX_RETEST_ATTEMPTS - current_retest_number

        recollection_attempt = sample.recollectionAttempt if sample else 1
        can_recollect = recollection_attempt <= MAX_RECOLLECTION_ATTEMPTS if sample else False
        recollection_attempts_remaining = (
            MAX_RECOLLECTION_ATTEMPTS - (recollection_attempt - 1) if sample else 0
        )

        available_actions = [
            AvailableAction(
                action=RejectionAction.RETEST_SAME_SAMPLE,
                enabled=can_retest,
                disabledReason=f"Maximum {MAX_RETEST_ATTEMPTS} retest attempts reached" if not can_retest else None,
                label="Re-test (Same Sample)",
                description="Run the test again using the existing sample"
            ),
            AvailableAction(
                action=RejectionAction.RECOLLECT_NEW_SAMPLE,
                enabled=can_recollect,
                disabledReason=f"Maximum {MAX_RECOLLECTION_ATTEMPTS} recollection attempts reached" if not can_recollect else None,
                label="Request New Sample",
                description="Reject the current sample and request a new collection"
            ),
        ]
        escalation_required = not can_retest and not can_recollect
        if escalation_required:
            available_actions.append(
                AvailableAction(
                    action=RejectionAction.ESCALATE_TO_SUPERVISOR,
                    enabled=True,
                    label="Escalate to Supervisor",
                    description="All rejection options exhausted. Please escalate."
                )
            )

        return RejectionOptions(
            canRetest=can_retest,
            retestAttemptsRemaining=retest_attempts_remaining,
            canRecollect=can_recollect,
            recollectionAttemptsRemaining=recollection_attempts_remaining,
            availableActions=available_actions,
            escalationRequired=escalation_required
        )

    def reject_with_retest(
        self,
        order_id: int,
        test_code: str,
        user_id: int,
        rejection_reason: str
    ) -> RejectionResult:
        original_test = self._get_order_test(order_id, test_code, status=TestStatus.RESULTED)
        current_retest_number = original_test.retestNumber or 0

        rejection_record = {
            "rejectedAt": datetime.now(timezone.utc).isoformat(),
            "rejectedBy": str(user_id),
            "rejectionReason": rejection_reason,
            "rejectionType": "re-test"
        }
        if original_test.resultRejectionHistory is None:
            original_test.resultRejectionHistory = []
        original_test.resultRejectionHistory.append(rejection_record)
        flag_modified(original_test, 'resultRejectionHistory')

        original_test.resultValidatedAt = datetime.now(timezone.utc)
        original_test.validatedBy = str(user_id)
        original_test.validationNotes = rejection_reason

        new_order_test = OrderTest(
            orderId=order_id,
            testCode=test_code,
            status=TestStatus.SAMPLE_COLLECTED,
            priceAtOrder=original_test.priceAtOrder,
            sampleId=original_test.sampleId,
            isRetest=True,
            retestOfTestId=original_test.id,
            retestNumber=current_retest_number + 1,
            resultRejectionHistory=original_test.resultRejectionHistory,
            technicianNotes=f"Re-test #{current_retest_number + 1}: {rejection_reason}",
            flags=original_test.flags,
            isReflexTest=original_test.isReflexTest,
            triggeredBy=original_test.triggeredBy,
            reflexRule=original_test.reflexRule
        )
        self.db.add(new_order_test)
        self.db.flush()

        original_test.retestOrderTestId = new_order_test.id
        original_test.status = TestStatus.SUPERSEDED

        self.audit.log_result_validation_reject_retest(
            order_id=order_id,
            test_code=test_code,
            original_test_id=original_test.id,
            new_test_id=new_order_test.id,
            user_id=user_id,
            rejection_reason=rejection_reason,
            retest_number=current_retest_number + 1
        )

        self.db.commit()
        self.db.refresh(new_order_test)
        self._update_order_status(self.db, order_id)

        return RejectionResult(
            success=True,
            action=RejectionAction.RETEST_SAME_SAMPLE,
            message="Retest created successfully. Test is ready for new result entry.",
            originalTestId=original_test.id,
            newTestId=new_order_test.id
        )

    def reject_with_escalate(
        self,
        order_id: int,
        test_code: str,
        user_id: int,
        rejection_reason: str
    ) -> RejectionResult:
        original_test = self._get_order_test(order_id, test_code, status=TestStatus.RESULTED)
        TestStateMachine.validate_transition(TestStatus.RESULTED, TestStatus.ESCALATED)

        rejection_record = {
            "rejectedAt": datetime.now(timezone.utc).isoformat(),
            "rejectedBy": str(user_id),
            "rejectionReason": rejection_reason,
            "rejectionType": "escalate"
        }
        if original_test.resultRejectionHistory is None:
            original_test.resultRejectionHistory = []
        original_test.resultRejectionHistory.append(rejection_record)
        flag_modified(original_test, 'resultRejectionHistory')

        original_test.status = TestStatus.ESCALATED

        self.audit.log_result_validation_escalate(
            order_id=order_id,
            test_code=test_code,
            order_test_id=original_test.id,
            user_id=user_id,
            rejection_reason=rejection_reason
        )

        self.db.commit()
        self.db.refresh(original_test)
        self._update_order_status(self.db, order_id)

        return RejectionResult(
            success=True,
            action=RejectionAction.ESCALATE_TO_SUPERVISOR,
            message="Escalation recorded. Please contact your supervisor.",
            originalTestId=original_test.id,
            escalationRequired=True
        )

    def reject_with_recollect(
        self,
        order_id: int,
        test_code: str,
        user_id: int,
        rejection_reason: str
    ) -> RejectionResult:
        original_test = self._get_order_test(order_id, test_code, status=TestStatus.RESULTED)

        if not original_test.sampleId:
            raise LabOperationError("Cannot request recollection - no sample linked to this test")

        sample = self._get_sample(original_test.sampleId)
        can_reject, reason = SampleStateMachine.can_reject(sample.status)
        if not can_reject:
            raise LabOperationError(reason)

        rejection_record = {
            "rejectedAt": datetime.now(timezone.utc).isoformat(),
            "rejectedBy": str(user_id),
            "rejectionReason": rejection_reason,
            "rejectionType": "re-collect"
        }
        if original_test.resultRejectionHistory is None:
            original_test.resultRejectionHistory = []
        original_test.resultRejectionHistory.append(rejection_record)
        flag_modified(original_test, 'resultRejectionHistory')

        original_test.resultValidatedAt = datetime.now(timezone.utc)
        original_test.validatedBy = str(user_id)
        original_test.validationNotes = rejection_reason

        rejection_notes = f"Rejected during result validation: {rejection_reason}"
        rejected_sample, new_sample = self._reject_and_recollect(
            sample.sampleId,
            user_id,
            ["other"],
            rejection_notes,
            rejection_reason
        )

        self.audit.log_result_validation_reject_recollect(
            order_id=order_id,
            test_code=test_code,
            test_id=original_test.id,
            sample_id=sample.sampleId,
            new_sample_id=new_sample.sampleId,
            user_id=user_id,
            rejection_reason=rejection_reason,
            recollection_attempt=new_sample.recollectionAttempt
        )

        self.db.commit()
        self.db.refresh(original_test)

        return RejectionResult(
            success=True,
            action=RejectionAction.RECOLLECT_NEW_SAMPLE,
            message=f"Sample rejected and recollection requested. New sample ID: {new_sample.sampleId}",
            originalTestId=original_test.id,
            newSampleId=new_sample.sampleId
        )
