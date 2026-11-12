"""Test-target quality issue commands (validation stage)."""

from __future__ import annotations

from typing import TYPE_CHECKING

from app.domains.lab.quality.rejection_criteria import RejectionCriteriaService
from app.domains.lab.rules.state_machines import SampleStateMachine, TestStateMachine
from app.domains.lab.schemas.lab import QualityIssueResult
from app.domains.orders.models import OrderTest
from app.platform.utils.common import is_specimen_rejection_reason
from app.platform.utils.exceptions import LabOperationError
from app.shared.contracts.enums import (
    EscalationReasonCode,
    QualityDomain,
    QualityStage,
    RemedyType,
    SampleStatus,
    TestStatus,
)
from app.shared.contracts.lab_contract import MAX_RETEST_ATTEMPTS

from .issue_options import count_retests_in_chain
from .remedy_support import SampleRejectionContext, validation_remedy_types

if TYPE_CHECKING:
    from .issues_service import QualityIssueService


class TestIssueCommands:
    def __init__(self, svc: QualityIssueService) -> None:
        self._svc = svc

    def report_test_issue(
        self,
        order_test_id: int,
        user_id: int,
        reason: str,
        notes: str | None,
        preferred_remedy: RemedyType | None,
    ) -> QualityIssueResult:
        order_test = (
            self._svc.db.query(OrderTest)
            .filter(OrderTest.id == order_test_id)
            .with_for_update()
            .first()
        )
        if not order_test:
            raise LabOperationError(f"Test {order_test_id} not found", status_code=404)
        if order_test.status != TestStatus.RESULTED:
            raise LabOperationError(
                "Only resulted tests can be reported at validation", status_code=400
            )

        RejectionCriteriaService(self._svc.db).validate_for_test(
            order_test.testCode, reason, context="validation"
        )

        if preferred_remedy is not None:
            if preferred_remedy not in validation_remedy_types():
                raise LabOperationError(
                    f"Invalid preferredRemedy '{preferred_remedy.value}'. "
                    "Validation rejection no longer accepts a remedy; supervisor approves on escalation.",
                    status_code=400,
                )
            raise LabOperationError(
                "preferredRemedy is not used for validation rejection. "
                "Reject with a reason only; retest, recollection, or cancel is chosen at escalation approval.",
                status_code=400,
            )

        criteria_service = RejectionCriteriaService(self._svc.db)
        matched = criteria_service.get_criterion_for_reason(
            [order_test.testCode], reason, context="validation"
        )
        is_specimen = (
            matched.domain == "specimen" if matched else is_specimen_rejection_reason(reason)
        )
        domain = QualityDomain.SPECIMEN if is_specimen else QualityDomain.ANALYTICAL

        return self._reject_validation_pending_supervisor(
            order_test, user_id, reason, notes, domain
        )

    def report_test_validation_issue(
        self,
        order_test_id: int,
        user_id: int,
        reason: str,
        notes: str | None,
        preferred_remedy: RemedyType | None = None,
    ) -> QualityIssueResult:
        """Public entry for validation rejection from workflow modules."""
        return self.report_test_issue(order_test_id, user_id, reason, notes, preferred_remedy)

    def _reject_validation_pending_supervisor(
        self,
        order_test: OrderTest,
        user_id: int,
        reason: str,
        notes: str | None,
        domain: QualityDomain,
    ) -> QualityIssueResult:
        validation_note = (notes or "").strip()
        order_test.validationNotes = (
            f"{validation_note} [Validation rejected: {reason}]".strip()
            if validation_note
            else f"Validation rejected: {reason}"
        )

        self._svc.escalation.escalate_test(
            order_test,
            EscalationReasonCode.VAL_REJ,
            user_id,
            metadata={
                "rejectionReason": reason,
                "rejectionNotes": notes,
                "validationDomain": domain.value,
            },
            from_status=TestStatus.RESULTED,
        )

        issue = self._svc.remedy.record_issue(
            order_id=order_test.orderId,
            stage=QualityStage.VALIDATION,
            domain=domain,
            reason=reason,
            notes=notes,
            remedy=RemedyType.ESCALATE,
            user_id=user_id,
            order_test_id=order_test.id,
            sample_id=order_test.sampleId,
            test_code=order_test.testCode,
            omit_remedy_from_validation_audit=True,
        )
        return QualityIssueResult(
            success=True,
            remedy=RemedyType.ESCALATE,
            message=(
                "Results rejected at validation. "
                "A supervisor will approve retest, recollection, or cancellation."
            ),
            qualityIssueId=issue.id,
            orderId=order_test.orderId,
            testCode=order_test.testCode,
            orderTestId=order_test.id,
            sampleId=order_test.sampleId,
            escalationRequired=True,
        )

    def cancel_test_issue(
        self,
        order_test: OrderTest,
        user_id: int,
        reason: str,
        notes: str | None,
        domain: QualityDomain,
    ) -> QualityIssueResult:
        TestStateMachine.validate_transition(order_test.status, TestStatus.CANCELLED)
        order_test.status = TestStatus.CANCELLED
        order_test.validationNotes = notes or f"Cancelled at validation: {reason}"

        self._svc.emitter.order_test_cancelled(
            order_test.orderId,
            order_test.id,
            order_test.testCode,
            user_id,
            reason=reason,
        )

        issue = self._svc.remedy.record_issue(
            order_id=order_test.orderId,
            stage=QualityStage.VALIDATION,
            domain=domain,
            reason=reason,
            notes=notes,
            remedy=RemedyType.CANCEL,
            user_id=user_id,
            order_test_id=order_test.id,
            sample_id=order_test.sampleId,
            test_code=order_test.testCode,
        )
        return QualityIssueResult(
            success=True,
            remedy=RemedyType.CANCEL,
            message="Test cancelled.",
            qualityIssueId=issue.id,
            orderId=order_test.orderId,
            testCode=order_test.testCode,
            orderTestId=order_test.id,
            sampleId=order_test.sampleId,
        )

    def retry_test_issue(
        self,
        order_test: OrderTest,
        user_id: int,
        reason: str,
        notes: str | None,
    ) -> QualityIssueResult:
        retest_used = count_retests_in_chain(self._svc.db, order_test)
        retest_remaining = max(0, MAX_RETEST_ATTEMPTS - retest_used - 1)
        if retest_remaining <= 0:
            return self._escalate_test_issue(
                order_test,
                user_id,
                reason,
                notes,
                QualityDomain.ANALYTICAL,
                message=(
                    f"Re-test limit reached ({MAX_RETEST_ATTEMPTS}). "
                    "Escalated to supervisor — force validate, authorize re-test, authorize re-collect, or cancel."
                ),
            )

        new_test = self._svc.remedy.create_retest(order_test, user_id, reason, notes)
        issue = self._svc.remedy.record_issue(
            order_id=order_test.orderId,
            stage=QualityStage.VALIDATION,
            domain=QualityDomain.ANALYTICAL,
            reason=reason,
            notes=notes,
            remedy=RemedyType.RETRY_SAME_SAMPLE,
            user_id=user_id,
            order_test_id=order_test.id,
            sample_id=order_test.sampleId,
            test_code=order_test.testCode,
            created_test_id=new_test.id,
        )
        return QualityIssueResult(
            success=True,
            remedy=RemedyType.RETRY_SAME_SAMPLE,
            message="Re-test scheduled on the same sample.",
            qualityIssueId=issue.id,
            orderId=order_test.orderId,
            testCode=order_test.testCode,
            orderTestId=order_test.id,
            createdTestId=new_test.id,
        )

    def _escalate_recollection_limit(
        self,
        *,
        order_test: OrderTest,
        user_id: int,
        reason: str,
        notes: str | None,
        quality_issue_id: int,
    ) -> QualityIssueResult:
        from app.shared.contracts.lab_contract import MAX_RECOLLECTION_ATTEMPTS

        prior_status = order_test.status
        self._svc.escalation.escalate_test(
            order_test,
            EscalationReasonCode.REJ_SAMP,
            user_id,
            metadata={"rejectionReason": reason, "rejectionNotes": notes},
            sample_id=order_test.sampleId,
            from_status=prior_status,
        )
        return QualityIssueResult(
            success=True,
            remedy=RemedyType.ESCALATE,
            message=(
                f"Maximum collection attempts ({MAX_RECOLLECTION_ATTEMPTS}) reached. "
                "Escalated to supervisor — force validate, authorize re-test, authorize re-collect, or cancel."
            ),
            qualityIssueId=quality_issue_id,
            orderId=order_test.orderId,
            testCode=order_test.testCode,
            orderTestId=order_test.id,
            sampleId=order_test.sampleId,
            escalationRequired=True,
        )

    def request_recollection_from_validation(
        self,
        order_test: OrderTest,
        user_id: int,
        reason: str,
        notes: str | None,
    ) -> QualityIssueResult:
        if not order_test.sampleId:
            raise LabOperationError("No sample linked to this test", status_code=400)
        if not self._svc.recollection_execution:
            raise LabOperationError("Recollection request service not configured", status_code=500)

        sample = self._svc.get_sample(order_test.sampleId)

        if not self._svc.collection.can_request_recollection(sample):
            issue = self._svc.remedy.record_issue(
                order_id=order_test.orderId,
                stage=QualityStage.VALIDATION,
                domain=QualityDomain.SPECIMEN,
                reason=reason,
                notes=notes,
                remedy=RemedyType.REQUEST_RECOLLECTION,
                user_id=user_id,
                order_test_id=order_test.id,
                sample_id=sample.sampleId,
                test_code=order_test.testCode,
            )
            return self._escalate_recollection_limit(
                order_test=order_test,
                user_id=user_id,
                reason=reason,
                notes=notes,
                quality_issue_id=issue.id,
            )

        if sample.status == SampleStatus.COLLECTED:
            self._svc.remedy.reject_sample_record(
                sample,
                user_id,
                reason,
                notes,
                SampleRejectionContext(
                    stage=QualityStage.VALIDATION,
                    order_test_id=order_test.id,
                ),
                skip_test_ids={order_test.id},
                resulted_outcome="reset_pending",
            )
        elif sample.status != SampleStatus.REJECTED:
            can_reject, reject_reason = SampleStateMachine.can_reject(sample.status)
            raise LabOperationError(
                reject_reason
                or f"Cannot request recollection for sample status '{sample.status.value}'",
                status_code=400,
            )

        TestStateMachine.validate_transition(order_test.status, TestStatus.SUPERSEDED)
        order_test.status = TestStatus.SUPERSEDED

        issue = self._svc.remedy.record_issue(
            order_id=order_test.orderId,
            stage=QualityStage.VALIDATION,
            domain=QualityDomain.SPECIMEN,
            reason=reason,
            notes=notes,
            remedy=RemedyType.REQUEST_RECOLLECTION,
            user_id=user_id,
            order_test_id=order_test.id,
            sample_id=sample.sampleId,
            test_code=order_test.testCode,
        )
        executed = self._svc.recollection_execution.execute_recollection(
            rejected_sample=sample,
            user_id=user_id,
            reason=reason,
            stage=QualityStage.VALIDATION,
            order_test_id=order_test.id,
            supervisor_authorized=False,
        )
        return QualityIssueResult(
            success=True,
            remedy=RemedyType.REQUEST_RECOLLECTION,
            message="Pending sample created for collection.",
            qualityIssueId=issue.id,
            orderId=order_test.orderId,
            testCode=order_test.testCode,
            orderTestId=order_test.id,
            createdSampleId=executed.created_sample_id,
            createdTestId=executed.created_test_id,
        )

    def _escalate_test_issue(
        self,
        order_test: OrderTest,
        user_id: int,
        reason: str,
        notes: str | None,
        domain: QualityDomain,
        message: str | None = None,
    ) -> QualityIssueResult:
        TestStateMachine.validate_transition(order_test.status, TestStatus.ESCALATED)
        self._svc.escalation.escalate_test(
            order_test,
            EscalationReasonCode.LIMIT_HIT,
            user_id,
            metadata={"rejectionReason": reason, "rejectionNotes": notes},
            from_status=TestStatus.RESULTED,
        )
        issue = self._svc.remedy.record_issue(
            order_id=order_test.orderId,
            stage=QualityStage.VALIDATION,
            domain=domain,
            reason=reason,
            notes=notes,
            remedy=RemedyType.ESCALATE,
            user_id=user_id,
            order_test_id=order_test.id,
            sample_id=order_test.sampleId,
            test_code=order_test.testCode,
        )
        return QualityIssueResult(
            success=True,
            remedy=RemedyType.ESCALATE,
            message=message or "Escalated to supervisor for approval.",
            qualityIssueId=issue.id,
            orderId=order_test.orderId,
            testCode=order_test.testCode,
            orderTestId=order_test.id,
            escalationRequired=True,
        )
