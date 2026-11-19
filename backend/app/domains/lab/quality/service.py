from __future__ import annotations

# --- from quality/escalation.py ---

"""Read helpers for open EscalationTicket rows used by board and worklists."""
from collections.abc import Iterable

from app.domains.lab.quality.models import EscalationTicket
from app.shared.enums import EscalationTicketStatus
from sqlalchemy.orm import Session


def load_open_tickets_by_order_test_id(
    db: Session,
    order_test_ids: Iterable[int],
) -> dict[int, EscalationTicket]:
    """Return open escalation tickets keyed by order test id.

    When multiple open tickets exist for one test (unexpected), the last row wins.
    """
    ids = list(order_test_ids)
    if not ids:
        return {}
    tickets_by_test: dict[int, EscalationTicket] = {}
    for ticket in (
        db.query(EscalationTicket)
        .filter(
            EscalationTicket.orderTestId.in_(ids),
            EscalationTicket.status == EscalationTicketStatus.OPEN,
        )
        .all()
    ):
        tickets_by_test[ticket.orderTestId] = ticket
    return tickets_by_test


def open_escalation_reason_codes_by_order_test_id(
    db: Session,
    order_test_ids: Iterable[int],
) -> dict[int, str | None]:
    """Map order test ids to open ticket reason codes (enum value strings)."""
    tickets = load_open_tickets_by_order_test_id(db, order_test_ids)
    out: dict[int, str | None] = {}
    for order_test_id, ticket in tickets.items():
        code = ticket.reasonCode
        out[order_test_id] = code.value if code is not None and hasattr(code, "value") else None
    return out


# --- from quality/rejection_criteria.py ---

"""
Validate rejection reasons against orderable-tests / analytes rejection criteria.

Runtime checks use persisted ``OrderableTest`` rows (synced from contracts). Contract
registry ids are validated in CI via ``scripts/validate-catalog.mjs`` against
``rejection-specimen.json`` (pre-analytical) and ``rejection-analytical.json`` (validation).
"""
from dataclasses import dataclass
from typing import Any, Literal

from app.domains.catalog.models import OrderableTest
from app.shared.exceptions import LabOperationError
from app.shared.rejection_reasons import (
    REJECTION_REASON_BY_ID,
    REJECTION_REASON_DOMAIN_BY_ID,
    rejection_reason_domain,
)
from sqlalchemy.orm import Session

QualityContext = Literal["sample", "validation"]


@dataclass(frozen=True)
class RejectionCriterion:
    """Catalog rejection criterion with explicit routing domain."""

    reason: str
    domain: str  # specimen | analytical


