"""
Lab Rejection Handler

Result validation rejection: one reject action — backend decides re-test vs escalation.
"""
from __future__ import annotations

import copy
from datetime import datetime, timezone
from typing import Tuple, List, Optional, Callable

from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from pydantic import BaseModel

from app.models.sample import Sample
from app.models.order import OrderTest
from app.schemas.enums import TestStatus, RejectionAction, EscalationReasonCode
from app.services.state_machine import SampleStateMachine, TestStateMachine
from app.services.audit_service import AuditService
from app.services.escalation_engine import EscalationEngine
from app.services.rejection_criteria_service import RejectionCriteriaService
from app.utils.exceptions import LabOperationError
from app.services.lab_constants import MAX_RETEST_ATTEMPTS


class AvailableAction(BaseModel):
    action: RejectionAction
    enabled: bool
    disabledReason: Optional[str] = None
    label: str
    description: str


class RejectionOptions(BaseModel):
    canRetest: bool
    retestAttemptsRemaining: int
    canRecollect: bool
    recollectionAttemptsRemaining: int
    availableActions: List[AvailableAction]
    escalationRequired: bool = False
    allowedRejectionCriteria: List[str] = []


class RejectionResult(BaseModel):
    success: bool
    action: RejectionAction
    message: str
    originalTestId: int
    newTestId: Optional[int] = None
    newSampleId: Optional[int] = None
    escalationRequired: bool = False


RejectAndRecollectFn = Callable[
    [int, int, str, Optional[str], Optional[str]],
    Tuple[Sample, Sample],
]


