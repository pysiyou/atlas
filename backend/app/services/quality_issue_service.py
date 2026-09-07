"""
Unified quality issue handling for lab workflow.

One entry point for specimen and analytical quality problems at collection or validation.
"""
from __future__ import annotations

import copy
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from app.models.order import Order, OrderTest
from app.models.quality_issue import QualityIssue
from app.models.sample import Sample
from app.schemas.enums import (
    EscalationReasonCode,
    QualityDomain,
    QualityIssueTargetType,
    QualityStage,
    RemedyType,
    PriorityLevel,
    SampleStatus,
    TestStatus,
)
from app.services.audit_service import AuditService
from app.services.escalation_engine import EscalationEngine
from app.services.lab_constants import MAX_RETEST_ATTEMPTS
from app.services.sample_collection import SampleCollectionService
from app.services.order_status_updater import update_order_status
from app.services.rejection_criteria_service import RejectionCriteriaService
from app.services.state_machine import SampleStateMachine, TestStateMachine, StateTransitionError
from app.utils.exceptions import LabOperationError
from app.utils.specimen_reasons import is_specimen_rejection_reason

_SAMPLE_RESET_STATUSES = {
    TestStatus.PENDING,
    TestStatus.SAMPLE_COLLECTED,
}
_SAMPLE_ESCALATE_STATUSES = {
    TestStatus.RESULTED,
    TestStatus.VALIDATED,
}


class QualityIssueOptions(BaseModel):
    targetType: QualityIssueTargetType
    targetId: int
    orderId: int
    testCode: Optional[str] = None
    sampleId: Optional[int] = None
    stage: QualityStage
    allowedCriteria: List[str] = []
    retestAttemptsUsed: int = 0
    retestAttemptsRemaining: int = 0
    recollectionAttemptsUsed: int = 0
    recollectionAttemptsRemaining: int = 0
    willEscalate: bool = False
    previewRemedy: Optional[RemedyType] = None
    previewMessage: str = ""
    hasSpecimenCriteria: bool = False
    hasAnalyticalCriteria: bool = False
    resultedTestsCount: int = 0
    validatedTestsCount: int = 0
    awaitingRecollectionTestsCount: int = 0


class QualityIssueResult(BaseModel):
    success: bool
    remedy: RemedyType
    message: str
    qualityIssueId: int
    orderId: int
    testCode: Optional[str] = None
    sampleId: Optional[int] = None
    orderTestId: Optional[int] = None
    createdTestId: Optional[int] = None
    createdSampleId: Optional[int] = None
    recollectionRequestId: Optional[int] = None
    escalationRequired: bool = False