class RejectionCriteriaService:
    """Loads and validates catalog-defined rejection criteria."""

    def __init__(self, db: Session):
        self.db = db

    @staticmethod
    def _normalize_criterion(raw: Any) -> RejectionCriterion:
        if isinstance(raw, dict):
            reason_id = str(raw.get("reasonId") or "").strip()
            if reason_id:
                return RejectionCriterion(
                    reason=REJECTION_REASON_BY_ID[reason_id],
                    domain=REJECTION_REASON_DOMAIN_BY_ID[reason_id],
                )
            reason = str(raw.get("reason") or raw.get("label") or "").strip()
            domain = str(raw.get("domain") or "").lower()
            if domain not in {"specimen", "analytical"}:
                domain = rejection_reason_domain(reason) or "analytical"
            return RejectionCriterion(reason=reason, domain=domain)
        reason = str(raw).strip()
        return RejectionCriterion(
            reason=reason,
            domain=rejection_reason_domain(reason) or "analytical",
        )

    def _get_test(self, test_code: str) -> OrderableTest | None:
        return self.db.query(OrderableTest).filter(OrderableTest.code == test_code).first()

    def get_specimen_criteria_items_for_test(self, test_code: str) -> list[RejectionCriterion]:
        test = self._get_test(test_code)
        if not test or not test.rejectionCriteria:
            return []
        return [self._normalize_criterion(item) for item in test.rejectionCriteria]

    def get_validation_criteria_items_for_test(self, test_code: str) -> list[RejectionCriterion]:
        test = self._get_test(test_code)
        if not test:
            return []
        raw = test.validationRejectionCriteria or []
        return [self._normalize_criterion(item) for item in raw]

    def _items_for_context(
        self, test_code: str, context: QualityContext
    ) -> list[RejectionCriterion]:
        if context == "sample":
            return self.get_specimen_criteria_items_for_test(test_code)
        return self.get_validation_criteria_items_for_test(test_code)

    def get_validation_criteria_for_test(self, test_code: str) -> list[str]:
        return [item.reason for item in self.get_validation_criteria_items_for_test(test_code)]

    def get_specimen_criteria_for_tests(self, test_codes: list[str]) -> list[str]:
        seen: set[str] = set()
        criteria: list[str] = []
        for code in test_codes:
            for item in self.get_specimen_criteria_items_for_test(code):
                if item.reason not in seen:
                    seen.add(item.reason)
                    criteria.append(item.reason)
        return criteria

    def get_criterion_for_reason(
        self,
        test_codes: list[str],
        rejection_reason: str,
        *,
        context: QualityContext = "validation",
    ) -> RejectionCriterion | None:
        for code in test_codes:
            for item in self._items_for_context(code, context):
                if item.reason == rejection_reason:
                    return item
        return None

    def validate_for_test(
        self,
        test_code: str,
        rejection_reason: str,
        *,
        context: QualityContext = "validation",
    ) -> None:
        self.validate_for_tests([test_code], rejection_reason, context=context)

    def validate_for_tests(
        self,
        test_codes: list[str],
        rejection_reason: str,
        *,
        context: QualityContext = "validation",
    ) -> None:
        if context == "sample":
            allowed = self.get_specimen_criteria_for_tests(test_codes)
        else:
            seen: set[str] = set()
            allowed = []
            for code in test_codes:
                for reason in self.get_validation_criteria_for_test(code):
                    if reason not in seen:
                        seen.add(reason)
                        allowed.append(reason)

        if not allowed:
            label = "collection" if context == "sample" else "result review"
            raise LabOperationError(
                f"No rejection criteria defined for {label}",
                status_code=400,
            )
        if rejection_reason not in allowed:
            raise LabOperationError(
                f"Invalid rejection reason. Must be one of: {', '.join(allowed)}",
                status_code=400,
            )


# --- from quality/issue_options.py ---

"""Quality issue option previews for sample and test targets."""


from typing import TYPE_CHECKING

from app.domains.lab.quality.models import QualityIssue
from app.domains.lab.quality.schemas import QualityIssueOptions
from app.domains.orders.models import OrderTest
from app.shared.exceptions import LabOperationError
from app.shared.enums import (
    QualityIssueTargetType,
    QualityStage,
    RemedyType,
    SampleStatus,
    TestStatus,
)
from app.shared.lab_contract import MAX_RETEST_ATTEMPTS
from sqlalchemy.orm import Session

def chain_root_test(db: Session, test: OrderTest) -> OrderTest:
    """Walk retestOfTestId links to the root order-test row in the chain."""
    current = test
    while current.retestOfTestId:
        parent = db.query(OrderTest).filter(OrderTest.id == current.retestOfTestId).first()
        if not parent:
            break
        current = parent
    return current


def collect_chain_test_ids(db: Session, order_test: OrderTest) -> set[int]:
    """All order-test row IDs in the retest chain (root through active successor)."""
    root = chain_root_test(db, order_test)
    chain_ids: set[int] = {root.id}
    current = root
    while current.retestOrderTestId:
        child = db.query(OrderTest).filter(OrderTest.id == current.retestOrderTestId).first()
        if not child:
            break
        chain_ids.add(child.id)
        current = child
    return chain_ids


def count_retests_in_chain(db: Session, order_test: OrderTest) -> int:
    """Count prior RETRY_SAME_SAMPLE quality issues across the retest chain."""
    chain_ids = collect_chain_test_ids(db, order_test)
    return (
        db.query(QualityIssue)
        .filter(
            QualityIssue.orderTestId.in_(chain_ids),
            QualityIssue.remedy == RemedyType.RETRY_SAME_SAMPLE,
        )
        .count()
    )


