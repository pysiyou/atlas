"""
Recollection request workflow — supervisor approval before patient redraw.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, List, Optional

from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.models.order import Order, OrderTest
from app.models.patient import Patient
from app.models.recollection_request import RecollectionRequest
from app.models.sample import Sample
from app.schemas.enums import (
    LabOperationType,
    QualityDomain,
    QualityStage,
    RecollectionRequestStatus,
    RemedyType,
    SampleStatus,
    TestStatus,
)
from app.services.audit_service import AuditService
from app.services.order_status_updater import update_order_status
from app.services.sample_collection import SampleCollectionService
from app.services.state_machine import SampleStateMachine, TestStateMachine
from app.utils.exceptions import LabOperationError


class RecollectionRequestSummary(BaseModel):
    id: int
    orderId: int
    qualityIssueId: Optional[int] = None
    rejectedSampleId: int
    orderTestId: Optional[int] = None
    stage: str
    status: str
    reason: str
    notes: Optional[str] = None
    testCodes: List[str]
    affectedOrderTestIds: List[int]
    recollectionAttemptsUsed: int
    recollectionAttemptsRemaining: int
    requiresSupervisorOverride: bool
    requestedByUserId: str
    reviewedByUserId: Optional[str] = None
    reviewNotes: Optional[str] = None
    reviewedAt: Optional[str] = None
    createdSampleId: Optional[int] = None
    createdTestId: Optional[int] = None
    createdAt: str
    patientId: Optional[int] = None
    patientName: Optional[str] = None
    orderNumber: Optional[str] = None
    sampleType: Optional[str] = None


class RecollectionRequestResult(BaseModel):
    success: bool
    message: str
    requestId: int
    status: str
    createdSampleId: Optional[int] = None
    createdTestId: Optional[int] = None


class RecollectionRequestService:
    def __init__(self, db: Session, audit: AuditService, quality_service: Any):
        self.db = db
        self.audit = audit
        self.quality = quality_service
        self.collection = SampleCollectionService(db)

    def _to_summary(self, request: RecollectionRequest) -> RecollectionRequestSummary:
        order = self.db.query(Order).filter(Order.orderId == request.orderId).first()
        patient = None
        if order:
            patient = self.db.query(Patient).filter(Patient.id == order.patientId).first()
        sample = (
            self.db.query(Sample).filter(Sample.sampleId == request.rejectedSampleId).first()
        )
        return RecollectionRequestSummary(
            id=request.id,
            orderId=request.orderId,
            qualityIssueId=request.qualityIssueId,
            rejectedSampleId=request.rejectedSampleId,
            orderTestId=request.orderTestId,
            stage=request.stage.value,
            status=request.status.value,
            reason=request.reason,
            notes=request.notes,
            testCodes=list(request.testCodes or []),
            affectedOrderTestIds=list(request.affectedOrderTestIds or []),
            recollectionAttemptsUsed=request.recollectionAttemptsUsed,
            recollectionAttemptsRemaining=request.recollectionAttemptsRemaining,
            requiresSupervisorOverride=request.requiresSupervisorOverride,
            requestedByUserId=request.requestedByUserId,
            reviewedByUserId=request.reviewedByUserId,
            reviewNotes=request.reviewNotes,
            reviewedAt=request.reviewedAt.isoformat() if request.reviewedAt else None,
            createdSampleId=request.createdSampleId,
            createdTestId=request.createdTestId,
            createdAt=request.createdAt.isoformat(),
            patientId=order.patientId if order else None,
            patientName=patient.fullName if patient else None,
            orderNumber=str(order.orderId) if order else None,
            sampleType=sample.sampleType.value if sample else None,
        )

    def list_pending(self) -> List[RecollectionRequestSummary]:
        rows = (
            self.db.query(RecollectionRequest)
            .filter(RecollectionRequest.status == RecollectionRequestStatus.PENDING_APPROVAL)
            .order_by(RecollectionRequest.createdAt.asc())
            .all()
        )
        return [self._to_summary(row) for row in rows]

    def get_request(self, request_id: int) -> RecollectionRequest:
        row = self.db.query(RecollectionRequest).filter(RecollectionRequest.id == request_id).first()
        if not row:
            raise LabOperationError(f"Recollection request {request_id} not found", status_code=404)
        return row

    def create_from_collection(
        self,
        *,
        sample: Sample,
        user_id: int,
        reason: str,
        notes: Optional[str],
        quality_issue_id: int,
        affected_tests: List[OrderTest],
    ) -> RecollectionRequest:
        attempts_used = self.collection.attempts_used(sample)
        attempts_remaining = self.collection.attempts_remaining_after(sample)
        request = RecollectionRequest(
            orderId=sample.orderId,
            qualityIssueId=quality_issue_id,
            rejectedSampleId=sample.sampleId,
            orderTestId=None,
            stage=QualityStage.COLLECTION,
            status=RecollectionRequestStatus.PENDING_APPROVAL,
            reason=reason,
            notes=notes,
            testCodes=list(sample.testCodes or []),
            affectedOrderTestIds=[t.id for t in affected_tests if t.id is not None],
            recollectionAttemptsUsed=attempts_used,
            recollectionAttemptsRemaining=attempts_remaining,
            requiresSupervisorOverride=attempts_remaining == 0,
            requestedByUserId=str(user_id),
        )
        self.db.add(request)
        self.db.flush()
        self.audit.log_operation(
            operation_type=LabOperationType.RECOLLECTION_REQUEST_CREATED,
            entity_type="order",
            entity_id=sample.orderId,
            user_id=user_id,
            metadata={
                "requestId": request.id,
                "rejectedSampleId": sample.sampleId,
                "stage": QualityStage.COLLECTION.value,
            },
        )
        return request

    def create_from_validation(
        self,
        *,
        sample: Sample,
        order_test: OrderTest,
        user_id: int,
        reason: str,
        notes: Optional[str],
        quality_issue_id: int,
        affected_tests: List[OrderTest],
    ) -> RecollectionRequest:
        attempts_used = self.collection.attempts_used(sample)
        attempts_remaining = self.collection.attempts_remaining_after(sample)
        request = RecollectionRequest(
            orderId=sample.orderId,
            qualityIssueId=quality_issue_id,
            rejectedSampleId=sample.sampleId,
            orderTestId=order_test.id,
            stage=QualityStage.VALIDATION,
            status=RecollectionRequestStatus.PENDING_APPROVAL,
            reason=reason,
            notes=notes,
            testCodes=[order_test.testCode],
            affectedOrderTestIds=[t.id for t in affected_tests if t.id is not None],
            recollectionAttemptsUsed=attempts_used,
            recollectionAttemptsRemaining=attempts_remaining,
            requiresSupervisorOverride=attempts_remaining == 0,
            requestedByUserId=str(user_id),
        )
        self.db.add(request)
        self.db.flush()
        self.audit.log_operation(
            operation_type=LabOperationType.RECOLLECTION_REQUEST_CREATED,
            entity_type="order",
            entity_id=sample.orderId,
            user_id=user_id,
            metadata={
                "requestId": request.id,
                "rejectedSampleId": sample.sampleId,
                "orderTestId": order_test.id,
                "stage": QualityStage.VALIDATION.value,
            },
        )
        return request

    def approve(self, request_id: int, user_id: int, review_notes: Optional[str] = None) -> RecollectionRequestResult:
        request = self.get_request(request_id)
        if request.status != RecollectionRequestStatus.PENDING_APPROVAL:
            raise LabOperationError("Only pending recollection requests can be approved", status_code=400)

        sample = self.db.query(Sample).filter(Sample.sampleId == request.rejectedSampleId).first()
        if not sample:
            raise LabOperationError("Rejected sample not found", status_code=404)

        # Validate that there are pending tests to reattach (collection-stage recollection)
        # or that the original test is still superseded (validation-stage recollection)
        pending_tests_to_reattach = [
            test for test in self.quality._linked_tests(
                sample,
                exclude=[TestStatus.SUPERSEDED, TestStatus.REMOVED, TestStatus.CANCELLED],
            )
            if test.status == TestStatus.PENDING and test.sampleId == sample.sampleId
        ]
        
        # For validation-stage requests, check if the original test is still superseded
        original_test_valid = False
        if request.orderTestId and request.stage == QualityStage.VALIDATION:
            original_test = (
                self.db.query(OrderTest).filter(OrderTest.id == request.orderTestId).first()
            )
            original_test_valid = original_test and original_test.status == TestStatus.SUPERSEDED
        
        # If no pending tests to reattach and no valid original test for validation-stage, reject approval
        if not pending_tests_to_reattach and not original_test_valid:
            raise LabOperationError(
                "Cannot approve recollection request: no pending tests remain to recollect. "
                "All affected tests have been cancelled, validated, or are no longer associated with this request.",
                status_code=400
            )

        supervisor_override = request.requiresSupervisorOverride
        new_sample = self.quality._create_recollection_sample(
            sample,
            user_id,
            request.reason,
            supervisor_authorized=supervisor_override,
        )
        self.quality._reattach_tests_to_recollection(sample, new_sample)

        created_test_id: Optional[int] = None
        if request.orderTestId and request.stage == QualityStage.VALIDATION:
            original_test = (
                self.db.query(OrderTest).filter(OrderTest.id == request.orderTestId).first()
            )
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
                    technicianNotes=f"Approved recollection: {request.reason}",
                    flags=original_test.flags,
                    isReflexTest=original_test.isReflexTest,
                    triggeredBy=original_test.triggeredBy,
                    reflexRule=original_test.reflexRule,
                )
                self.db.add(new_test)
                self.db.flush()
                created_test_id = new_test.id
                original_test.retestOrderTestId = new_test.id

        request.status = RecollectionRequestStatus.APPROVED
        request.reviewedByUserId = str(user_id)
        request.reviewNotes = review_notes
        request.reviewedAt = datetime.now(timezone.utc)
        request.createdSampleId = new_sample.sampleId
        request.createdTestId = created_test_id

        self.audit.log_recollection_request(
            original_sample_id=sample.sampleId,
            new_sample_id=new_sample.sampleId,
            user_id=user_id,
            recollection_reason=request.reason,
            recollection_attempt=new_sample.recollectionAttempt,
            comment=review_notes or request.notes,
        )
        self.audit.log_operation(
            operation_type=LabOperationType.RECOLLECTION_REQUEST_APPROVED,
            entity_type="order",
            entity_id=request.orderId,
            user_id=user_id,
            metadata={"requestId": request.id, "createdSampleId": new_sample.sampleId},
        )

        self.db.commit()
        update_order_status(self.db, request.orderId)
        return RecollectionRequestResult(
            success=True,
            message="Recollection approved. Pending sample created for collection.",
            requestId=request.id,
            status=request.status.value,
            createdSampleId=new_sample.sampleId,
            createdTestId=created_test_id,
        )

    def deny(
        self,
        request_id: int,
        user_id: int,
        review_notes: Optional[str] = None,
    ) -> RecollectionRequestResult:
        request = self.get_request(request_id)
        if request.status != RecollectionRequestStatus.PENDING_APPROVAL:
            raise LabOperationError("Only pending recollection requests can be denied", status_code=400)

        cancel_reason = review_notes or f"Recollection denied: {request.reason}"
        test_ids: set[int] = set(request.affectedOrderTestIds or [])
        if request.orderTestId:
            test_ids.add(request.orderTestId)

        for test_id in test_ids:
            order_test = self.db.query(OrderTest).filter(OrderTest.id == test_id).first()
            if not order_test:
                continue
            # Leave released and in-review results for validator / amendment paths.
            if order_test.status in {
                TestStatus.VALIDATED,
                TestStatus.CANCELLED,
                TestStatus.RESULTED,
            }:
                continue

            # Validation rejections supersede the originating test before approval.
            # Deny must still close that line so it does not linger as a ghost superseded row.
            if order_test.status == TestStatus.SUPERSEDED:
                if test_id != request.orderTestId:
                    continue
                order_test.status = TestStatus.CANCELLED
            elif not TestStateMachine.can_transition(order_test.status, TestStatus.CANCELLED):
                continue
            else:
                order_test.status = TestStatus.CANCELLED

            order_test.validationNotes = cancel_reason
            self.quality._record_issue(
                order_id=request.orderId,
                stage=request.stage,
                domain=QualityDomain.SPECIMEN,
                reason=cancel_reason,
                notes=review_notes,
                remedy=RemedyType.CANCEL,
                user_id=user_id,
                order_test_id=order_test.id,
                sample_id=order_test.sampleId or request.rejectedSampleId,
                test_code=order_test.testCode,
            )

        request.status = RecollectionRequestStatus.DENIED
        request.reviewedByUserId = str(user_id)
        request.reviewNotes = review_notes
        request.reviewedAt = datetime.now(timezone.utc)

        self.audit.log_operation(
            operation_type=LabOperationType.RECOLLECTION_REQUEST_DENIED,
            entity_type="order",
            entity_id=request.orderId,
            user_id=user_id,
            metadata={"requestId": request.id, "reviewNotes": review_notes},
        )

        self.db.commit()
        update_order_status(self.db, request.orderId)
        return RecollectionRequestResult(
            success=True,
            message="Recollection request denied. Affected tests cancelled.",
            requestId=request.id,
            status=request.status.value,
        )

    def mark_fulfilled_when_sample_collected(self, sample_id: int) -> None:
        """When a recollection tube is collected, mark the approved request fulfilled."""
        request = (
            self.db.query(RecollectionRequest)
            .filter(
                RecollectionRequest.createdSampleId == sample_id,
                RecollectionRequest.status == RecollectionRequestStatus.APPROVED,
            )
            .first()
        )
        if request:
            request.status = RecollectionRequestStatus.FULFILLED
