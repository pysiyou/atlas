"""Test-target quality issue commands (validation stage)."""
from __future__ import annotations

from typing import TYPE_CHECKING

from app.domains.lab.quality.options import count_retests_in_chain
from app.domains.lab.quality.rejection import RejectionCriteriaService
from app.domains.lab.quality.remedy import SampleRejectionContext, validation_remedy_types

if TYPE_CHECKING:
    from app.domains.lab.quality.issues import QualityIssueService

from app.domains.lab.quality.schemas import QualityIssueResult
from app.domains.lab.rules.state_machines import SampleStateMachine, TestStateMachine
from app.domains.orders.models import OrderTest
from app.shared.generated.enums import (
    QualityDomain,
    QualityStage,
    RemedyType,
    SampleStatus,
    TestStatus,
)
from app.shared.errors import LabOperationError
from app.shared.generated.lab_policy import MAX_RETEST_ATTEMPTS
from app.shared.generated.rejections import is_specimen_rejection_registry_value


class TestIssueCommands:
    def __init__(self, svc: QualityIssueService) -> None:
        self._svc = svc

    def report_test_issue(
        self,
        order_test_id: int,
        user_id: str,
        reason: str,
        notes: str | None,
        preferred_remedy: RemedyType | None,
    ) -> QualityIssueResult:
        """Reject a resulted test and apply retest, recollection, or cancel on the card."""

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

        if preferred_remedy is None:
            raise LabOperationError(
                "preferredRemedy is required. Choose retest, recollection, or cancel.",
                status_code=400,
            )
        if preferred_remedy not in validation_remedy_types():
            raise LabOperationError(
                f"Invalid preferredRemedy '{preferred_remedy.value}'. "
                "Allowed: retry_same_sample, request_recollection, cancel.",
                status_code=400,
            )

        criteria_service = RejectionCriteriaService(self._svc.db)
        matched = criteria_service.get_criterion_for_reason(
            [order_test.testCode], reason, context="validation"
        )
        is_specimen = (
            matched.domain == "specimen" if matched else is_specimen_rejection_registry_value(reason)
        )
        domain = QualityDomain.SPECIMEN if is_specimen else QualityDomain.ANALYTICAL

        if preferred_remedy == RemedyType.RETRY_SAME_SAMPLE:
            return self.retry_test_issue(order_test, user_id, reason, notes)
        if preferred_remedy == RemedyType.REQUEST_RECOLLECTION:
            return self.request_recollection_from_validation(order_test, user_id, reason, notes)
        return self.cancel_test_issue(order_test, user_id, reason, notes, domain)

    def report_test_validation_issue(
        self,
        order_test_id: int,
        user_id: str,
        reason: str,
        notes: str | None,
        preferred_remedy: RemedyType | None = None,
    ) -> QualityIssueResult:
        """Public entry for validation rejection from workflow modules."""
        return self.report_test_issue(order_test_id, user_id, reason, notes, preferred_remedy)

    def cancel_test_issue(
        self,
        order_test: OrderTest,
        user_id: str,
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
        user_id: str,
        reason: str,
        notes: str | None,
    ) -> QualityIssueResult:
        retest_used = count_retests_in_chain(self._svc.db, order_test)
        retest_remaining = max(0, MAX_RETEST_ATTEMPTS - retest_used - 1)
        if retest_remaining <= 0:
            raise LabOperationError(
                f"Re-test limit reached ({MAX_RETEST_ATTEMPTS}). Recollect or cancel instead.",
                status_code=400,
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

    def request_recollection_from_validation(
        self,
        order_test: OrderTest,
        user_id: str,
        reason: str,
        notes: str | None,
    ) -> QualityIssueResult:
        from app.shared.generated.lab_policy import MAX_RECOLLECTION_ATTEMPTS

        if not order_test.sampleId:
            raise LabOperationError("No sample linked to this test", status_code=400)
        if not self._svc.recollection_execution:
            raise LabOperationError("Recollection request service not configured", status_code=500)

        sample = self._svc.get_sample(order_test.sampleId)

        if not self._svc.collection.can_request_recollection(sample):
            raise LabOperationError(
                f"Maximum collection attempts ({MAX_RECOLLECTION_ATTEMPTS}) reached. "
                "Cancel the test instead.",
                status_code=400,
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