def sample_options(svc: QualityIssueService, sample_id: str) -> QualityIssueOptions:
    sample = svc.get_sample(sample_id)
    recollection_used = svc.collection.attempts_used(sample)
    recollection_remaining = svc.collection.attempts_remaining_after(sample)

    linked = svc.linked_tests(
        sample, exclude=[TestStatus.SUPERSEDED, TestStatus.REMOVED, TestStatus.CANCELLED]
    )
    resulted = sum(1 for t in linked if t.status == TestStatus.RESULTED)
    validated = sum(1 for t in linked if t.status == TestStatus.VALIDATED)
    unfinished = sum(1 for t in linked if t.status in SAMPLE_RESET_STATUSES)
    awaiting_recollection = sum(
        1 for t in linked if t.status == TestStatus.PENDING and t.sampleId == sample_id
    )

    allowed = sample_unfinished_remedy_types() if unfinished > 0 else []
    if unfinished > 0 and recollection_remaining <= 0:
        allowed = [r for r in allowed if r != RemedyType.REQUEST_RECOLLECTION]
    suggested = None
    if unfinished > 0:
        if RemedyType.REQUEST_RECOLLECTION in allowed:
            suggested = RemedyType.REQUEST_RECOLLECTION
        elif allowed:
            suggested = allowed[0]

    parts: list[str] = []
    if unfinished > 0:
        parts.append(f"{unfinished} unfinished test(s) — request recollection or reject tube only.")
    if resulted > 0:
        parts.append(
            f"{resulted} unvalidated resulted test(s) will be cleared when the tube is rejected."
        )
    if validated > 0:
        parts.append(
            f"{validated} validated/released result(s) stay unchanged — amend separately if needed."
        )
    if not parts:
        parts.append("This sample will be marked rejected.")
    criteria = RejectionCriteriaService(svc.db).get_specimen_criteria_for_tests(sample.testCodes)

    return QualityIssueOptions(
        targetType=QualityIssueTargetType.SAMPLE,
        targetId=sample_id,
        orderId=sample.orderId,
        sampleId=sample_id,
        stage=QualityStage.COLLECTION,
        allowedCriteria=criteria,
        allowedRemedies=allowed,
        suggestedRemedy=suggested,
        recollectionAttemptsUsed=recollection_used,
        recollectionAttemptsRemaining=recollection_remaining,
        willEscalate=False,
        previewRemedy=suggested,
        previewMessage=" ".join(parts),
        resultedTestsCount=resulted,
        validatedTestsCount=validated,
        unfinishedTestsCount=unfinished,
        awaitingRecollectionTestsCount=awaiting_recollection,
    )


