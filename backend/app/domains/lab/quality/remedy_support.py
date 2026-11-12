"""Persistence and state changes for quality-issue remedies (retest, recollection, rejection)."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any, Literal

from app.domains.lab.models.quality_issue import QualityIssue
from app.domains.lab.models.sample import Sample
from app.domains.lab.rules.state_machines import SampleStateMachine, TestStateMachine
from app.domains.orders.models import OrderTest
from app.platform.utils.exceptions import LabOperationError
from app.shared.contracts.enums import (
    PriorityLevel,
    QualityDomain,
    QualityStage,
    RemedyType,
    SampleStatus,
    TestStatus,
)
from app.shared.contracts.lab_contract import (
    SAMPLE_UNFINISHED_REMEDIES as SAMPLE_UNFINISHED_REMEDY_WIRES,
)
from app.shared.contracts.lab_contract import VALIDATION_REMEDIES as VALIDATION_REMEDY_WIRES

ResultedRejectionOutcome = Literal["reset_pending", "cancel"]

SAMPLE_RESET_STATUSES = {
    TestStatus.PENDING,
    TestStatus.SAMPLE_COLLECTED,
}


def _remedy_types(wires: tuple[str, ...]) -> list[RemedyType]:
    return [RemedyType(w) for w in wires]


def validation_remedy_types() -> list[RemedyType]:
    return _remedy_types(VALIDATION_REMEDY_WIRES)


def sample_unfinished_remedy_types() -> list[RemedyType]:
    return _remedy_types(SAMPLE_UNFINISHED_REMEDY_WIRES)


@dataclass(frozen=True)
class SampleRejectionContext:
    """Context for physical sample rejection (audit)."""

    stage: QualityStage
    order_test_id: int | None = None
    quality_issue_id: int | None = None


if TYPE_CHECKING:
    from .issues_service import QualityIssueService


class QualityRemedySupport:
    """Remedy execution used by quality handlers and escalation."""

    def __init__(self, service: QualityIssueService) -> None:
        self._svc = service

    @property
    def db(self):
        return self._svc.db

    @property
    def emitter(self):
        return self._svc.emitter

    @property
    def collection(self):
        return self._svc.collection

    def record_issue(
        self,
        *,
        order_id: int,
        stage: QualityStage,
        domain: QualityDomain,
        reason: str,
        notes: str | None,
        remedy,
        user_id: int,
        order_test_id: int | None = None,
        sample_id: int | None = None,
        test_code: str | None = None,
        created_test_id: int | None = None,
        created_sample_id: int | None = None,
        omit_remedy_from_validation_audit: bool = False,
    ) -> QualityIssue:
        issue = QualityIssue(
            orderId=order_id,
            orderTestId=order_test_id,
            sampleId=sample_id,
            testCode=test_code,
            stage=stage,
            domain=domain,
            reason=reason,
            notes=notes,
            remedy=remedy,
            createdTestId=created_test_id,
            createdSampleId=created_sample_id,
            createdBy=str(user_id),
            createdAt=datetime.now(UTC),
        )
        self.db.add(issue)
        self.db.flush()
        if stage == QualityStage.VALIDATION:
            validation_meta: dict[str, Any] = {
                "quality_issue_id": issue.id,
                "stage": stage.value,
                "domain": domain.value,
                "reason": reason,
                "test_code": test_code,
                **({"sample_id": sample_id} if sample_id is not None else {}),
                **({"notes": notes} if notes else {}),
            }
            if not omit_remedy_from_validation_audit:
                validation_meta["remedy"] = remedy.value
            self.emitter.validation_rejected(
                order_id=order_id,
                order_test_id=order_test_id,
                sample_id=sample_id,
                user_id=user_id,
                metadata=validation_meta,
            )
            if created_test_id is not None and order_test_id is not None:
                self.emitter.order_test_retest(
                    order_id=order_id,
                    original_test_id=order_test_id,
                    new_test_id=created_test_id,
                    test_code=test_code or "",
                    user_id=user_id,
                    reason=reason,
                )
        return issue

    def create_retest(
        self,
        order_test: OrderTest,
        user_id: int,
        reason: str,
        notes: str | None,
        *,
        retest_number: int | None = None,
        technician_note_prefix: str = "Re-test",
    ) -> OrderTest:
        current_retest = order_test.retestNumber or 0
        next_retest = retest_number if retest_number is not None else current_retest + 1

        new_test = OrderTest(
            orderId=order_test.orderId,
            testCode=order_test.testCode,
            status=TestStatus.SAMPLE_COLLECTED,
            priceAtOrder=order_test.priceAtOrder,
            sampleId=order_test.sampleId,
            isRetest=True,
            retestOfTestId=order_test.id,
            retestNumber=next_retest,
            technicianNotes=f"{technician_note_prefix} #{next_retest}: {reason}"
            + (f" — {notes}" if notes else ""),
            flags=order_test.flags,
            isReflexTest=order_test.isReflexTest,
            triggeredBy=order_test.triggeredBy,
            reflexRule=order_test.reflexRule,
        )
        self.db.add(new_test)
        self.db.flush()

        order_test.retestOrderTestId = new_test.id
        TestStateMachine.validate_transition(order_test.status, TestStatus.SUPERSEDED)
        order_test.status = TestStatus.SUPERSEDED
        return new_test

    def create_recollection_sample(
        self,
        rejected_sample: Sample,
        user_id: int,
        reason: str,
        *,
        test_codes: list[str] | None = None,
        priority: PriorityLevel | None = None,
        supervisor_authorized: bool = False,
    ) -> Sample:
        return self.collection.request_recollection(
            rejected_sample,
            user_id,
            reason,
            test_codes=test_codes,
            priority=priority,
            supervisor_authorized=supervisor_authorized,
        )

    def clear_test_results(self, order_test: OrderTest) -> None:
        order_test.results = None
        order_test.resultEnteredAt = None
        order_test.enteredBy = None
        order_test.technicianNotes = None
        order_test.resultValidatedAt = None
        order_test.validatedBy = None
        order_test.validationNotes = None
        order_test.flags = None
        order_test.hasCriticalValues = False

    def reattach_tests_to_recollection(self, rejected_sample: Sample, new_sample: Sample) -> None:
        for test in self._svc.linked_tests(
            rejected_sample,
            exclude=[TestStatus.SUPERSEDED, TestStatus.REMOVED, TestStatus.CANCELLED],
        ):
            if test.status != TestStatus.PENDING:
                continue
            if test.sampleId != rejected_sample.sampleId:
                continue
            test.sampleId = new_sample.sampleId
            self.clear_test_results(test)

    def reject_sample_record(
        self,
        sample: Sample,
        user_id: int,
        reason: str,
        notes: str | None,
        context: SampleRejectionContext,
        *,
        skip_test_ids: set[int] | None = None,
        reset_unfinished: bool = True,
        resulted_outcome: ResultedRejectionOutcome = "cancel",
    ) -> None:
        can_reject, reject_reason = SampleStateMachine.can_reject(sample.status)
        if not can_reject:
            raise LabOperationError(reject_reason, status_code=400)

        old_status = sample.status.value if sample.status else None
        sample.status = SampleStatus.REJECTED
        sample.rejectedAt = datetime.now(UTC)
        sample.rejectedBy = str(user_id)
        sample.rejectionReason = reason
        sample.rejectionNotes = notes
        sample.recollectionRequired = True
        sample.updatedBy = str(user_id)

        audit_meta: dict[str, Any] = {"rejection_stage": context.stage.value}
        if notes:
            audit_meta["notes"] = notes
        if context.order_test_id is not None:
            audit_meta["order_test_id"] = context.order_test_id
        if context.quality_issue_id is not None:
            audit_meta["quality_issue_id"] = context.quality_issue_id
        self.emitter.sample_rejected(
            sample.sampleId,
            sample.orderId,
            user_id,
            reason,
            metadata=audit_meta,
            old_status=old_status,
        )

        if not reset_unfinished:
            return

        skip = skip_test_ids or set()
        linked = self._svc.linked_tests(
            sample, exclude=[TestStatus.SUPERSEDED, TestStatus.REMOVED, TestStatus.CANCELLED]
        )
        for order_test in linked:
            if order_test.id in skip:
                continue
            if order_test.status == TestStatus.VALIDATED:
                continue
            if order_test.status == TestStatus.RESULTED:
                self._suspend_resulted_for_sample_rejection(order_test, resulted_outcome)
                continue
            if order_test.status in SAMPLE_RESET_STATUSES:
                self._reset_test_for_sample_rejection(order_test)

    def _reset_test_for_sample_rejection(self, order_test: OrderTest) -> None:
        if order_test.status not in SAMPLE_RESET_STATUSES:
            return
        TestStateMachine.validate_transition(order_test.status, TestStatus.PENDING)
        order_test.status = TestStatus.PENDING
        self.clear_test_results(order_test)

    def _suspend_resulted_for_sample_rejection(
        self,
        order_test: OrderTest,
        outcome: ResultedRejectionOutcome,
    ) -> None:
        if order_test.status != TestStatus.RESULTED:
            return
        self.clear_test_results(order_test)
        if outcome == "reset_pending":
            TestStateMachine.validate_transition(order_test.status, TestStatus.PENDING)
            order_test.status = TestStatus.PENDING
        else:
            TestStateMachine.validate_transition(order_test.status, TestStatus.CANCELLED)
            order_test.status = TestStatus.CANCELLED