class QualityIssueService:
    def __init__(self, db: Session, audit: AuditService, escalation: EscalationEngine):
        self.db = db
        self.audit = audit
        self.escalation = escalation
        self.collection = SampleCollectionService(db)
        self.recollection_requests: Optional[Any] = None

    # ── helpers ──────────────────────────────────────────────────────────

    def _get_sample(self, sample_id: int) -> Sample:
        sample = self.db.query(Sample).filter(Sample.sampleId == sample_id).first()
        if not sample:
            raise LabOperationError(f"Sample {sample_id} not found", status_code=404)
        return sample

    def _linked_tests(self, sample: Sample, *, exclude: Optional[List[TestStatus]] = None) -> List[OrderTest]:
        query = self.db.query(OrderTest).filter(
            OrderTest.orderId == sample.orderId,
            OrderTest.testCode.in_(sample.testCodes),
            OrderTest.sampleId == sample.sampleId,
        )
        if exclude:
            query = query.filter(OrderTest.status.notin_(exclude))
        return query.all()

    def _chain_root_test(self, test: OrderTest) -> OrderTest:
        current = test
        while current.retestOfTestId:
            parent = self.db.query(OrderTest).filter(OrderTest.id == current.retestOfTestId).first()
            if not parent:
                break
            current = parent
        return current

    def _chain_root_sample(self, sample: Sample) -> Sample:
        current = sample
        while current.originalSampleId:
            parent = self.db.query(Sample).filter(Sample.sampleId == current.originalSampleId).first()
            if not parent:
                break
            current = parent
        return current

    def _collect_chain_test_ids(self, order_test: OrderTest) -> set[int]:
        """All order-test row IDs in the retest chain (root through active successor)."""
        root = self._chain_root_test(order_test)
        chain_ids: set[int] = {root.id}
        current = root
        while current.retestOrderTestId:
            child = (
                self.db.query(OrderTest)
                .filter(OrderTest.id == current.retestOrderTestId)
                .first()
            )
            if not child:
                break
            chain_ids.add(child.id)
            current = child
        return chain_ids

    def _count_retests_in_chain(self, order_test: OrderTest) -> int:
        chain_ids = self._collect_chain_test_ids(order_test)
        return (
            self.db.query(QualityIssue)
            .filter(
                QualityIssue.orderTestId.in_(chain_ids),
                QualityIssue.remedy == RemedyType.RETRY_SAME_SAMPLE,
            )
            .count()
        )

    def _escalate_pending_tests_on_sample(
        self,
        sample: Sample,
        user_id: int,
        reason: str,
        notes: Optional[str],
        *,
        skip_test_ids: Optional[set[int]] = None,
    ) -> None:
        """Escalate tests still awaiting work on a rejected tube."""
        skip = skip_test_ids or set()
        for order_test in self._linked_tests(
            sample, exclude=[TestStatus.SUPERSEDED, TestStatus.REMOVED, TestStatus.CANCELLED]
        ):
            if order_test.id in skip:
                continue
            if order_test.sampleId != sample.sampleId:
                continue
            if order_test.status not in _SAMPLE_RESET_STATUSES:
                continue
            self.escalation.escalate_test(
                order_test,
                EscalationReasonCode.REJ_SAMP,
                user_id,
                metadata={"rejectionReason": reason, "rejectionNotes": notes},
                sample_id=sample.sampleId,
                from_status=order_test.status,
            )

    def _record_issue(
        self,
        *,
        order_id: int,
        stage: QualityStage,
        domain: QualityDomain,
        reason: str,
        notes: Optional[str],
        remedy: RemedyType,
        user_id: int,
        order_test_id: Optional[int] = None,
        sample_id: Optional[int] = None,
        test_code: Optional[str] = None,
        created_test_id: Optional[int] = None,
        created_sample_id: Optional[int] = None,
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
            createdAt=datetime.now(timezone.utc),
        )
        self.db.add(issue)
        self.db.flush()
        self.audit.log_quality_issue_reported(
            issue_id=issue.id,
            order_id=order_id,
            user_id=user_id,
            stage=stage.value,
            domain=domain.value,
            remedy=remedy.value,
            reason=reason,
            test_code=test_code,
            sample_id=sample_id,
        )
        return issue

    def _create_retest(
        self,
        order_test: OrderTest,
        user_id: int,
        reason: str,
        notes: Optional[str],
        *,
        retest_number: Optional[int] = None,
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

    def _create_recollection_sample(
        self,
        rejected_sample: Sample,
        user_id: int,
        reason: str,
        *,
        test_codes: Optional[list[str]] = None,
        priority: Optional[PriorityLevel] = None,
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

    def _clear_test_results(self, order_test: OrderTest) -> None:
        order_test.results = None
        order_test.resultEnteredAt = None
        order_test.enteredBy = None
        order_test.technicianNotes = None
        order_test.resultValidatedAt = None
        order_test.validatedBy = None
        order_test.validationNotes = None
        order_test.flags = None
        order_test.hasCriticalValues = False

    def _reattach_tests_to_recollection(self, rejected_sample: Sample, new_sample: Sample) -> None:
        for test in self._linked_tests(
            rejected_sample,
            exclude=[TestStatus.SUPERSEDED, TestStatus.REMOVED, TestStatus.CANCELLED],
        ):
            if test.status != TestStatus.PENDING:
                continue
            if test.sampleId != rejected_sample.sampleId:
                continue
            test.sampleId = new_sample.sampleId
            self._clear_test_results(test)

    def _reset_test_for_sample_rejection(self, order_test: OrderTest) -> None:
        if order_test.status not in _SAMPLE_RESET_STATUSES:
            return
        TestStateMachine.validate_transition(order_test.status, TestStatus.PENDING)
        order_test.status = TestStatus.PENDING
        self._clear_test_results(order_test)

    def _reject_sample_record(
        self,
        sample: Sample,
        user_id: int,
        reason: str,
        notes: Optional[str],
        *,
        skip_test_ids: Optional[set[int]] = None,
    ) -> None:
        can_reject, reject_reason = SampleStateMachine.can_reject(sample.status)
        if not can_reject:
            raise LabOperationError(reject_reason, status_code=400)

        sample.status = SampleStatus.REJECTED
        sample.rejectedAt = datetime.now(timezone.utc)
        sample.rejectedBy = str(user_id)
        sample.rejectionReason = reason
        sample.rejectionNotes = notes
        sample.recollectionRequired = True
        sample.updatedBy = str(user_id)

        skip = skip_test_ids or set()
        linked = self._linked_tests(sample, exclude=[TestStatus.SUPERSEDED, TestStatus.REMOVED])
        for order_test in linked:
            if order_test.id in skip:
                continue
            if order_test.status in _SAMPLE_ESCALATE_STATUSES:
                self.escalation.escalate_test(
                    order_test,
                    EscalationReasonCode.REJ_SAMP,
                    user_id,
                    metadata={"rejectionReason": reason, "rejectionNotes": notes},
                    sample_id=sample.sampleId,
                    from_status=order_test.status,
                )
            elif order_test.status in _SAMPLE_RESET_STATUSES:
                self._reset_test_for_sample_rejection(order_test)

    # ── public API ───────────────────────────────────────────────────────

    def get_options(
        self,
        target_type: QualityIssueTargetType,
        target_id: int,
    ) -> QualityIssueOptions:
        if target_type == QualityIssueTargetType.SAMPLE:
            return self._sample_options(target_id)
        return self._test_options(target_id)

    def _sample_options(self, sample_id: int) -> QualityIssueOptions:
        sample = self._get_sample(sample_id)
        recollection_used = self.collection.attempts_used(sample)
        recollection_remaining = self.collection.attempts_remaining_after(sample)
        will_escalate = recollection_remaining == 0

        linked = self._linked_tests(sample, exclude=[TestStatus.SUPERSEDED, TestStatus.REMOVED])
        resulted = sum(1 for t in linked if t.status == TestStatus.RESULTED)
        validated = sum(1 for t in linked if t.status == TestStatus.VALIDATED)
        awaiting_recollection = sum(
            1
            for t in linked
            if t.status == TestStatus.PENDING and t.sampleId == sample_id
        )

        if resulted or validated:
            preview = RemedyType.ESCALATE
            message = "Tests with results will be escalated to supervisor."
        else:
            preview = RemedyType.REQUEST_RECOLLECTION
            if will_escalate:
                message = (
                    "Supervisor must approve recollection. "
                    "Recollection limit reached — override required if approved."
                )
            else:
                message = "Supervisor must approve before the patient is contacted for a new sample."

        criteria = RejectionCriteriaService(self.db).get_specimen_criteria_for_tests(sample.testCodes)

        return QualityIssueOptions(
            targetType=QualityIssueTargetType.SAMPLE,
            targetId=sample_id,
            orderId=sample.orderId,
            sampleId=sample_id,
            stage=QualityStage.COLLECTION,
            allowedCriteria=criteria,
            recollectionAttemptsUsed=recollection_used,
            recollectionAttemptsRemaining=recollection_remaining,
            willEscalate=bool(resulted or validated),
            previewRemedy=preview,
            previewMessage=message,
            resultedTestsCount=resulted,
            validatedTestsCount=validated,
            awaitingRecollectionTestsCount=awaiting_recollection,
        )

    def _test_options(self, order_test_id: int) -> QualityIssueOptions:
        order_test = self.db.query(OrderTest).filter(OrderTest.id == order_test_id).first()
        if not order_test:
            raise LabOperationError(f"Test {order_test_id} not found", status_code=404)
        if order_test.status != TestStatus.RESULTED:
            raise LabOperationError("Only resulted tests can be reported at validation", status_code=400)

        retest_used = self._count_retests_in_chain(order_test)
        retest_remaining = max(0, MAX_RETEST_ATTEMPTS - retest_used - 1)
        will_escalate = retest_remaining == 0

        sample_remaining = 0
        if order_test.sampleId:
            sample = self._get_sample(order_test.sampleId)
            sample_remaining = self.collection.attempts_remaining_after(sample)

        criteria_service = RejectionCriteriaService(self.db)
        criteria = criteria_service.get_validation_criteria_for_test(order_test.testCode)
        criteria_items = criteria_service.get_validation_criteria_items_for_test(order_test.testCode)
        has_specimen = any(item.domain == "specimen" for item in criteria_items)
        has_analytical = any(item.domain == "analytical" for item in criteria_items)

        if will_escalate:
            preview = RemedyType.ESCALATE
            message = "Rejection limit reached — will escalate to supervisor."
        elif has_specimen and has_analytical and order_test.sampleId:
            preview = RemedyType.RETRY_SAME_SAMPLE
            message = (
                "Specimen reasons submit a recollection request for supervisor approval. "
                "Analytical reasons schedule a re-test on the same sample "
                f"(attempt {retest_used + 1} of {MAX_RETEST_ATTEMPTS})."
            )
        elif has_specimen and order_test.sampleId:
            preview = RemedyType.REQUEST_RECOLLECTION
            if sample_remaining == 0:
                message = (
                    "Specimen issue — supervisor must approve recollection. "
                    "Recollection limit reached — override required if approved."
                )
            else:
                message = "Specimen issue — supervisor must approve before patient recollection."
        else:
            preview = RemedyType.RETRY_SAME_SAMPLE
            message = f"Re-run on same sample (attempt {retest_used + 1} of {MAX_RETEST_ATTEMPTS})."

        return QualityIssueOptions(
            targetType=QualityIssueTargetType.TEST,
            targetId=order_test_id,
            orderId=order_test.orderId,
            testCode=order_test.testCode,
            sampleId=order_test.sampleId,
            stage=QualityStage.VALIDATION,
            allowedCriteria=criteria,
            retestAttemptsUsed=retest_used,
            retestAttemptsRemaining=retest_remaining,
            recollectionAttemptsRemaining=sample_remaining,
            willEscalate=will_escalate,
            previewRemedy=preview,
            previewMessage=message,
            hasSpecimenCriteria=has_specimen,
            hasAnalyticalCriteria=has_analytical,
        )

    def report_issue(
        self,
        target_type: QualityIssueTargetType,
        target_id: int,
        user_id: int,
        reason: str,
        notes: Optional[str] = None,
        preferred_remedy: Optional[RemedyType] = None,
    ) -> QualityIssueResult:
        if target_type == QualityIssueTargetType.SAMPLE:
            return self._report_sample_issue(target_id, user_id, reason, notes)
        return self._report_test_issue(target_id, user_id, reason, notes, preferred_remedy)

    def _report_sample_issue(
        self,
        sample_id: int,
        user_id: int,
        reason: str,
        notes: Optional[str],
    ) -> QualityIssueResult:
        sample = self._get_sample(sample_id)
        RejectionCriteriaService(self.db).validate_for_tests(sample.testCodes, reason, context="sample")
        options = self._sample_options(sample_id)
        had_resulted_tests = (options.resultedTestsCount or 0) + (options.validatedTestsCount or 0) > 0

        self._reject_sample_record(sample, user_id, reason, notes)

        if had_resulted_tests or options.willEscalate:
            self._escalate_pending_tests_on_sample(sample, user_id, reason, notes)

            issue = self._record_issue(
                order_id=sample.orderId,
                stage=QualityStage.COLLECTION,
                domain=QualityDomain.SPECIMEN,
                reason=reason,
                notes=notes,
                remedy=RemedyType.ESCALATE,
                user_id=user_id,
                sample_id=sample_id,
            )
            self.db.commit()
            update_order_status(self.db, sample.orderId)
            return QualityIssueResult(
                success=True,
                remedy=RemedyType.ESCALATE,
                message="Sample rejected. Affected tests escalated to supervisor.",
                qualityIssueId=issue.id,
                orderId=sample.orderId,
                sampleId=sample_id,
                escalationRequired=True,
            )

        return self._request_recollection_from_collection(sample, user_id, reason, notes)

    def _report_test_issue(
        self,
        order_test_id: int,
        user_id: int,
        reason: str,
        notes: Optional[str],
        preferred_remedy: Optional[RemedyType],
    ) -> QualityIssueResult:
        order_test = self.db.query(OrderTest).filter(OrderTest.id == order_test_id).first()
        if not order_test:
            raise LabOperationError(f"Test {order_test_id} not found", status_code=404)
        if order_test.status != TestStatus.RESULTED:
            raise LabOperationError("Only resulted tests can be reported at validation", status_code=400)

        RejectionCriteriaService(self.db).validate_for_test(order_test.testCode, reason, context="validation")
        options = self._test_options(order_test_id)
        criteria_service = RejectionCriteriaService(self.db)
        matched = criteria_service.get_criterion_for_reason(
            [order_test.testCode], reason, context="validation"
        )
        is_specimen = (
            matched.domain == "specimen"
            if matched
            else is_specimen_rejection_reason(reason)
        )

        if options.willEscalate:
            domain = QualityDomain.SPECIMEN if is_specimen else QualityDomain.ANALYTICAL
            return self._escalate_test_issue(order_test, user_id, reason, notes, domain)

        if is_specimen and order_test.sampleId:
            return self._request_recollection_from_validation(order_test, user_id, reason, notes)

        return self._retry_test_issue(order_test, user_id, reason, notes)

    def _retry_test_issue(
        self,
        order_test: OrderTest,
        user_id: int,
        reason: str,
        notes: Optional[str],
    ) -> QualityIssueResult:
        new_test = self._create_retest(order_test, user_id, reason, notes)
        issue = self._record_issue(
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
        self.db.commit()
        update_order_status(self.db, order_test.orderId)
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

    def _request_recollection_from_collection(
        self,
        sample: Sample,
        user_id: int,
        reason: str,
        notes: Optional[str],
    ) -> QualityIssueResult:
        if not self.recollection_requests:
            raise LabOperationError("Recollection request service not configured", status_code=500)

        affected = self._linked_tests(
            sample,
            exclude=[TestStatus.SUPERSEDED, TestStatus.REMOVED, TestStatus.CANCELLED],
        )
        issue = self._record_issue(
            order_id=sample.orderId,
            stage=QualityStage.COLLECTION,
            domain=QualityDomain.SPECIMEN,
            reason=reason,
            notes=notes,
            remedy=RemedyType.REQUEST_RECOLLECTION,
            user_id=user_id,
            sample_id=sample.sampleId,
        )
        request = self.recollection_requests.create_from_collection(
            sample=sample,
            user_id=user_id,
            reason=reason,
            notes=notes,
            quality_issue_id=issue.id,
            affected_tests=affected,
        )
        self.db.commit()
        update_order_status(self.db, sample.orderId)
        return QualityIssueResult(
            success=True,
            remedy=RemedyType.REQUEST_RECOLLECTION,
            message="Recollection request submitted for supervisor approval.",
            qualityIssueId=issue.id,
            orderId=sample.orderId,
            sampleId=sample.sampleId,
            recollectionRequestId=request.id,
        )

    def _request_recollection_from_validation(
        self,
        order_test: OrderTest,
        user_id: int,
        reason: str,
        notes: Optional[str],
    ) -> QualityIssueResult:
        if not order_test.sampleId:
            raise LabOperationError("No sample linked to this test", status_code=400)
        if not self.recollection_requests:
            raise LabOperationError("Recollection request service not configured", status_code=500)

        sample = self._get_sample(order_test.sampleId)
        can_reject, reject_reason = SampleStateMachine.can_reject(sample.status)
        if not can_reject:
            raise LabOperationError(reject_reason, status_code=400)

        self._reject_sample_record(
            sample, user_id, reason, notes, skip_test_ids={order_test.id}
        )

        TestStateMachine.validate_transition(order_test.status, TestStatus.SUPERSEDED)
        order_test.status = TestStatus.SUPERSEDED

        affected = self._linked_tests(
            sample,
            exclude=[TestStatus.SUPERSEDED, TestStatus.REMOVED, TestStatus.CANCELLED],
        )
        issue = self._record_issue(
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
        request = self.recollection_requests.create_from_validation(
            sample=sample,
            order_test=order_test,
            user_id=user_id,
            reason=reason,
            notes=notes,
            quality_issue_id=issue.id,
            affected_tests=affected,
        )
        self.db.commit()
        update_order_status(self.db, order_test.orderId)
        return QualityIssueResult(
            success=True,
            remedy=RemedyType.REQUEST_RECOLLECTION,
            message="Recollection request submitted for supervisor approval.",
            qualityIssueId=issue.id,
            orderId=order_test.orderId,
            testCode=order_test.testCode,
            orderTestId=order_test.id,
            recollectionRequestId=request.id,
        )

    def _escalate_test_issue(
        self,
        order_test: OrderTest,
        user_id: int,
        reason: str,
        notes: Optional[str],
        domain: QualityDomain,
    ) -> QualityIssueResult:
        TestStateMachine.validate_transition(order_test.status, TestStatus.ESCALATED)
        self.escalation.escalate_test(
            order_test,
            EscalationReasonCode.LIMIT_HIT,
            user_id,
            metadata={"rejectionReason": reason, "rejectionNotes": notes},
            from_status=TestStatus.RESULTED,
        )
        issue = self._record_issue(
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
        self.db.commit()
        update_order_status(self.db, order_test.orderId)
        return QualityIssueResult(
            success=True,
            remedy=RemedyType.ESCALATE,
            message="Escalated to supervisor.",
            qualityIssueId=issue.id,
            orderId=order_test.orderId,
            testCode=order_test.testCode,
            orderTestId=order_test.id,
            escalationRequired=True,
        )

    def get_issues_for_order(self, order_id: int) -> List[QualityIssue]:
        return (
            self.db.query(QualityIssue)
            .filter(QualityIssue.orderId == order_id)
            .order_by(QualityIssue.createdAt.asc())
            .all()
        )

    def get_issues_for_test(self, order_test_id: int) -> List[QualityIssue]:
        return (
            self.db.query(QualityIssue)
            .filter(QualityIssue.orderTestId == order_test_id)
            .order_by(QualityIssue.createdAt.asc())
            .all()
        )

    def get_issues_for_sample(self, sample_id: int) -> List[QualityIssue]:
        return (
            self.db.query(QualityIssue)
            .filter(QualityIssue.sampleId == sample_id)
            .order_by(QualityIssue.createdAt.asc())
            .all()
        )
