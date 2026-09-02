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

_SAMPLE_SUSPEND_STATUSES = {
    TestStatus.PENDING,
    TestStatus.SAMPLE_COLLECTED,
    TestStatus.SUSPENDED,
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
    resultedTestsCount: int = 0
    validatedTestsCount: int = 0
    suspendedTestsCount: int = 0


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
    escalationRequired: bool = False


class QualityIssueService:
    def __init__(self, db: Session, audit: AuditService, escalation: EscalationEngine):
        self.db = db
        self.audit = audit
        self.escalation = escalation
        self.collection = SampleCollectionService(db)

    # ── helpers ──────────────────────────────────────────────────────────

    def _get_sample(self, sample_id: int) -> Sample:
        sample = self.db.query(Sample).filter(Sample.sampleId == sample_id).first()
        if not sample:
            raise LabOperationError(f"Sample {sample_id} not found", status_code=404)
        return sample

    def _get_order_test(
        self,
        order_id: int,
        test_code: str,
        *,
        status: Optional[TestStatus] = None,
    ) -> OrderTest:
        query = self.db.query(OrderTest).filter(
            OrderTest.orderId == order_id,
            OrderTest.testCode == test_code,
        )
        if status:
            query = query.filter(OrderTest.status == status)
        order_test = query.order_by(OrderTest.updatedAt.desc(), OrderTest.id.desc()).first()
        if not order_test:
            status_msg = f" with status '{status.value}'" if status else ""
            raise LabOperationError(
                f"Test {test_code} not found in order {order_id}{status_msg}",
                status_code=404,
            )
        return order_test

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

    def _count_remedies(
        self,
        *,
        order_id: int,
        test_code: Optional[str],
        sample_id: Optional[int],
        remedy: RemedyType,
    ) -> int:
        query = self.db.query(QualityIssue).filter(
            QualityIssue.orderId == order_id,
            QualityIssue.remedy == remedy,
        )
        if test_code:
            query = query.filter(QualityIssue.testCode == test_code)
        if sample_id:
            query = query.filter(QualityIssue.sampleId == sample_id)
        return query.count()

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

    def _revive_suspended_tests(self, rejected_sample: Sample, new_sample: Sample) -> None:
        for test in self._linked_tests(
            rejected_sample,
            exclude=[TestStatus.SUPERSEDED, TestStatus.REMOVED, TestStatus.CANCELLED],
        ):
            if test.status != TestStatus.SUSPENDED:
                continue
            TestStateMachine.validate_transition(TestStatus.SUSPENDED, TestStatus.PENDING)
            test.status = TestStatus.PENDING
            test.sampleId = new_sample.sampleId
            test.results = None
            test.resultEnteredAt = None
            test.enteredBy = None
            test.technicianNotes = None
            test.resultValidatedAt = None
            test.validatedBy = None
            test.validationNotes = None

    def _reject_sample_record(
        self,
        sample: Sample,
        user_id: int,
        reason: str,
        notes: Optional[str],
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

        linked = self._linked_tests(sample, exclude=[TestStatus.SUPERSEDED, TestStatus.REMOVED])
        for order_test in linked:
            if order_test.status in _SAMPLE_ESCALATE_STATUSES:
                self.escalation.escalate_test(
                    order_test,
                    EscalationReasonCode.REJ_SAMP,
                    user_id,
                    metadata={"rejectionReason": reason, "rejectionNotes": notes},
                    sample_id=sample.sampleId,
                    from_status=order_test.status,
                )
            elif order_test.status in _SAMPLE_SUSPEND_STATUSES:
                TestStateMachine.validate_transition(order_test.status, TestStatus.SUSPENDED)
                order_test.status = TestStatus.SUSPENDED

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
        suspended = sum(1 for t in linked if t.status in _SAMPLE_SUSPEND_STATUSES)

        if resulted or validated:
            preview = RemedyType.ESCALATE
            message = "Tests with results will be escalated to supervisor."
        elif will_escalate:
            preview = RemedyType.ESCALATE
            message = "Recollection limit reached — supervisor review required."
        else:
            preview = RemedyType.RECOLLECT
            message = "A new collection will be requested."

        criteria = RejectionCriteriaService(self.db).get_criteria_for_tests(sample.testCodes)

        return QualityIssueOptions(
            targetType=QualityIssueTargetType.SAMPLE,
            targetId=sample_id,
            orderId=sample.orderId,
            sampleId=sample_id,
            stage=QualityStage.COLLECTION,
            allowedCriteria=criteria,
            recollectionAttemptsUsed=recollection_used,
            recollectionAttemptsRemaining=recollection_remaining,
            willEscalate=will_escalate or bool(resulted or validated),
            previewRemedy=preview,
            previewMessage=message,
            resultedTestsCount=resulted,
            validatedTestsCount=validated,
            suspendedTestsCount=suspended,
        )

    def _test_options(self, order_test_id: int) -> QualityIssueOptions:
        order_test = self.db.query(OrderTest).filter(OrderTest.id == order_test_id).first()
        if not order_test:
            raise LabOperationError(f"Test {order_test_id} not found", status_code=404)
        if order_test.status != TestStatus.RESULTED:
            raise LabOperationError("Only resulted tests can be reported at validation", status_code=400)

        root = self._chain_root_test(order_test)
        retest_used = self._count_remedies(
            order_id=order_test.orderId,
            test_code=order_test.testCode,
            sample_id=None,
            remedy=RemedyType.RETRY_SAME_SAMPLE,
        )
        retest_remaining = max(0, MAX_RETEST_ATTEMPTS - retest_used - 1)
        will_escalate = retest_remaining == 0

        sample_remaining = 0
        if order_test.sampleId:
            sample = self._get_sample(order_test.sampleId)
            sample_remaining = self.collection.attempts_remaining_after(sample)

        criteria = RejectionCriteriaService(self.db).get_criteria_for_test(order_test.testCode)
        has_specimen = any(is_specimen_rejection_reason(c) for c in criteria)

        if will_escalate:
            preview = RemedyType.ESCALATE
            message = "Rejection limit reached — will escalate to supervisor."
        elif has_specimen and sample_remaining > 0 and order_test.sampleId:
            preview = RemedyType.RECOLLECT
            message = "Specimen issue — new collection will be requested when applicable."
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
        RejectionCriteriaService(self.db).validate_for_tests(sample.testCodes, reason)
        options = self._sample_options(sample_id)

        self._reject_sample_record(sample, user_id, reason, notes)

        linked = self._linked_tests(sample, exclude=[TestStatus.SUPERSEDED, TestStatus.REMOVED])
        has_resulted = any(t.status in _SAMPLE_ESCALATE_STATUSES for t in linked)

        if has_resulted or options.willEscalate:
            if options.willEscalate and not has_resulted:
                for order_test in linked:
                    if order_test.status == TestStatus.SUSPENDED:
                        self.escalation.escalate_test(
                            order_test,
                            EscalationReasonCode.REJ_SAMP,
                            user_id,
                            metadata={"rejectionReason": reason, "rejectionNotes": notes},
                            sample_id=sample_id,
                            from_status=TestStatus.SUSPENDED,
                        )

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

        new_sample = self._create_recollection_sample(sample, user_id, reason)
        self._revive_suspended_tests(sample, new_sample)

        issue = self._record_issue(
            order_id=sample.orderId,
            stage=QualityStage.COLLECTION,
            domain=QualityDomain.SPECIMEN,
            reason=reason,
            notes=notes,
            remedy=RemedyType.RECOLLECT,
            user_id=user_id,
            sample_id=sample_id,
            created_sample_id=new_sample.sampleId,
        )

        self.audit.log_recollection_request(
            original_sample_id=sample.sampleId,
            new_sample_id=new_sample.sampleId,
            user_id=user_id,
            recollection_reason=reason,
            recollection_attempt=new_sample.recollectionAttempt,
            comment=notes,
        )

        self.db.commit()
        update_order_status(self.db, sample.orderId)
        return QualityIssueResult(
            success=True,
            remedy=RemedyType.RECOLLECT,
            message="Sample rejected and recollection requested.",
            qualityIssueId=issue.id,
            orderId=sample.orderId,
            sampleId=sample_id,
            createdSampleId=new_sample.sampleId,
        )

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

        RejectionCriteriaService(self.db).validate_for_test(order_test.testCode, reason)
        options = self._test_options(order_test_id)
        is_specimen = is_specimen_rejection_reason(reason)

        if options.willEscalate:
            return self._escalate_test_issue(order_test, user_id, reason, notes, QualityDomain.ANALYTICAL)

        if is_specimen and options.recollectionAttemptsRemaining > 0 and order_test.sampleId:
            return self._recollect_from_validation(order_test, user_id, reason, notes)

        if preferred_remedy == RemedyType.RECOLLECT and order_test.sampleId and options.recollectionAttemptsRemaining > 0:
            return self._recollect_from_validation(order_test, user_id, reason, notes)

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

    def _recollect_from_validation(
        self,
        order_test: OrderTest,
        user_id: int,
        reason: str,
        notes: Optional[str],
    ) -> QualityIssueResult:
        if not order_test.sampleId:
            raise LabOperationError("No sample linked to this test", status_code=400)

        sample = self._get_sample(order_test.sampleId)
        can_reject, reject_reason = SampleStateMachine.can_reject(sample.status)
        if not can_reject:
            raise LabOperationError(reject_reason, status_code=400)

        self._reject_sample_record(sample, user_id, reason, notes)
        new_sample = self._create_recollection_sample(sample, user_id, reason)
        self._revive_suspended_tests(sample, new_sample)

        TestStateMachine.validate_transition(order_test.status, TestStatus.SUPERSEDED)
        order_test.status = TestStatus.SUPERSEDED

        new_test = OrderTest(
            orderId=order_test.orderId,
            testCode=order_test.testCode,
            status=TestStatus.PENDING,
            priceAtOrder=order_test.priceAtOrder,
            sampleId=new_sample.sampleId,
            isRetest=True,
            retestOfTestId=order_test.id,
            retestNumber=0,
            technicianNotes=f"Recollection from validation: {reason}",
            flags=order_test.flags,
            isReflexTest=order_test.isReflexTest,
            triggeredBy=order_test.triggeredBy,
            reflexRule=order_test.reflexRule,
        )
        self.db.add(new_test)
        self.db.flush()
        order_test.retestOrderTestId = new_test.id

        self.audit.log_recollection_request(
            original_sample_id=sample.sampleId,
            new_sample_id=new_sample.sampleId,
            user_id=user_id,
            recollection_reason=reason,
            recollection_attempt=new_sample.recollectionAttempt,
            comment=notes,
        )

        issue = self._record_issue(
            order_id=order_test.orderId,
            stage=QualityStage.VALIDATION,
            domain=QualityDomain.SPECIMEN,
            reason=reason,
            notes=notes,
            remedy=RemedyType.RECOLLECT,
            user_id=user_id,
            order_test_id=order_test.id,
            sample_id=sample.sampleId,
            test_code=order_test.testCode,
            created_test_id=new_test.id,
            created_sample_id=new_sample.sampleId,
        )

        self.db.commit()
        update_order_status(self.db, order_test.orderId)
        return QualityIssueResult(
            success=True,
            remedy=RemedyType.RECOLLECT,
            message="Sample rejected and recollection requested.",
            qualityIssueId=issue.id,
            orderId=order_test.orderId,
            testCode=order_test.testCode,
            orderTestId=order_test.id,
            createdTestId=new_test.id,
            createdSampleId=new_sample.sampleId,
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
