"""Sample-target quality issue commands (collection stage)."""

from __future__ import annotations

from typing import TYPE_CHECKING

from app.domains.lab.quality.rejection_criteria import RejectionCriteriaService
from app.domains.lab.schemas.lab import QualityIssueResult
from app.domains.orders.models import OrderTest
from app.platform.utils.exceptions import LabOperationError
from app.shared.contracts.enums import (
    EscalationReasonCode,
    QualityDomain,
    QualityStage,
    RemedyType,
    TestStatus,
)

from .issue_options import sample_options
from .remedy_support import (
    ResultedRejectionOutcome,
    SampleRejectionContext,
    sample_unfinished_remedy_types,
)

if TYPE_CHECKING:
    from .issues_service import QualityIssueService


class SampleIssueCommands:
    def __init__(self, svc: QualityIssueService) -> None:
        self._svc = svc

    def report_sample_issue(
        self,
        sample_id: int,
        user_id: int,
        reason: str,
        notes: str | None,
        preferred_remedy: RemedyType | None,
    ) -> QualityIssueResult:
        sample = self._svc.get_sample(sample_id, for_update=True)
        RejectionCriteriaService(self._svc.db).validate_for_tests(
            sample.testCodes, reason, context="sample"
        )
        options = sample_options(self._svc, sample_id)
        unfinished = options.unfinishedTestsCount or 0

        remedy = preferred_remedy
        if unfinished > 0:
            if remedy is None:
                remedy = RemedyType.REQUEST_RECOLLECTION
            if remedy not in sample_unfinished_remedy_types():
                raise LabOperationError(
                    f"Invalid remedy for sample rejection: {remedy}. "
                    f"Allowed: {[r.value for r in sample_unfinished_remedy_types()]}",
                    status_code=400,
                )
        else:
            remedy = RemedyType.REQUEST_RECOLLECTION

        rejection_ctx = SampleRejectionContext(stage=QualityStage.COLLECTION)
        if unfinished > 0 and remedy == RemedyType.REQUEST_RECOLLECTION:
            resulted_outcome: ResultedRejectionOutcome = "reset_pending"
        else:
            resulted_outcome = "cancel"

        self._svc.remedy.reject_sample_record(
            sample,
            user_id,
            reason,
            notes,
            rejection_ctx,
            reset_unfinished=True,
            resulted_outcome=resulted_outcome,
        )

        if unfinished > 0 and remedy == RemedyType.REQUEST_RECOLLECTION:
            return self._request_recollection_from_collection(sample, user_id, reason, notes)

        recorded_remedy = (
            RemedyType.CANCEL if unfinished > 0 and remedy == RemedyType.CANCEL else remedy
        )
        issue = self._svc.remedy.record_issue(
            order_id=sample.orderId,
            stage=QualityStage.COLLECTION,
            domain=QualityDomain.SPECIMEN,
            reason=reason,
            notes=notes,
            remedy=recorded_remedy,
            user_id=user_id,
            sample_id=sample_id,
        )
        parts = ["Sample rejected."]
        if unfinished > 0 and remedy == RemedyType.CANCEL:
            parts.append("Unfinished tests were reset to await collection.")
        if (options.resultedTestsCount or 0) > 0:
            if resulted_outcome == "reset_pending":
                parts.append("Unvalidated resulted tests were cleared and reset to pending.")
            else:
                parts.append("Unvalidated resulted tests were cleared and cancelled.")
        if (options.validatedTestsCount or 0) > 0:
            parts.append("Validated results were left unchanged.")

        return QualityIssueResult(
            success=True,
            remedy=recorded_remedy,
            message=" ".join(parts),
            qualityIssueId=issue.id,
            orderId=sample.orderId,
            sampleId=sample_id,
            escalationRequired=False,
        )

    def _pick_test_for_recollection_escalation(self, sample) -> OrderTest | None:
        linked = self._svc.linked_tests(
            sample,
            exclude=[TestStatus.SUPERSEDED, TestStatus.REMOVED, TestStatus.CANCELLED],
        )
        for status in (TestStatus.RESULTED, TestStatus.SAMPLE_COLLECTED, TestStatus.PENDING):
            for order_test in linked:
                if order_test.status == status:
                    return order_test
        return None

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

    def _request_recollection_from_collection(
        self,
        sample,
        user_id: int,
        reason: str,
        notes: str | None,
    ) -> QualityIssueResult:
        if not self._svc.recollection_execution:
            raise LabOperationError("Recollection request service not configured", status_code=500)

        issue = self._svc.remedy.record_issue(
            order_id=sample.orderId,
            stage=QualityStage.COLLECTION,
            domain=QualityDomain.SPECIMEN,
            reason=reason,
            notes=notes,
            remedy=RemedyType.REQUEST_RECOLLECTION,
            user_id=user_id,
            sample_id=sample.sampleId,
        )

        if not self._svc.collection.can_request_recollection(sample):
            target = self._pick_test_for_recollection_escalation(sample)
            if not target:
                raise LabOperationError(
                    "Recollection limit reached but no test could be escalated.",
                    status_code=400,
                )
            return self._escalate_recollection_limit(
                order_test=target,
                user_id=user_id,
                reason=reason,
                notes=notes,
                quality_issue_id=issue.id,
            )

        executed = self._svc.recollection_execution.execute_recollection(
            rejected_sample=sample,
            user_id=user_id,
            reason=reason,
            stage=QualityStage.COLLECTION,
            order_test_id=None,
            supervisor_authorized=False,
        )
        return QualityIssueResult(
            success=True,
            remedy=RemedyType.REQUEST_RECOLLECTION,
            message="Pending sample created for collection.",
            qualityIssueId=issue.id,
            orderId=sample.orderId,
            sampleId=sample.sampleId,
            createdSampleId=executed.created_sample_id,
            createdTestId=executed.created_test_id,
        )
