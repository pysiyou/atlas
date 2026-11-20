"""Sample-target quality issue commands (collection stage)."""
from __future__ import annotations

from typing import TYPE_CHECKING

from app.domains.lab.quality.options import sample_options
from app.domains.lab.quality.rejection import RejectionCriteriaService
from app.domains.lab.quality.remedy import (
    ResultedRejectionOutcome,
    SampleRejectionContext,
    sample_unfinished_remedy_types,
)

if TYPE_CHECKING:
    from app.domains.lab.quality.issues import QualityIssueService

from app.domains.lab.quality.schemas import QualityIssueResult
from app.shared.errors import LabOperationError
from app.shared.generated.enums import (
    QualityDomain,
    QualityStage,
    RemedyType,
)


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
        if unfinished <= 0:
            raise LabOperationError(
                "No unfinished tests on this specimen. Reject individual tests at validation.",
                status_code=400,
            )

        allowed = options.allowedRemedies or sample_unfinished_remedy_types()
        remedy = preferred_remedy or options.suggestedRemedy or RemedyType.CANCEL
        if remedy not in allowed:
            raise LabOperationError(
                f"Invalid remedy for sample rejection: {remedy}. "
                f"Allowed: {[r.value for r in allowed]}",
                status_code=400,
            )

        rejection_ctx = SampleRejectionContext(stage=QualityStage.COLLECTION)
        wants_recollection = remedy == RemedyType.REQUEST_RECOLLECTION
        resulted_outcome: ResultedRejectionOutcome = (
            "reset_pending" if wants_recollection else "cancel"
        )

        self._svc.remedy.reject_sample_record(
            sample,
            user_id,
            reason,
            notes,
            rejection_ctx,
            reset_unfinished=True,
            resulted_outcome=resulted_outcome,
            recollection_required=wants_recollection,
        )

        if wants_recollection:
            return self._request_recollection_from_collection(sample, user_id, reason, notes)
        return self._replace_rejected_tube(sample, user_id, reason, notes, options)

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
        self._svc.remedy.attach_created_artifacts(
            issue,
            created_test_id=executed.created_test_id,
            created_sample_id=executed.created_sample_id,
            user_id=user_id,
            reason=reason,
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

    def _replace_rejected_tube(
        self,
        sample,
        user_id: str,
        reason: str,
        notes: str | None,
        options,
    ) -> QualityIssueResult:
        """Reject-tube-only: park unfinished work on a new collectable pending accession."""
        replacement = self._svc.collection.create_initial_pending_sample(
            order_id=sample.orderId,
            sample_type=sample.sampleType,
            test_codes=list(sample.testCodes or []),
            required_volume=sample.requiredVolume,
            optimal_volume=sample.optimalVolume or 0.0,
            priority=sample.priority,
            required_container_types=list(sample.requiredContainerTypes or []),
            required_container_colors=list(sample.requiredContainerColors or []),
            created_by=str(user_id),
        )
        self._svc.remedy.reattach_tests_to_recollection(sample, replacement)
        self._svc.emitter.sample_created(
            replacement.sampleId,
            sample.orderId,
            None,
            test_codes=list(replacement.testCodes or []),
        )
        issue = self._svc.remedy.record_issue(
            order_id=sample.orderId,
            stage=QualityStage.COLLECTION,
            domain=QualityDomain.SPECIMEN,
            reason=reason,
            notes=notes,
            remedy=RemedyType.CANCEL,
            user_id=user_id,
            sample_id=sample.sampleId,
            created_sample_id=replacement.sampleId,
        )
        parts = [
            "Sample rejected.",
            f"Unfinished tests were moved to pending sample {replacement.sampleId}.",
        ]
        if (options.resultedTestsCount or 0) > 0:
            parts.append("Unvalidated resulted tests were cleared and cancelled.")
        if (options.validatedTestsCount or 0) > 0:
            parts.append("Validated results were left unchanged.")
        return QualityIssueResult(
            success=True,
            remedy=RemedyType.CANCEL,
            message=" ".join(parts),
            qualityIssueId=issue.id,
            orderId=sample.orderId,
            sampleId=sample.sampleId,
            createdSampleId=replacement.sampleId,
            escalationRequired=False,
        )