class LabRejectionHandler:
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

    def _get_resulted_test(self, order_id: int, test_code: str) -> OrderTest:
        order_test = (
            self.db.query(OrderTest)
            .filter(
                OrderTest.orderId == order_id,
                OrderTest.testCode == test_code,
                OrderTest.status == TestStatus.RESULTED,
            )
            .order_by(OrderTest.updatedAt.desc(), OrderTest.id.desc())
            .first()
        )
        if not order_test:
            raise LabOperationError(
                f"Test {test_code} not found in order {order_id} with status 'resulted'",
                status_code=404,
            )
        return order_test

    @staticmethod
    def _rejection_count(order_test: OrderTest) -> int:
        return len(order_test.resultRejectionHistory or [])

    @staticmethod
    def _will_escalate_on_next_reject(order_test: OrderTest) -> bool:
        """MAX_RETEST_ATTEMPTS = total validation rejections allowed before escalation."""
        return LabRejectionHandler._rejection_count(order_test) + 1 >= MAX_RETEST_ATTEMPTS

    def get_rejection_options(self, order_id: int, test_code: str) -> RejectionOptions:
        order_test = self._get_resulted_test(order_id, test_code)
        prior = self._rejection_count(order_test)
        will_escalate = self._will_escalate_on_next_reject(order_test)
        criteria = RejectionCriteriaService(self.db).get_criteria_for_test(test_code)

        return RejectionOptions(
            canRetest=not will_escalate,
            retestAttemptsRemaining=max(0, MAX_RETEST_ATTEMPTS - prior - 1),
            canRecollect=False,
            recollectionAttemptsRemaining=0,
            escalationRequired=will_escalate,
            allowedRejectionCriteria=criteria,
            availableActions=[
                AvailableAction(
                    action=RejectionAction.RETEST_SAME_SAMPLE,
                    enabled=not will_escalate,
                    disabledReason=(
                        f"Rejection limit ({MAX_RETEST_ATTEMPTS}) reached — next reject escalates"
                        if will_escalate
                        else None
                    ),
                    label="Try Again with This Sample",
                    description="Run the test again using the existing sample",
                ),
            ],
        )

    def reject_validated_result(
        self,
        order_id: int,
        test_code: str,
        user_id: int,
        rejection_reason: str,
        rejection_notes: Optional[str] = None,
    ) -> RejectionResult:
        """
        Reject a resulted test. First rejection(s) schedule a re-test; at the limit,
        escalation starts automatically (supervisor queue).
        """
        RejectionCriteriaService(self.db).validate_for_test(test_code, rejection_reason)
        order_test = self._get_resulted_test(order_id, test_code)
        escalate = self._will_escalate_on_next_reject(order_test)

        history = list(order_test.resultRejectionHistory or [])
        history.append({
            "rejectedAt": datetime.now(timezone.utc).isoformat(),
            "rejectedBy": str(user_id),
            "rejectionReason": rejection_reason,
            "rejectionNotes": rejection_notes,
            "rejectionType": "escalate" if escalate else "re-test",
        })
        order_test.resultRejectionHistory = history
        flag_modified(order_test, "resultRejectionHistory")

        if escalate:
            return self._escalate(order_test, order_id, test_code, user_id, rejection_reason, rejection_notes)
        return self._schedule_retest(order_test, order_id, test_code, user_id, rejection_reason, rejection_notes, history)

    def _schedule_retest(
        self,
        order_test: OrderTest,
        order_id: int,
        test_code: str,
        user_id: int,
        rejection_reason: str,
        rejection_notes: Optional[str],
        history: list,
    ) -> RejectionResult:
        current_retest_number = order_test.retestNumber or 0
        next_retest_number = current_retest_number + 1

        order_test.resultValidatedAt = datetime.now(timezone.utc)
        order_test.validatedBy = str(user_id)
        order_test.validationNotes = (
            rejection_reason if not rejection_notes else f"{rejection_reason} — {rejection_notes}"
        )

        new_test = OrderTest(
            orderId=order_id,
            testCode=test_code,
            status=TestStatus.SAMPLE_COLLECTED,
            priceAtOrder=order_test.priceAtOrder,
            sampleId=order_test.sampleId,
            isRetest=True,
            retestOfTestId=order_test.id,
            retestNumber=next_retest_number,
            resultRejectionHistory=copy.deepcopy(history),
            technicianNotes=f"Re-test #{next_retest_number}: {rejection_reason}"
            + (f" — {rejection_notes}" if rejection_notes else ""),
            flags=order_test.flags,
            isReflexTest=order_test.isReflexTest,
            triggeredBy=order_test.triggeredBy,
            reflexRule=order_test.reflexRule,
        )
        self.db.add(new_test)
        self.db.flush()

        order_test.retestOrderTestId = new_test.id
        order_test.status = TestStatus.SUPERSEDED

        self.audit.log_result_validation_reject_retest(
            order_id=order_id,
            test_code=test_code,
            original_test_id=order_test.id,
            new_test_id=new_test.id,
            user_id=user_id,
            rejection_reason=rejection_reason,
            retest_number=next_retest_number,
        )

        self.db.commit()
        self.db.refresh(new_test)
        self._update_order_status(self.db, order_id)

        return RejectionResult(
            success=True,
            action=RejectionAction.RETEST_SAME_SAMPLE,
            message="Re-test scheduled on the same sample.",
            originalTestId=order_test.id,
            newTestId=new_test.id,
        )

    def _escalate(
        self,
        order_test: OrderTest,
        order_id: int,
        test_code: str,
        user_id: int,
        rejection_reason: str,
        rejection_notes: Optional[str],
    ) -> RejectionResult:
        TestStateMachine.validate_transition(TestStatus.RESULTED, TestStatus.ESCALATED)

        engine = EscalationEngine(self.db, self.audit)
        engine.escalate_test(
            order_test,
            EscalationReasonCode.LIMIT_HIT,
            user_id,
            metadata={
                "rejectionReason": rejection_reason,
                "rejectionNotes": rejection_notes,
                "retestNumber": order_test.retestNumber or 0,
                "rejectionCount": len(order_test.resultRejectionHistory or []),
            },
            from_status=TestStatus.RESULTED,
        )

        self.db.commit()
        self.db.refresh(order_test)
        self._update_order_status(self.db, order_id)

        return RejectionResult(
            success=True,
            action=RejectionAction.ESCALATE_TO_SUPERVISOR,
            message="Rejection limit reached. Test escalated to supervisor.",
            originalTestId=order_test.id,
            escalationRequired=True,
        )

    def reject_with_recollect(
        self,
        order_id: int,
        test_code: str,
        user_id: int,
        rejection_reason: str,
    ) -> RejectionResult:
        original_test = self._get_resulted_test(order_id, test_code)

        if not original_test.sampleId:
            raise LabOperationError("Cannot request recollection - no sample linked to this test")

        sample = self._get_sample(original_test.sampleId)
        can_reject, reason = SampleStateMachine.can_reject(sample.status)
        if not can_reject:
            raise LabOperationError(reason)

        history = list(original_test.resultRejectionHistory or [])
        history.append({
            "rejectedAt": datetime.now(timezone.utc).isoformat(),
            "rejectedBy": str(user_id),
            "rejectionReason": rejection_reason,
            "rejectionType": "re-collect",
        })
        original_test.resultRejectionHistory = history
        flag_modified(original_test, "resultRejectionHistory")

        original_test.resultValidatedAt = datetime.now(timezone.utc)
        original_test.validatedBy = str(user_id)
        original_test.validationNotes = rejection_reason

        rejection_notes = f"Rejected during result validation: {rejection_reason}"
        rejected_sample, new_sample = self._reject_and_recollect(
            sample.sampleId,
            user_id,
            rejection_reason,
            rejection_notes,
            rejection_reason,
        )

        self.audit.log_result_validation_reject_recollect(
            order_id=order_id,
            test_code=test_code,
            test_id=original_test.id,
            sample_id=sample.sampleId,
            new_sample_id=new_sample.sampleId,
            user_id=user_id,
            rejection_reason=rejection_reason,
            recollection_attempt=new_sample.recollectionAttempt,
        )

        self.db.commit()
        self.db.refresh(original_test)

        return RejectionResult(
            success=True,
            action=RejectionAction.RECOLLECT_NEW_SAMPLE,
            message=f"Sample rejected and recollection requested. New sample ID: {new_sample.sampleId}",
            originalTestId=original_test.id,
            newSampleId=new_sample.sampleId,
        )
