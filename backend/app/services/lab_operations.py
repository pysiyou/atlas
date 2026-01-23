"""
Unified Lab Operations Service

Provides a single entry point for all laboratory operations.
Coordinates state machine validation, audit logging, and business logic.
"""
from datetime import datetime, timezone
from typing import Tuple, List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from pydantic import BaseModel

from app.models.sample import Sample
from app.models.order import Order, OrderTest
from app.schemas.enums import (
    SampleStatus, TestStatus, PriorityLevel,
    RejectionAction, LabOperationType
)
from app.services.state_machine import SampleStateMachine, TestStateMachine, StateTransitionError
from app.services.audit_service import AuditService
from app.services.order_status_updater import update_order_status


# Constants for limits
MAX_RETEST_ATTEMPTS = 3
MAX_RECOLLECTION_ATTEMPTS = 3


class LabOperationError(Exception):
    """Custom exception for lab operation errors"""
    def __init__(self, message: str, status_code: int = 400, error_code: str = "LAB_OPERATION_ERROR"):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        super().__init__(self.message)


class AvailableAction(BaseModel):
    """Represents an available rejection action"""
    action: RejectionAction
    enabled: bool
    disabledReason: Optional[str] = None
    label: str
    description: str


class RejectionOptions(BaseModel):
    """Response for rejection options query"""
    canRetest: bool
    retestAttemptsRemaining: int
    canRecollect: bool
    recollectionAttemptsRemaining: int
    availableActions: List[AvailableAction]
    escalationRequired: bool = False


class RejectionResult(BaseModel):
    """Result of a rejection operation"""
    success: bool
    action: RejectionAction
    message: str
    originalTestId: int
    newTestId: Optional[int] = None
    newSampleId: Optional[int] = None
    escalationRequired: bool = False