def test_options(svc: QualityIssueService, order_test_id: int) -> QualityIssueOptions:
    order_test = svc.db.query(OrderTest).filter(OrderTest.id == order_test_id).first()
    if not order_test:
        raise LabOperationError(f"Test {order_test_id} not found", status_code=404)
    if order_test.status != TestStatus.RESULTED:
        raise LabOperationError(
            "Only resulted tests can be reported at validation", status_code=400
        )

    retest_used = count_retests_in_chain(svc.db, order_test)
    retest_remaining = max(0, MAX_RETEST_ATTEMPTS - retest_used - 1)

    sample_rejected = False
    recollection_remaining = 0
    if order_test.sampleId:
        sample = svc.get_sample(order_test.sampleId)
        sample_rejected = sample.status == SampleStatus.REJECTED
        recollection_remaining = svc.collection.attempts_remaining_after(sample)

    criteria_service = RejectionCriteriaService(svc.db)
    criteria = criteria_service.get_validation_criteria_for_test(order_test.testCode)
    criteria_items = criteria_service.get_validation_criteria_items_for_test(order_test.testCode)
    has_specimen = any(item.domain == "specimen" for item in criteria_items)
    has_analytical = any(item.domain == "analytical" for item in criteria_items)

    allowed = list(validation_remedy_types())
    if sample_rejected or retest_remaining <= 0:
        allowed = [r for r in allowed if r != RemedyType.RETRY_SAME_SAMPLE]
    if recollection_remaining <= 0 or not order_test.sampleId:
        allowed = [r for r in allowed if r != RemedyType.REQUEST_RECOLLECTION]

    if sample_rejected and RemedyType.REQUEST_RECOLLECTION in allowed:
        suggested = RemedyType.REQUEST_RECOLLECTION
    elif has_specimen and not has_analytical and RemedyType.REQUEST_RECOLLECTION in allowed:
        suggested = RemedyType.REQUEST_RECOLLECTION
    elif RemedyType.RETRY_SAME_SAMPLE in allowed:
        suggested = RemedyType.RETRY_SAME_SAMPLE
    elif allowed:
        suggested = allowed[0]
    else:
        suggested = None

    message_parts: list[str] = []
    if sample_rejected:
        message_parts.append(
            "Linked sample is already rejected — retest on the same sample is not available."
        )
    if retest_remaining <= 0:
        message_parts.append("Re-test limit reached — recollect or cancel.")
    if recollection_remaining <= 0:
        message_parts.append("Recollection limit reached — retest or cancel.")
    if not message_parts:
        message_parts.append(
            "Choose retest on the same sample, recollection, or cancel this test."
        )

    return QualityIssueOptions(
        targetType=QualityIssueTargetType.TEST,
        targetId=str(order_test_id),
        orderId=order_test.orderId,
        testCode=order_test.testCode,
        sampleId=order_test.sampleId,
        stage=QualityStage.VALIDATION,
        allowedCriteria=criteria,
        allowedRemedies=allowed,
        suggestedRemedy=suggested,
        retestAttemptsUsed=retest_used,
        retestAttemptsRemaining=retest_remaining,
        recollectionAttemptsRemaining=recollection_remaining,
        willEscalate=False,
        previewRemedy=suggested,
        previewMessage=" ".join(message_parts),
        hasSpecimenCriteria=has_specimen,
        hasAnalyticalCriteria=has_analytical,
        sampleRejected=sample_rejected,
    )


# --- from quality/remedy_support.py ---

"""Persistence and state changes for quality-issue remedies (retest, recollection, rejection)."""


from dataclasses import dataclass
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any, Literal

from app.domains.lab.quality.models import QualityIssue
from app.domains.lab.specimen.models import Sample
from app.domains.lab.rules.service import SampleStateMachine, TestStateMachine
from app.domains.orders.models import OrderTest
from app.shared.exceptions import LabOperationError
from app.shared.enums import (
    PriorityLevel,
    QualityDomain,
    QualityStage,
    RemedyType,
    SampleStatus,
    TestStatus,
)
from app.shared.lab_contract import (
    SAMPLE_UNFINISHED_REMEDIES as SAMPLE_UNFINISHED_REMEDY_WIRES,
)
from app.shared.lab_contract import VALIDATION_REMEDIES as VALIDATION_REMEDY_WIRES

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
        user_id: str,
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


# --- from quality/sample_issue_commands.py ---

"""Sample-target quality issue commands (collection stage)."""


from typing import TYPE_CHECKING

