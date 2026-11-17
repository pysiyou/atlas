"""
Unified quality issue handling for lab workflow.

Thin façade: option previews, report commands, and shared remedy helpers.
Command modules (`sample_issue_commands`, `test_issue_commands`)
use public accessors on this service (`get_sample`, `linked_tests`, `record_issue`,
`remedy`, `db`, etc.) rather than private methods.
"""
from __future__ import annotations

from typing import Any

from app.domains.audit.service import AuditEmitter
from app.domains.lab.models.quality_issue import QualityIssue
from app.domains.lab.models.sample import Sample
from app.domains.lab.quality.issue_options import sample_options, test_options
from app.domains.lab.quality.remedy_support import (
    QualityRemedySupport,
    ResultedRejectionOutcome,
    SampleRejectionContext,
)
from app.domains.lab.quality.sample_issue_commands import SampleIssueCommands
from app.domains.lab.quality.test_issue_commands import TestIssueCommands
from app.domains.lab.schemas.lab import QualityIssueOptions, QualityIssueResult
from app.domains.lab.specimen import SampleCollectionService
from app.domains.orders.models import OrderTest
from app.platform.utils import LabOperationError
from app.shared.contracts.enums import (
    QualityDomain,
    QualityIssueTargetType,
    QualityStage,
    RemedyType,
    TestStatus,
)
from sqlalchemy.orm import Session


def _require_order_test_id(target_id: str) -> int:
    """Parse a quality-issue test target; sample targets stay strings."""
    try:
        parsed = int(target_id)
    except (TypeError, ValueError) as exc:
        raise LabOperationError(f"Invalid test id {target_id}", status_code=400) from exc
    if parsed <= 0:
        raise LabOperationError(f"Invalid test id {target_id}", status_code=400)
    return parsed


class QualityIssueService:
    def __init__(
        self,
        db: Session,
        emitter: AuditEmitter,
        recollection_execution: Any | None = None,
    ):
        self.db = db
        self.emitter = emitter
        self.collection = SampleCollectionService(db)
        self.recollection_execution = recollection_execution
        self.remedy = QualityRemedySupport(self)
        self._sample_cmds = SampleIssueCommands(self)
        self._test_cmds = TestIssueCommands(self)

    # ── lookups (public for commands / escalation) ─────────────────────────

    def get_sample(self, sample_id: str, *, for_update: bool = False) -> Sample:
        from app.domains.lab.specimen.lookup import get_sample_or_error

        return get_sample_or_error(self.db, sample_id, for_update=for_update)

    def linked_tests(
        self, sample: Sample, *, exclude: list[TestStatus] | None = None
    ) -> list[OrderTest]:
        from app.domains.lab.specimen.lookup import linked_order_tests_for_sample

        return linked_order_tests_for_sample(self.db, sample, exclude_statuses=exclude)

    # ── remedy delegation (public for escalation) ──────────────────────────

    def record_issue(
        self,
        *,
        order_id: str,
        stage: QualityStage,
        domain: QualityDomain,
        reason: str,
        notes: str | None,
        remedy: RemedyType,
        user_id: str,
        order_test_id: int | None = None,
        sample_id: str | None = None,
        test_code: str | None = None,
        created_test_id: int | None = None,
        created_sample_id: str | None = None,
        omit_remedy_from_validation_audit: bool = False,
    ) -> QualityIssue:
        return self.remedy.record_issue(
            order_id=order_id,
            stage=stage,
            domain=domain,
            reason=reason,
            notes=notes,
            remedy=remedy,
            user_id=user_id,
            order_test_id=order_test_id,
            sample_id=sample_id,
            test_code=test_code,
            created_test_id=created_test_id,
            created_sample_id=created_sample_id,
            omit_remedy_from_validation_audit=omit_remedy_from_validation_audit,
        )

    def create_retest(
        self,
        order_test: OrderTest,
        user_id: str,
        reason: str,
        notes: str | None,
        *,
        retest_number: int | None = None,
        technician_note_prefix: str = "Re-test",
    ) -> OrderTest:
        return self.remedy.create_retest(
            order_test,
            user_id,
            reason,
            notes,
            retest_number=retest_number,
            technician_note_prefix=technician_note_prefix,
        )

    def reject_sample_record(
        self,
        sample: Sample,
        user_id: str,
        reason: str,
        notes: str | None,
        context: SampleRejectionContext,
        *,
        skip_test_ids: set[int] | None = None,
        reset_unfinished: bool = True,
        resulted_outcome: ResultedRejectionOutcome = "cancel",
    ) -> None:
        return self.remedy.reject_sample_record(
            sample,
            user_id,
            reason,
            notes,
            context,
            skip_test_ids=skip_test_ids,
            reset_unfinished=reset_unfinished,
            resulted_outcome=resulted_outcome,
        )

    def create_recollection_sample(
        self,
        rejected_sample: Sample,
        user_id: str,
        reason: str,
        *,
        test_codes: list[str] | None = None,
        priority: Any | None = None,
        supervisor_authorized: bool = False,
    ) -> Sample:
        return self.remedy.create_recollection_sample(
            rejected_sample,
            user_id,
            reason,
            test_codes=test_codes,
            priority=priority,
            supervisor_authorized=supervisor_authorized,
        )

    def reattach_tests_to_recollection(self, rejected_sample: Sample, new_sample: Sample) -> None:
        self.remedy.reattach_tests_to_recollection(rejected_sample, new_sample)

    # ── public API ───────────────────────────────────────────────────────

    def get_options(
        self,
        target_type: QualityIssueTargetType,
        target_id: str,
    ) -> QualityIssueOptions:
        if target_type == QualityIssueTargetType.SAMPLE:
            return sample_options(self, target_id)
        return test_options(self, _require_order_test_id(target_id))

    def report_issue(
        self,
        target_type: QualityIssueTargetType,
        target_id: str,
        user_id: str,
        reason: str,
        notes: str | None = None,
        preferred_remedy: RemedyType | None = None,
    ) -> QualityIssueResult:
        if target_type == QualityIssueTargetType.SAMPLE:
            return self._sample_cmds.report_sample_issue(
                target_id, user_id, reason, notes, preferred_remedy
            )
        return self._test_cmds.report_test_issue(
            _require_order_test_id(target_id), user_id, reason, notes, preferred_remedy
        )

    def report_test_validation_issue(
        self,
        order_test_id: int,
        user_id: str,
        reason: str,
        notes: str | None,
        preferred_remedy: RemedyType | None = None,
    ) -> QualityIssueResult:
        """Entry for validation rejection from workflow modules (e.g. result_commands)."""
        return self._test_cmds.report_test_validation_issue(
            order_test_id, user_id, reason, notes, preferred_remedy
        )
