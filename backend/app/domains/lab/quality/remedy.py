"""Persistence and state changes for quality-issue remedies (retest, recollection, rejection)."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any, Literal

if TYPE_CHECKING:
    from app.domains.lab.quality.issues import QualityIssueService

from app.domains.lab.quality.models import QualityIssue
from app.domains.lab.rules.state_machines import SampleStateMachine, TestStateMachine
from app.domains.lab.specimen.models import Sample
from app.domains.orders.models import OrderTest
from app.shared.errors import LabOperationError
from app.shared.generated.enums import (
    PriorityLevel,
    QualityDomain,
    QualityStage,
    RemedyType,
    SampleStatus,
    TestStatus,
)
from app.shared.generated.lab_policy import (
    SAMPLE_UNFINISHED_REMEDIES as SAMPLE_UNFINISHED_REMEDY_WIRES,
)
from app.shared.generated.lab_policy import VALIDATION_REMEDIES as VALIDATION_REMEDY_WIRES

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
        order_id: str,
        stage: QualityStage,
        domain: QualityDomain,
        reason: str,
        notes: str | None,
        remedy,
        user_id: str,
        order_test_id: int | None = None,
        sample_id: str | None = None,
        test_code: str | None = None,
        created_test_id: int | None = None,
        created_sample_id: str | None = None,
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

    def attach_created_artifacts(
        self,
        issue: QualityIssue,
        *,
        created_test_id: int | None,
        created_sample_id: str | None,
        user_id: str,
        reason: str,
    ) -> None:
        """Write successor sample/test ids created after the quality-issue row was inserted.

        Recollection executes after ``record_issue`` so the new accession is unknown at insert.
        Without this, the persisted issue (and retest audit) omit the active line analyzers need.
        """
        if created_test_id is not None:
            issue.createdTestId = created_test_id
        if created_sample_id is not None:
            issue.createdSampleId = created_sample_id
        if (
            issue.stage == QualityStage.VALIDATION
            and created_test_id is not None
            and issue.orderTestId is not None
        ):
            self.emitter.order_test_retest(
                order_id=issue.orderId,
                original_test_id=issue.orderTestId,
                new_test_id=created_test_id,
                test_code=issue.testCode or "",
                user_id=user_id,
                reason=reason,
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
            flags=None,
            isReflexTest=order_test.isReflexTest,
            triggeredBy=order_test.triggeredBy,
            reflexRule=order_test.reflexRule,
        )
        existing_successor = (
            self.db.query(OrderTest)
            .filter(
                OrderTest.retestOfTestId == order_test.id,
                OrderTest.status.notin_(
                    (TestStatus.SUPERSEDED, TestStatus.REMOVED, TestStatus.CANCELLED)
                ),
            )
            .first()
        )
        if existing_successor:
            return existing_successor

        self.db.add(new_test)
        self.db.flush()

        order_test.retestOrderTestId = new_test.id
        TestStateMachine.validate_transition(order_test.status, TestStatus.SUPERSEDED)
        order_test.status = TestStatus.SUPERSEDED
        return new_test

    def create_recollection_sample(
        self,
        rejected_sample: Sample,
        user_id: str,
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
        order_test.secondValidatorId = None
        order_test.secondValidatedAt = None
        order_test.criticalNotificationSent = False
        order_test.criticalNotifiedAt = None
        order_test.criticalNotifiedTo = None
        order_test.criticalAcknowledgedAt = None

    def reattach_tests_to_recollection(self, rejected_sample: Sample, new_sample: Sample) -> None:
        from app.domains.lab.specimen.lookup import (
            linked_order_tests_for_sample,
            sync_sample_test_codes,
        )

        moved: list[OrderTest] = []
        linked = linked_order_tests_for_sample(
            self.db,
            rejected_sample,
            exclude_statuses=[TestStatus.SUPERSEDED, TestStatus.REMOVED, TestStatus.CANCELLED],
            include_unassigned=True,
        )
        for test in linked:
            if test.status not in {TestStatus.PENDING, TestStatus.ESCALATED}:
                continue
            if test.sampleId not in {rejected_sample.sampleId, None}:
                continue
            test.sampleId = new_sample.sampleId
            if test.status == TestStatus.PENDING:
                self.clear_test_results(test)
            moved.append(test)
        created_on_new = (
            self.db.query(OrderTest)
            .filter(OrderTest.sampleId == new_sample.sampleId)
            .all()
        )
        sync_sample_test_codes(new_sample, [*moved, *created_on_new])

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
        recollection_required: bool = False,
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
        sample.recollectionRequired = recollection_required
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