from app.domains.lab.quality.schemas import QualityIssueResult
from app.shared.exceptions import LabOperationError
from app.shared.enums import (
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
        from app.shared.lab_contract import MAX_RECOLLECTION_ATTEMPTS

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


# --- from quality/test_issue_commands.py ---

"""Test-target quality issue commands (validation stage)."""


from typing import TYPE_CHECKING

from app.domains.lab.rules.service import SampleStateMachine, TestStateMachine
from app.domains.lab.quality.schemas import QualityIssueResult
from app.domains.orders.models import OrderTest
from app.shared.rejection_reasons import is_specimen_rejection_registry_value
from app.shared.exceptions import LabOperationError
from app.shared.enums import (
    QualityDomain,
    QualityStage,
    RemedyType,
    SampleStatus,
    TestStatus,
)
from app.shared.lab_contract import MAX_RETEST_ATTEMPTS

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
        from app.shared.lab_contract import MAX_RECOLLECTION_ATTEMPTS

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


# --- from quality/recollection_execution.py ---

"""Immediate recollection — create pending tube and reattach tests."""

from dataclasses import dataclass
from typing import Any

from app.domains.lab.specimen.models import Sample
from app.domains.orders.models import OrderTest
from app.shared.exceptions import LabOperationError
from app.shared.enums import QualityStage, TestStatus
from sqlalchemy.orm import Session


@dataclass(frozen=True)
class RecollectionExecuteResult:
    created_sample_id: str
    created_test_id: int | None
    message: str = "Pending sample created for collection."


class RecollectionExecutionService:
    def __init__(self, db: Session, quality_service: Any | None = None):
        self.db = db
        self.quality = quality_service

    def execute_recollection(
        self,
        *,
        rejected_sample: Sample,
        user_id: str,
        reason: str,
        stage: QualityStage,
        order_test_id: int | None = None,
        supervisor_authorized: bool = False,
        validate_work_exists: bool = True,
    ) -> RecollectionExecuteResult:
        if not self.quality:
            raise LabOperationError("Quality service not configured", status_code=500)

        if validate_work_exists:
            pending_tests_to_reattach = [
                test
                for test in self.quality.linked_tests(
                    rejected_sample,
                    exclude=[TestStatus.SUPERSEDED, TestStatus.REMOVED, TestStatus.CANCELLED],
                )
                if test.status == TestStatus.PENDING and test.sampleId == rejected_sample.sampleId
            ]
            original_test_valid = False
            if order_test_id and stage == QualityStage.VALIDATION:
                original_test = self.db.query(OrderTest).filter(OrderTest.id == order_test_id).first()
                original_test_valid = bool(
                    original_test and original_test.status == TestStatus.SUPERSEDED
                )
            if not pending_tests_to_reattach and not original_test_valid:
                raise LabOperationError(
                    "No pending tests remain to recollect on this specimen.",
                    status_code=400,
                )

        new_sample = self.quality.create_recollection_sample(
            rejected_sample,
            user_id,
            reason,
            supervisor_authorized=supervisor_authorized,
        )
        self.quality.reattach_tests_to_recollection(rejected_sample, new_sample)

        created_test_id: int | None = None
        if order_test_id and stage == QualityStage.VALIDATION:
            original_test = self.db.query(OrderTest).filter(OrderTest.id == order_test_id).first()
            if original_test and original_test.status == TestStatus.SUPERSEDED:
                next_retest = (original_test.retestNumber or 0) + 1
                new_test = OrderTest(
                    orderId=original_test.orderId,
                    testCode=original_test.testCode,
                    status=TestStatus.PENDING,
                    priceAtOrder=original_test.priceAtOrder,
                    sampleId=new_sample.sampleId,
                    isRetest=True,
                    retestOfTestId=original_test.id,
                    retestNumber=next_retest,
                    technicianNotes=f"Recollection: {reason}",
                    flags=original_test.flags,
                    isReflexTest=original_test.isReflexTest,
                    triggeredBy=original_test.triggeredBy,
                    reflexRule=original_test.reflexRule,
                )
                self.db.add(new_test)
                self.db.flush()
                created_test_id = new_test.id
                original_test.retestOrderTestId = new_test.id

        self.quality.emitter.sample_created(
            new_sample.sampleId,
            rejected_sample.orderId,
            None,
            test_codes=list(new_sample.testCodes or []),
        )
        self.quality.emitter.sample_recollect_approved(
            new_sample.sampleId,
            rejected_sample.orderId,
            user_id,
            metadata={
                "rejected_sample_id": rejected_sample.sampleId,
                "created_sample_id": new_sample.sampleId,
                "created_test_id": created_test_id,
                "reason": reason,
                "stage": stage.value,
            },
        )

        return RecollectionExecuteResult(
            created_sample_id=new_sample.sampleId,
            created_test_id=created_test_id,
        )


# --- from quality/critical_notifications.py ---

"""
Critical Value Notification Service

Handles critical value detection and notification workflow.
Ensures critical results are promptly communicated to ordering physicians.
"""
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

from app.domains.audit.service import AuditEmitter
from app.domains.lab.results.service import ResultFlag
from app.domains.lab.quality.schemas import (
    AcknowledgeRequest,
    CriticalValueResponse,
    NotifyRequest,
)
from app.domains.lab.specimen.models import Sample
from app.domains.orders.models import Order, OrderTest
from app.shared.exceptions import LabOperationError
from app.shared.enums import ResultStatus
from sqlalchemy.orm import Session


@dataclass
class CriticalNotification:
    """Represents a critical value notification"""

    order_test_id: int
    order_id: str
    test_code: str
    patient_id: str
    patient_name: str
    critical_values: list[dict[str, Any]]
    notified_to: str | None
    notified_at: datetime | None
    acknowledged_at: datetime | None
    notification_method: str = "pending"


class CriticalNotificationService:
    """
    Service for managing critical value notifications.

    Responsibilities:
    - Detect critical values from calculated flags
    - Create notification records
    - Track notification status
    - Handle acknowledgment workflow
    """

    def __init__(self, db: Session):
        self.db = db
        self.emitter = AuditEmitter(db)

    def create_notification(
        self,
        order_test: OrderTest,
        order: Order,
        critical_flags: list[ResultFlag],
        notified_to: str,
        notification_method: str = "system",
    ) -> CriticalNotification:
        """
        Create and record a critical value notification.

        Args:
            order_test: The OrderTest with critical values
            order: The parent Order
            critical_flags: List of critical flags
            notified_to: Name/identifier of who was notified
            notification_method: How notification was sent (phone, fax, EMR, etc.)

        Returns:
            CriticalNotification object
        """
        now = datetime.now(UTC)

        # Update OrderTest with notification info
        order_test.criticalNotificationSent = True
        order_test.criticalNotifiedAt = now
        order_test.criticalNotifiedTo = notified_to

        # Format critical values for notification
        critical_values = [
            {
                "analyte_code": f.analyte_code,
                "analyte_name": f.analyte_name,
                "value": f.value,
                "unit": f.unit,
                "status": f.status.value,
                "reference_range": f"{f.reference_low}-{f.reference_high}"
                if f.reference_low and f.reference_high
                else None,
            }
            for f in critical_flags
        ]

        notification = CriticalNotification(
            order_test_id=order_test.id,
            order_id=order.orderId,
            test_code=order_test.testCode,
            patient_id=order.patientId,
            patient_name=order.patientName,
            critical_values=critical_values,
            notified_to=notified_to,
            notified_at=now,
            acknowledged_at=None,
            notification_method=notification_method,
        )

        return notification

    def acknowledge_notification(self, order_test: OrderTest, _acknowledged_by: str) -> bool:
        """
        Record acknowledgment of a critical value notification.

        Args:
            order_test: The OrderTest with the critical notification
        Returns:
            True if acknowledgment was recorded
        """
        if not order_test.criticalNotificationSent:
            return False

        order_test.criticalAcknowledgedAt = datetime.now(UTC)
        # Store acknowledgment info in the notification record
        # (criticalNotifiedTo already has the notification target)

        return True

    def get_unacknowledged_critical_values(self) -> list[OrderTest]:
        """
        Get all OrderTests with unacknowledged critical values.

        Returns:
            List of OrderTest objects with pending acknowledgments
        """
        return (
            self.db.query(OrderTest)
            .filter(
                OrderTest.hasCriticalValues.is_(True),
                OrderTest.criticalNotificationSent.is_(True),
                OrderTest.criticalAcknowledgedAt.is_(None),
            )
            .all()
        )

    def _to_response(self, test: OrderTest, order: Order) -> CriticalValueResponse:
        sample = None
        if test.sampleId:
            sample = self.db.query(Sample).filter(Sample.sampleId == test.sampleId).first()
        patient = order.patient
        return CriticalValueResponse(
            id=test.id,
            orderId=test.orderId,
            testCode=test.testCode,
            testName=test.testName,
            patientId=order.patientId,
            patientName=order.patientName,
            sampleId=sample.sampleId if sample else None,
            flags=test.flags,
            criticalNotificationSent=test.criticalNotificationSent,
            criticalNotifiedAt=test.criticalNotifiedAt,
            criticalNotifiedTo=test.criticalNotifiedTo,
            criticalAcknowledgedAt=test.criticalAcknowledgedAt,
            resultEnteredAt=test.resultEnteredAt,
            status=test.status.value if test.status else "unknown",
        )

    def list_pending(self) -> list[CriticalValueResponse]:
        tests = self.get_unacknowledged_critical_values()
        results = []
        for test in tests:
            order = self.db.query(Order).filter(Order.orderId == test.orderId).first()
            if not order:
                continue
            results.append(self._to_response(test, order))
        return results

    @staticmethod
    def _parse_critical_flags(test: OrderTest) -> list[ResultFlag]:
        critical_flags = []
        if not test.flags:
            return critical_flags
        for flag_str in test.flags:
            parts = flag_str.split(":")
            if len(parts) >= 2:
                critical_flags.append(
                    ResultFlag(
                        analyte_code=parts[0],
                        analyte_name=parts[0],
                        value=float(parts[2]) if len(parts) > 2 else 0,
                        status=(
                            ResultStatus(parts[1])
                            if parts[1] in [s.value for s in ResultStatus]
                            else ResultStatus.CRITICAL
                        ),
                        reference_low=None,
                        reference_high=None,
                        critical_low=None,
                        critical_high=None,
                        unit=None,
                    )
                )
        return critical_flags

    def notify(self, test_id: int, request: NotifyRequest, user_id: str) -> dict:
        test = self.db.query(OrderTest).filter(OrderTest.id == test_id).with_for_update().first()
        if not test:
            raise LabOperationError("Test not found", status_code=404)
        if not test.hasCriticalValues:
            raise LabOperationError("Test does not have critical values", status_code=400)
        order = self.db.query(Order).filter(Order.orderId == test.orderId).first()
        if not order:
            raise LabOperationError("Order not found", status_code=404)
        notification = self.create_notification(
            order_test=test,
            order=order,
            critical_flags=self._parse_critical_flags(test),
            notified_to=request.notifiedTo,
            notification_method=request.notificationMethod,
        )
        self.emitter.result_critical_notified(
            test.orderId,
            test.id,
            test.testCode,
            user_id,
            metadata={
                "notified_to": request.notifiedTo,
                "notification_method": request.notificationMethod,
            },
        )
        return {
            "success": True,
            "message": f"Notification recorded for {request.notifiedTo}",
            "notifiedAt": notification.notified_at.isoformat()
            if notification.notified_at
            else None,
        }

    def acknowledge(self, test_id: int, request: AcknowledgeRequest, user_id: str) -> dict:
        test = self.db.query(OrderTest).filter(OrderTest.id == test_id).with_for_update().first()
        if not test:
            raise LabOperationError("Test not found", status_code=404)
        if not test.hasCriticalValues:
            raise LabOperationError("Test does not have critical values", status_code=400)
        if not test.criticalNotificationSent:
            raise LabOperationError("Notification has not been sent yet", status_code=400)
        if test.criticalAcknowledgedAt:
            raise LabOperationError("Critical value already acknowledged", status_code=400)
        self.acknowledge_notification(test, request.acknowledgedBy)
        self.emitter.result_critical_acknowledged(
            test.orderId,
            test.id,
            test.testCode,
            user_id,
            metadata={"acknowledged_by": request.acknowledgedBy},
        )
        return {
            "success": True,
            "message": f"Critical value acknowledged by {request.acknowledgedBy}",
            "acknowledgedAt": (
                test.criticalAcknowledgedAt.isoformat() if test.criticalAcknowledgedAt else None
            ),
        }


# --- from quality/issues_service.py ---

"""
Unified quality issue handling for lab workflow.

Thin façade: option previews, report commands, and shared remedy helpers.
Command modules (`sample_issue_commands`, `test_issue_commands`)
use public accessors on this service (`get_sample`, `linked_tests`, `record_issue`,
`remedy`, `db`, etc.) rather than private methods.
"""

from typing import Any

from app.domains.audit.service import AuditEmitter
from app.domains.lab.quality.models import QualityIssue
from app.domains.lab.specimen.models import Sample
from app.domains.lab.quality.schemas import QualityIssueOptions, QualityIssueResult
from app.domains.lab.specimen.service import SampleCollectionService
from app.domains.orders.models import OrderTest
from app.shared.exceptions import LabOperationError
from app.shared.enums import (
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
        from app.domains.lab.specimen.service import get_sample_or_error

        return get_sample_or_error(self.db, sample_id, for_update=for_update)

    def linked_tests(
        self, sample: Sample, *, exclude: list[TestStatus] | None = None
    ) -> list[OrderTest]:
        from app.domains.lab.specimen.service import linked_order_tests_for_sample

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
