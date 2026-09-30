"""
Recollection request workflow — supervisor approval before patient redraw.
"""
from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from app.models.order import Order, OrderTest
from app.models.patient import Patient
from app.models.recollection_request import RecollectionRequest
from app.models.sample import Sample
from app.schemas.enums import (
    QualityDomain,
    QualityStage,
    RecollectionRequestStatus,
    RemedyType,
    TestStatus,
)
from app.services.lab.samples import SampleCollectionService
from app.services.lab.state import TestStateMachine
from app.services.orders import update_order_status
from app.utils.exceptions import LabOperationError
from app.schemas.lab import RecollectionRequestResult, RecollectionRequestSummary
from sqlalchemy.orm import Session


class RecollectionRequestService:
    def __init__(self, db: Session, quality_service: Any | None = None):
        self.db = db
        self.quality = quality_service
        self.collection = SampleCollectionService(db)

    def _to_summary(self, request: RecollectionRequest) -> RecollectionRequestSummary:
        order = self.db.query(Order).filter(Order.orderId == request.orderId).first()
        patient = None
        if order:
            patient = self.db.query(Patient).filter(Patient.id == order.patientId).first()
        sample = self.db.query(Sample).filter(Sample.sampleId == request.rejectedSampleId).first()
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

    def list_pending(self) -> list[RecollectionRequestSummary]:
        rows = (
            self.db.query(RecollectionRequest)
            .filter(RecollectionRequest.status == RecollectionRequestStatus.PENDING_APPROVAL)
            .order_by(RecollectionRequest.createdAt.asc())
            .all()
        )
        return [self._to_summary(row) for row in rows]

    def create_from_collection(
        self,
        *,
        sample: Sample,
        user_id: int,
        reason: str,
        notes: str | None,
        quality_issue_id: int,
        affected_tests: list[OrderTest],
    ) -> RecollectionRequest:
        # Check for existing pending request for this sample
        existing = (
            self.db.query(RecollectionRequest)
            .filter(
                RecollectionRequest.rejectedSampleId == sample.sampleId,
                RecollectionRequest.status == RecollectionRequestStatus.PENDING_APPROVAL,
            )
            .first()
        )
        if existing:
            return existing  # Return existing instead of creating duplicate

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
        self.quality.emitter.sample_recollect_requested(
            sample.sampleId,
            sample.orderId,
            user_id,
            metadata={
                "request_id": request.id,
                "rejected_sample_id": sample.sampleId,
                "stage": QualityStage.COLLECTION.value,
                "test_codes": list(sample.testCodes or []),
                "affected_order_test_ids": request.affectedOrderTestIds or [],
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
        notes: str | None,
        quality_issue_id: int,
        affected_tests: list[OrderTest],
    ) -> RecollectionRequest:
        # Check for existing pending request for this sample
        existing = (
            self.db.query(RecollectionRequest)
            .filter(
                RecollectionRequest.rejectedSampleId == sample.sampleId,
                RecollectionRequest.status == RecollectionRequestStatus.PENDING_APPROVAL,
            )
            .first()
        )
        if existing:
            return existing  # Return existing instead of creating duplicate

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
        self.quality.emitter.sample_recollect_requested(
            sample.sampleId,
            sample.orderId,
            user_id,
            metadata={
                "request_id": request.id,
                "rejected_sample_id": sample.sampleId,
                "order_test_id": order_test.id,
                "stage": QualityStage.VALIDATION.value,
                "affected_order_test_ids": request.affectedOrderTestIds or [],
            },
        )
        return request

    def approve(
        self, request_id: int, user_id: int, review_notes: str | None = None
    ) -> RecollectionRequestResult:
        # Lock the request row to prevent concurrent approvals
        request = (
            self.db.query(RecollectionRequest)
            .filter(RecollectionRequest.id == request_id)
            .with_for_update()
            .first()
        )
        if not request:
            raise LabOperationError(f"Recollection request {request_id} not found", status_code=404)

        if request.status != RecollectionRequestStatus.PENDING_APPROVAL:
            raise LabOperationError(
                "Only pending recollection requests can be approved", status_code=400
            )

        sample = self.db.query(Sample).filter(Sample.sampleId == request.rejectedSampleId).first()
        if not sample:
            raise LabOperationError("Rejected sample not found", status_code=404)

        # Validate that there are pending tests to reattach (collection-stage recollection)
        # or that the original test is still superseded (validation-stage recollection)
        pending_tests_to_reattach = [
            test
            for test in self.quality._linked_tests(
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
                status_code=400,
            )

        supervisor_override = request.requiresSupervisorOverride
        new_sample = self.quality._create_recollection_sample(
            sample,
            user_id,
            request.reason,
            supervisor_authorized=supervisor_override,
        )
        self.quality._reattach_tests_to_recollection(sample, new_sample)

        created_test_id: int | None = None
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
        request.reviewedAt = datetime.now(UTC)
        request.createdSampleId = new_sample.sampleId
        request.createdTestId = created_test_id

        self.quality.emitter.sample_created(
            new_sample.sampleId,
            request.orderId,
            None,
            test_codes=list(new_sample.testCodes or []),
        )
        self.quality.emitter.sample_recollect_approved(
            new_sample.sampleId,
            request.orderId,
            user_id,
            metadata={
                "request_id": request.id,
                "rejected_sample_id": request.rejectedSampleId,
                "created_sample_id": new_sample.sampleId,
                "created_test_id": created_test_id,
                "reason": request.reason,
            },
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
        review_notes: str | None = None,
    ) -> RecollectionRequestResult:
        # Lock the request row to prevent concurrent denials
        request = (
            self.db.query(RecollectionRequest)
            .filter(RecollectionRequest.id == request_id)
            .with_for_update()
            .first()
        )
        if not request:
            raise LabOperationError(f"Recollection request {request_id} not found", status_code=404)

        if request.status != RecollectionRequestStatus.PENDING_APPROVAL:
            raise LabOperationError(
                "Only pending recollection requests can be denied", status_code=400
            )

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
        request.reviewedAt = datetime.now(UTC)

        self.quality.emitter.sample_recollect_denied(
            request.rejectedSampleId,
            request.orderId,
            user_id,
            metadata={
                "request_id": request.id,
                "review_notes": review_notes,
                "affected_order_test_ids": request.affectedOrderTestIds or [],
            },
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
