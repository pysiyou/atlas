"""Sample-target quality issue commands (collection stage)."""
from __future__ import annotations

from typing import TYPE_CHECKING

from app.domains.lab.quality.options import sample_options
from app.domains.lab.quality.rejection import RejectionCriteriaService
from app.domains.lab.quality.remedy import sample_unfinished_remedy_types

if TYPE_CHECKING:
    from app.domains.lab.quality.issues import QualityIssueService
    from app.domains.lab.quality.remedy import ResultedRejectionOutcome, SampleRejectionContext

from app.domains.lab.quality.schemas import QualityIssueResult
from app.shared.generated.enums import (
    QualityDomain,
    QualityStage,
    RemedyType,
)
from app.shared.errors import LabOperationError


class SampleIssueCommands:
    def __init__(self, svc: QualityIssueService) -> None:
        self._svc = svc

    def report_sample_issue(
        self,
        sample_id: str,
        user_id: str,
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
            allowed = options.allowedRemedies or sample_unfinished_remedy_types()
            if remedy is None:
                remedy = options.suggestedRemedy or RemedyType.CANCEL
            if remedy not in allowed:
                raise LabOperationError(
                    f"Invalid remedy for sample rejection: {remedy}. "
                    f"Allowed: {[r.value for r in allowed]}",
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

    def _request_recollection_from_collection(
        self,
        sample,
        user_id: str,
        reason: str,
        notes: str | None,
    ) -> QualityIssueResult:
        from app.shared.generated.lab_policy import MAX_RECOLLECTION_ATTEMPTS

        if not self._svc.recollection_execution:
            raise LabOperationError("Recollection request service not configured", status_code=500)
        if not self._svc.collection.can_request_recollection(sample):
            raise LabOperationError(
                f"Maximum collection attempts ({MAX_RECOLLECTION_ATTEMPTS}) reached. "
                "Cancel unfinished tests instead.",
                status_code=400,
            )

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