class LabOperationsService:
    """
    Unified service for all laboratory operations.

    This service coordinates:
    - State machine validation
    - Audit logging
    - Business logic for samples and tests
    - Rejection options and actions
    """

    def __init__(self, db: Session):
        self.db = db
        self.audit = AuditService(db)

    # ==================== HELPER METHODS ====================

    def _get_sample(self, sample_id: int) -> Sample:
        """Get a sample by ID or raise an error"""
        sample = self.db.query(Sample).filter(Sample.sampleId == sample_id).first()
        if not sample:
            raise LabOperationError(f"Sample {sample_id} not found", status_code=404)
        return sample

    def _get_order_test(
        self,
        order_id: int,
        test_code: str,
        status: Optional[TestStatus] = None
    ) -> OrderTest:
        """Get an order test by order ID and test code, optionally filtered by status"""
        query = self.db.query(OrderTest).filter(
            OrderTest.orderId == order_id,
            OrderTest.testCode == test_code
        )
        if status:
            query = query.filter(OrderTest.status == status)

        order_test = query.first()
        if not order_test:
            status_msg = f" with status '{status.value}'" if status else ""
            raise LabOperationError(
                f"Test {test_code} not found in order {order_id}{status_msg}",
                status_code=404
            )
        return order_test

    def _serialize_sample_state(self, sample: Sample) -> Dict[str, Any]:
        """Serialize sample state for audit logging"""
        return {
            "sampleId": sample.sampleId,
            "status": sample.status.value if sample.status else None,
            "collectedAt": sample.collectedAt.isoformat() if sample.collectedAt else None,
            "rejectedAt": sample.rejectedAt.isoformat() if sample.rejectedAt else None,
            "recollectionAttempt": sample.recollectionAttempt
        }

    def _serialize_test_state(self, order_test: OrderTest) -> Dict[str, Any]:
        """Serialize test state for audit logging"""
        return {
            "id": order_test.id,
            "testCode": order_test.testCode,
            "status": order_test.status.value if order_test.status else None,
            "sampleId": order_test.sampleId,
            "retestNumber": order_test.retestNumber,
            "isRetest": order_test.isRetest
        }

    # ==================== REJECTION OPTIONS ====================

    def get_rejection_options(
        self,
        order_id: int,
        test_code: str
    ) -> RejectionOptions:
        """
        Get available rejection actions for a test.

        Args:
            order_id: The order ID
            test_code: The test code

        Returns:
            RejectionOptions with available actions and their status
        """
        order_test = self._get_order_test(order_id, test_code, status=TestStatus.RESULTED)
        sample = self._get_sample(order_test.sampleId) if order_test.sampleId else None

        # Calculate retest availability
        current_retest_number = order_test.retestNumber or 0
        can_retest = current_retest_number < MAX_RETEST_ATTEMPTS
        retest_attempts_remaining = MAX_RETEST_ATTEMPTS - current_retest_number

        # Calculate recollection availability
        recollection_attempt = sample.recollectionAttempt if sample else 1
        can_recollect = recollection_attempt <= MAX_RECOLLECTION_ATTEMPTS if sample else False
        recollection_attempts_remaining = MAX_RECOLLECTION_ATTEMPTS - (recollection_attempt - 1) if sample else 0

        # Build available actions
        available_actions = []

        # Retest action
        retest_action = AvailableAction(
            action=RejectionAction.RETEST_SAME_SAMPLE,
            enabled=can_retest,
            disabledReason=f"Maximum {MAX_RETEST_ATTEMPTS} retest attempts reached" if not can_retest else None,
            label="Re-test (Same Sample)",
            description="Run the test again using the existing sample"
        )
        available_actions.append(retest_action)

        # Recollect action
        recollect_action = AvailableAction(
            action=RejectionAction.RECOLLECT_NEW_SAMPLE,
            enabled=can_recollect,
            disabledReason=f"Maximum {MAX_RECOLLECTION_ATTEMPTS} recollection attempts reached" if not can_recollect else None,
            label="Request New Sample",
            description="Reject the current sample and request a new collection"
        )
        available_actions.append(recollect_action)

        # Check if escalation is required
        escalation_required = not can_retest and not can_recollect

        if escalation_required:
            escalate_action = AvailableAction(
                action=RejectionAction.ESCALATE_TO_SUPERVISOR,
                enabled=True,
                label="Escalate to Supervisor",
                description="All rejection options exhausted. Please escalate."
            )
            available_actions.append(escalate_action)

        return RejectionOptions(
            canRetest=can_retest,
            retestAttemptsRemaining=retest_attempts_remaining,
            canRecollect=can_recollect,
            recollectionAttemptsRemaining=recollection_attempts_remaining,
            availableActions=available_actions,
            escalationRequired=escalation_required
        )

    # ==================== SAMPLE OPERATIONS ====================

    def collect_sample(
        self,
        sample_id: int,
        user_id: int,
        collected_volume: float,
        container_type: str,
        container_color: str,
        collection_notes: Optional[str] = None
    ) -> Sample:
        """
        Collect a sample.

        Args:
            sample_id: The sample ID
            user_id: The user performing the collection
            collected_volume: Volume collected
            container_type: Type of container used
            container_color: Color of container used
            collection_notes: Optional notes

        Returns:
            The updated sample
        """
        sample = self._get_sample(sample_id)
        before_state = self._serialize_sample_state(sample)

        # Validate state transition
        SampleStateMachine.validate_transition(sample.status, SampleStatus.COLLECTED)

        # Update sample
        sample.status = SampleStatus.COLLECTED
        sample.collectedAt = datetime.now(timezone.utc)
        sample.collectedBy = str(user_id)  # Convert to string as per model requirement
        sample.collectedVolume = collected_volume
        sample.actualContainerType = container_type
        sample.actualContainerColor = container_color
        sample.collectionNotes = collection_notes
        sample.remainingVolume = collected_volume
        sample.updatedBy = str(user_id)  # Convert to string as per model requirement

        # Update associated order tests
        # Exclude SUPERSEDED tests - they were replaced by retests and should not be modified
        order_tests = self.db.query(OrderTest).filter(
            OrderTest.orderId == sample.orderId,
            OrderTest.testCode.in_(sample.testCodes),
            OrderTest.status != TestStatus.SUPERSEDED
        ).all()

        for order_test in order_tests:
            order_test.status = TestStatus.SAMPLE_COLLECTED
            order_test.sampleId = sample_id

        after_state = self._serialize_sample_state(sample)

        # Log audit
        self.audit.log_sample_collection(
            sample_id=sample_id,
            user_id=user_id,
            before_state=before_state,
            after_state=after_state,
            metadata={"testCodes": sample.testCodes}
        )

        self.db.commit()
        self.db.refresh(sample)

        # Update order status
        update_order_status(self.db, sample.orderId)

        return sample

    def reject_sample(
        self,
        sample_id: int,
        user_id: int,
        rejection_reasons: List[str],
        rejection_notes: Optional[str] = None,
        recollection_required: bool = True
    ) -> Sample:
        """
        Reject a sample.

        Args:
            sample_id: The sample ID
            user_id: The user performing the rejection
            rejection_reasons: List of rejection reason codes
            rejection_notes: Optional notes
            recollection_required: Whether recollection is required

        Returns:
            The updated sample
        """
        sample = self._get_sample(sample_id)
        before_state = self._serialize_sample_state(sample)

        # Validate state transition
        can_reject, reason = SampleStateMachine.can_reject(sample.status)
        if not can_reject:
            raise LabOperationError(reason)

        # Create rejection record
        rejection_record = {
            "rejectedAt": datetime.now(timezone.utc).isoformat(),
            "rejectedBy": str(user_id),  # Convert to string as per schema requirement
            "rejectionReasons": rejection_reasons,
            "rejectionNotes": rejection_notes,
            "recollectionRequired": recollection_required
        }

        # Initialize rejection history if needed
        if sample.rejectionHistory is None:
            sample.rejectionHistory = []
        sample.rejectionHistory.append(rejection_record)
        flag_modified(sample, 'rejectionHistory')

        # Update sample
        sample.status = SampleStatus.REJECTED
        sample.rejectedAt = datetime.now(timezone.utc)
        sample.rejectedBy = str(user_id)  # Convert to string as per schema requirement
        sample.rejectionReasons = rejection_reasons
        sample.rejectionNotes = rejection_notes
        sample.recollectionRequired = recollection_required
        sample.updatedBy = str(user_id)  # Convert to string as per model requirement

        # Update associated order tests
        # Exclude SUPERSEDED tests - they were replaced by retests and should not be modified
        order_tests = self.db.query(OrderTest).filter(
            OrderTest.orderId == sample.orderId,
            OrderTest.testCode.in_(sample.testCodes),
            OrderTest.status != TestStatus.SUPERSEDED
        ).all()

        for order_test in order_tests:
            order_test.status = TestStatus.REJECTED

        after_state = self._serialize_sample_state(sample)

        # Log audit
        self.audit.log_sample_rejection(
            sample_id=sample_id,
            user_id=user_id,
            before_state=before_state,
            after_state=after_state,
            rejection_reasons=rejection_reasons,
            recollection_required=recollection_required
        )

        self.db.commit()
        self.db.refresh(sample)

        # Update order status
        update_order_status(self.db, sample.orderId)

        return sample

    def request_recollection(
        self,
        sample_id: int,
        user_id: int,
        recollection_reason: str,
        update_order_tests: bool = True
    ) -> Sample:
        """
        Request recollection for a rejected sample.

        Args:
            sample_id: The rejected sample ID
            user_id: The user requesting recollection
            recollection_reason: Reason for recollection
            update_order_tests: Whether to update order tests to point to new sample

        Returns:
            The newly created recollection sample
        """
        original_sample = self._get_sample(sample_id)

        # Validate sample state
        if original_sample.status != SampleStatus.REJECTED:
            raise LabOperationError("Only rejected samples can be recollected")

        if original_sample.recollectionSampleId:
            raise LabOperationError(
                f"Recollection already requested. New sample: {original_sample.recollectionSampleId}"
            )

        # Check recollection limit.
        # Note: When called from reject_and_recollect, the rejectionHistory already includes
        # the current rejection (added by reject_sample). We use ">" to allow exactly
        # MAX_RECOLLECTION_ATTEMPTS recollections. The pre-check in reject_and_recollect
        # uses ">=" on the history BEFORE the new rejection is added.
        rejection_count = len(original_sample.rejectionHistory or [])
        if rejection_count > MAX_RECOLLECTION_ATTEMPTS:
            raise LabOperationError(
                f"Maximum recollection attempts ({MAX_RECOLLECTION_ATTEMPTS}) reached. Please escalate to supervisor."
            )

        # Calculate recollection attempt number
        recollection_attempt = len(original_sample.rejectionHistory or []) + 1

        # Create new sample
        new_sample = Sample(
            orderId=original_sample.orderId,
            sampleType=original_sample.sampleType,
            status=SampleStatus.PENDING,
            testCodes=original_sample.testCodes,
            requiredVolume=original_sample.requiredVolume,
            priority=PriorityLevel.URGENT,  # Escalate priority
            requiredContainerTypes=original_sample.requiredContainerTypes,
            requiredContainerColors=original_sample.requiredContainerColors,
            isRecollection=True,
            originalSampleId=original_sample.sampleId,
            recollectionReason=recollection_reason,
            recollectionAttempt=recollection_attempt,
            rejectionHistory=original_sample.rejectionHistory or [],
            createdAt=datetime.now(timezone.utc),
            createdBy=str(user_id),  # Convert to string as per model requirement
            updatedBy=str(user_id)  # Convert to string as per model requirement
        )

        self.db.add(new_sample)
        self.db.flush()  # Get auto-generated sampleId

        # Link original sample to new recollection sample
        original_sample.recollectionSampleId = new_sample.sampleId
        original_sample.updatedBy = str(user_id)  # Convert to string as per model requirement

        # Update order tests to point to new sample
        # IMPORTANT: Exclude SUPERSEDED tests - these were replaced by retests and should
        # not be revived. Only update active tests that need the new sample.
        if update_order_tests:
            order_tests = self.db.query(OrderTest).filter(
                OrderTest.orderId == original_sample.orderId,
                OrderTest.testCode.in_(original_sample.testCodes),
                OrderTest.status != TestStatus.SUPERSEDED  # Don't revive superseded tests
            ).all()

            for test in order_tests:
                test.status = TestStatus.PENDING
                test.sampleId = new_sample.sampleId
                test.results = None
                test.resultEnteredAt = None
                test.enteredBy = None
                test.technicianNotes = None
                test.resultValidatedAt = None
                test.validatedBy = None
                test.validationNotes = None

        # Log audit
        self.audit.log_recollection_request(
            original_sample_id=original_sample.sampleId,
            new_sample_id=new_sample.sampleId,
            user_id=user_id,
            recollection_reason=recollection_reason,
            recollection_attempt=recollection_attempt
        )

        self.db.commit()
        self.db.refresh(new_sample)

        # Update order status
        update_order_status(self.db, original_sample.orderId)

        return new_sample

    def reject_and_recollect(
        self,
        sample_id: int,
        user_id: int,
        rejection_reasons: List[str],
        rejection_notes: Optional[str] = None,
        recollection_reason: Optional[str] = None
    ) -> Tuple[Sample, Sample]:
        """
        Combined operation: Reject a sample and immediately create a recollection.

        Args:
            sample_id: The sample ID to reject
            user_id: The user performing the operation
            rejection_reasons: List of rejection reason codes
            rejection_notes: Optional rejection notes
            recollection_reason: Optional reason for recollection (defaults to rejection notes)

        Returns:
            Tuple of (rejected_sample, new_sample)
        """
        sample = self._get_sample(sample_id)

        # Validate sample can be rejected
        can_reject, reason = SampleStateMachine.can_reject(sample.status)
        if not can_reject:
            raise LabOperationError(reason)

        # Check recollection limit before proceeding.
        # This check uses ">=" on the history BEFORE reject_sample adds the new entry.
        # This allows up to MAX_RECOLLECTION_ATTEMPTS total recollections.
        rejection_count = len(sample.rejectionHistory or [])
        if rejection_count >= MAX_RECOLLECTION_ATTEMPTS:
            raise LabOperationError(
                f"Maximum recollection attempts ({MAX_RECOLLECTION_ATTEMPTS}) reached. Please escalate to supervisor."
            )

        # Step 1: Reject the sample
        rejected_sample = self.reject_sample(
            sample_id=sample_id,
            user_id=user_id,
            rejection_reasons=rejection_reasons,
            rejection_notes=rejection_notes,
            recollection_required=True
        )

        # Refresh to get updated state
        self.db.refresh(rejected_sample)

        # Step 2: Create recollection sample
        reason = recollection_reason or rejection_notes or "Recollection requested"
        new_sample = self.request_recollection(
            sample_id=sample_id,
            user_id=user_id,
            recollection_reason=reason,
            update_order_tests=True
        )

        return rejected_sample, new_sample

    # ==================== RESULT OPERATIONS ====================

    def enter_results(
        self,
        order_id: int,
        test_code: str,
        user_id: int,
        results: Dict[str, Any],
        technician_notes: Optional[str] = None
    ) -> OrderTest:
        """
        Enter results for a test.

        Args:
            order_id: The order ID
            test_code: The test code
            user_id: The user entering results
            results: The test results
            technician_notes: Optional notes

        Returns:
            The updated order test
        """
        order_test = self._get_order_test(order_id, test_code, status=TestStatus.SAMPLE_COLLECTED)
        before_state = self._serialize_test_state(order_test)

        # Validate state transition
        can_enter, reason = TestStateMachine.can_enter_results(order_test.status)
        if not can_enter:
            raise LabOperationError(reason)

        # Update results
        order_test.results = results
        order_test.resultEnteredAt = datetime.now(timezone.utc)
        order_test.enteredBy = str(user_id)  # Convert to string as per model requirement
        order_test.technicianNotes = technician_notes
        order_test.status = TestStatus.RESULTED

        # Log audit
        self.audit.log_result_entry(
            order_id=order_id,
            test_code=test_code,
            test_id=order_test.id,
            user_id=user_id,
            results=results
        )

        self.db.commit()
        self.db.refresh(order_test)

        # Update order status
        update_order_status(self.db, order_id)

        return order_test

    def validate_results(
        self,
        order_id: int,
        test_code: str,
        user_id: int,
        validation_notes: Optional[str] = None
    ) -> OrderTest:
        """
        Approve test results.

        Args:
            order_id: The order ID
            test_code: The test code
            user_id: The user validating results
            validation_notes: Optional notes

        Returns:
            The updated order test
        """
        order_test = self._get_order_test(order_id, test_code, status=TestStatus.RESULTED)

        # Validate state transition
        can_validate, reason = TestStateMachine.can_validate(order_test.status)
        if not can_validate:
            raise LabOperationError(reason)

        # Update validation
        order_test.resultValidatedAt = datetime.now(timezone.utc)
        order_test.validatedBy = str(user_id)  # Convert to string as per model requirement
        order_test.validationNotes = validation_notes
        order_test.status = TestStatus.VALIDATED

        # Log audit
        self.audit.log_result_validation_approve(
            order_id=order_id,
            test_code=test_code,
            test_id=order_test.id,
            user_id=user_id,
            validation_notes=validation_notes
        )

        self.db.commit()
        self.db.refresh(order_test)

        # Update order status
        update_order_status(self.db, order_id)

        return order_test

    def reject_results(
        self,
        order_id: int,
        test_code: str,
        user_id: int,
        action: RejectionAction,
        rejection_reason: str
    ) -> RejectionResult:
        """
        Reject test results with specified action.

        Args:
            order_id: The order ID
            test_code: The test code
            user_id: The user rejecting results
            action: The rejection action to take
            rejection_reason: Reason for rejection

        Returns:
            RejectionResult with operation details
        """
        # Get rejection options to validate action is available
        options = self.get_rejection_options(order_id, test_code)

        # Find the requested action
        action_info = next((a for a in options.availableActions if a.action == action), None)

        if not action_info:
            raise LabOperationError(f"Action {action.value} is not available for this test")

        if not action_info.enabled:
            raise LabOperationError(action_info.disabledReason or f"Action {action.value} is disabled")

        if action == RejectionAction.RETEST_SAME_SAMPLE:
            return self._reject_with_retest(order_id, test_code, user_id, rejection_reason)
        elif action == RejectionAction.RECOLLECT_NEW_SAMPLE:
            return self._reject_with_recollect(order_id, test_code, user_id, rejection_reason)
        elif action == RejectionAction.ESCALATE_TO_SUPERVISOR:
            return RejectionResult(
                success=True,
                action=action,
                message="Escalation required. Please contact your supervisor.",
                originalTestId=self._get_order_test(order_id, test_code, TestStatus.RESULTED).id,
                escalationRequired=True
            )
        else:
            raise LabOperationError(f"Unknown rejection action: {action.value}")

    def _reject_with_retest(
        self,
        order_id: int,
        test_code: str,
        user_id: int,
        rejection_reason: str
    ) -> RejectionResult:
        """
        Reject results and create a retest (same sample).

        Creates a new OrderTest entry and marks original as SUPERSEDED.
        """
        original_test = self._get_order_test(order_id, test_code, status=TestStatus.RESULTED)

        # Get current retest number
        current_retest_number = original_test.retestNumber or 0

        # Create rejection record
        rejection_record = {
            "rejectedAt": datetime.now(timezone.utc).isoformat(),
            "rejectedBy": str(user_id),  # Convert to string as per schema requirement
            "rejectionReason": rejection_reason,
            "rejectionType": "re-test"
        }

        # Initialize rejection history if needed
        if original_test.resultRejectionHistory is None:
            original_test.resultRejectionHistory = []
        original_test.resultRejectionHistory.append(rejection_record)
        flag_modified(original_test, 'resultRejectionHistory')

        # Update original test validation metadata
        original_test.resultValidatedAt = datetime.now(timezone.utc)
        original_test.validatedBy = str(user_id)  # Convert to string as per model requirement
        original_test.validationNotes = rejection_reason

        # Create new OrderTest for retest (ID is auto-generated)
        new_order_test = OrderTest(
            orderId=order_id,
            testCode=test_code,
            status=TestStatus.SAMPLE_COLLECTED,
            priceAtOrder=original_test.priceAtOrder,
            sampleId=original_test.sampleId,
            isRetest=True,
            retestOfTestId=original_test.id,
            retestNumber=current_retest_number + 1,
            resultRejectionHistory=original_test.resultRejectionHistory,
            technicianNotes=f"Re-test #{current_retest_number + 1}: {rejection_reason}",
            flags=original_test.flags,
            isReflexTest=original_test.isReflexTest,
            triggeredBy=original_test.triggeredBy,
            reflexRule=original_test.reflexRule
        )

        self.db.add(new_order_test)
        self.db.flush()  # Get auto-generated ID

        # Mark original as superseded
        original_test.retestOrderTestId = new_order_test.id
        original_test.status = TestStatus.SUPERSEDED

        # Log audit
        self.audit.log_result_validation_reject_retest(
            order_id=order_id,
            test_code=test_code,
            original_test_id=original_test.id,
            new_test_id=new_order_test.id,
            user_id=user_id,
            rejection_reason=rejection_reason,
            retest_number=current_retest_number + 1
        )

        self.db.commit()
        self.db.refresh(new_order_test)

        # Update order status
        update_order_status(self.db, order_id)

        return RejectionResult(
            success=True,
            action=RejectionAction.RETEST_SAME_SAMPLE,
            message=f"Retest created successfully. Test is ready for new result entry.",
            originalTestId=original_test.id,
            newTestId=new_order_test.id
        )

    def _reject_with_recollect(
        self,
        order_id: int,
        test_code: str,
        user_id: int,
        rejection_reason: str
    ) -> RejectionResult:
        """
        Reject results and request sample recollection.

        Rejects the sample and creates a new recollection sample.
        """
        original_test = self._get_order_test(order_id, test_code, status=TestStatus.RESULTED)

        if not original_test.sampleId:
            raise LabOperationError("Cannot request recollection - no sample linked to this test")

        sample = self._get_sample(original_test.sampleId)

        # Validate sample can be rejected
        can_reject, reason = SampleStateMachine.can_reject(sample.status)
        if not can_reject:
            raise LabOperationError(reason)

        # Create rejection record for the test
        rejection_record = {
            "rejectedAt": datetime.now(timezone.utc).isoformat(),
            "rejectedBy": str(user_id),  # Convert to string as per schema requirement
            "rejectionReason": rejection_reason,
            "rejectionType": "re-collect"
        }

        if original_test.resultRejectionHistory is None:
            original_test.resultRejectionHistory = []
        original_test.resultRejectionHistory.append(rejection_record)
        flag_modified(original_test, 'resultRejectionHistory')

        # Update test validation metadata
        original_test.resultValidatedAt = datetime.now(timezone.utc)
        original_test.validatedBy = str(user_id)  # Convert to string as per model requirement
        original_test.validationNotes = rejection_reason

        # Reject sample and create recollection
        rejection_notes = f"Rejected during result validation: {rejection_reason}"
        rejected_sample, new_sample = self.reject_and_recollect(
            sample_id=sample.sampleId,
            user_id=user_id,
            rejection_reasons=["other"],
            rejection_notes=rejection_notes,
            recollection_reason=rejection_reason
        )

        # Log audit
        self.audit.log_result_validation_reject_recollect(
            order_id=order_id,
            test_code=test_code,
            test_id=original_test.id,
            sample_id=sample.sampleId,
            new_sample_id=new_sample.sampleId,
            user_id=user_id,
            rejection_reason=rejection_reason,
            recollection_attempt=new_sample.recollectionAttempt
        )

        self.db.commit()
        self.db.refresh(original_test)

        return RejectionResult(
            success=True,
            action=RejectionAction.RECOLLECT_NEW_SAMPLE,
            message=f"Sample rejected and recollection requested. New sample ID: {new_sample.sampleId}",
            originalTestId=original_test.id,
            newSampleId=new_sample.sampleId
        )
