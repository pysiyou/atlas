"""
Unified Lab Operations Service

Provides a single entry point for all laboratory operations.
Coordinates state machine validation, audit logging, and business logic.
"""
from datetime import datetime, timezone
from typing import Tuple, List, Optional, Dict, Any
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from app.models.sample import Sample
from app.models.order import Order, OrderTest
from app.models.test import Test
from app.schemas.enums import (
    SampleStatus, TestStatus, PriorityLevel,
    RejectionAction, LabOperationType
)
from app.services.state_machine import SampleStateMachine, TestStateMachine, StateTransitionError
from app.services.audit_service import AuditService
from app.services.order_status_updater import update_order_status
from app.services.result_validator import ResultValidatorService
from app.services.flag_calculator import FlagCalculatorService
from app.services.critical_notification_service import CriticalNotificationService
from app.utils.exceptions import LabOperationError
from app.services.lab_rejection import (
    LabRejectionHandler,
    RejectionOptions,
    AvailableAction,
    RejectionResult,
)

# Constants for limits (used by sample/result ops; rejection limits live in lab_rejection)
MAX_RETEST_ATTEMPTS = 3
MAX_RECOLLECTION_ATTEMPTS = 3


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
        self.result_validator = ResultValidatorService()
        self.flag_calculator = FlagCalculatorService()
        self.critical_notification = CriticalNotificationService(db)
        self._rejection_handler = LabRejectionHandler(
            db,
            self.audit,
            update_order_status,
            lambda sid, uid, reasons, notes, rreason: self.reject_and_recollect(
                sid, uid, reasons, notes, rreason
            ),
        )

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

    def _get_validatable_order_test(self, order_id: int, test_code: str) -> OrderTest:
        """Get the active order test that can be validated (RESULTED or ESCALATED). Uses highest id to avoid picking a superseded row."""
        order_test = (
            self.db.query(OrderTest)
            .filter(
                OrderTest.orderId == order_id,
                OrderTest.testCode == test_code,
                OrderTest.status.in_([TestStatus.RESULTED, TestStatus.ESCALATED]),
            )
            .order_by(OrderTest.id.desc())
            .first()
        )
        if not order_test:
            raise LabOperationError(
                f"Test {test_code} not found in order {order_id} with status resulted or escalated",
                status_code=404,
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

    @staticmethod
    def _results_to_json_serializable(results: Dict[str, Any]) -> Dict[str, Any]:
        """Convert results dict to JSON-serializable form for DB/audit (Pydantic models -> dict)."""
        out: Dict[str, Any] = {}
        for k, v in results.items():
            if v is None or isinstance(v, (str, int, float, bool)):
                out[k] = v
            elif isinstance(v, BaseModel):
                out[k] = v.model_dump()
            elif isinstance(v, dict):
                out[k] = LabOperationsService._results_to_json_serializable(v)
            elif isinstance(v, list):
                out[k] = [
                    item.model_dump() if isinstance(item, BaseModel) else item
                    for item in v
                ]
            else:
                out[k] = v
        return out

    # ==================== REJECTION OPTIONS ====================

    def get_rejection_options(self, order_id: int, test_code: str) -> RejectionOptions:
        return self._rejection_handler.get_rejection_options(order_id, test_code)

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
        # Exclude SUPERSEDED and REMOVED tests - they were replaced by retests or removed from order and should not be modified
        order_tests = self.db.query(OrderTest).filter(
            OrderTest.orderId == sample.orderId,
            OrderTest.testCode.in_(sample.testCodes),
            OrderTest.status.notin_([TestStatus.SUPERSEDED, TestStatus.REMOVED])
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
            metadata={"testCodes": sample.testCodes},
            comment=collection_notes
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
        # Exclude SUPERSEDED and REMOVED tests - they were replaced by retests or removed from order and should not be modified
        order_tests = self.db.query(OrderTest).filter(
            OrderTest.orderId == sample.orderId,
            OrderTest.testCode.in_(sample.testCodes),
            OrderTest.status.notin_([TestStatus.SUPERSEDED, TestStatus.REMOVED])
        ).all()

        for order_test in order_tests:
            order_test.status = TestStatus.REJECTED

        after_state = self._serialize_sample_state(sample)

        # Log audit (prefer rejection_notes as comment when provided)
        self.audit.log_sample_rejection(
            sample_id=sample_id,
            user_id=user_id,
            before_state=before_state,
            after_state=after_state,
            rejection_reasons=rejection_reasons,
            recollection_required=recollection_required,
            comment=rejection_notes
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
        # IMPORTANT: Exclude SUPERSEDED and REMOVED tests - these were replaced by retests or removed from order and should
        # not be revived. Only update active tests that need the new sample.
        if update_order_tests:
            order_tests = self.db.query(OrderTest).filter(
                OrderTest.orderId == original_sample.orderId,
                OrderTest.testCode.in_(original_sample.testCodes),
                OrderTest.status.notin_([TestStatus.SUPERSEDED, TestStatus.REMOVED])  # Don't revive superseded or removed tests
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
            recollection_attempt=recollection_attempt,
            comment=recollection_reason
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
        technician_notes: Optional[str] = None,
        skip_validation: bool = False
    ) -> OrderTest:
        """
        Enter results for a test.

        Args:
            order_id: The order ID
            test_code: The test code
            user_id: The user entering results
            results: The test results
            technician_notes: Optional notes
            skip_validation: Skip physiologic validation (for testing only)

        Returns:
            The updated order test

        Raises:
            LabOperationError: If validation fails or state transition not allowed
        """
        order_test = self._get_order_test(order_id, test_code, status=TestStatus.SAMPLE_COLLECTED)
        before_state = self._serialize_test_state(order_test)

        # Validate state transition
        can_enter, reason = TestStateMachine.can_enter_results(order_test.status)
        if not can_enter:
            raise LabOperationError(reason)

        # Get test definition for validation and flag calculation
        test_def = self.db.query(Test).filter(Test.code == test_code).first()
        result_items = test_def.resultItems if test_def else []

        # Validate results against physiologic limits
        if not skip_validation and result_items:
            validation_errors = self.result_validator.validate_results(results, result_items)
            if self.result_validator.has_blocking_errors(validation_errors):
                error_msg = self.result_validator.format_error_message(validation_errors)
                raise LabOperationError(error_msg, status_code=400, error_code="VALIDATION_ERROR")

        # Get patient info for demographic-specific ranges
        order = self.db.query(Order).filter(Order.orderId == order_id).first()
        patient = order.patient if order else None
        patient_gender = patient.gender.value if patient and patient.gender else None
        patient_dob = patient.dateOfBirth if patient else None

        # Calculate flags based on reference ranges
        flags = []
        if result_items:
            flags = self.flag_calculator.calculate_flags(
                results=results,
                result_items=result_items,
                patient_gender=patient_gender,
                patient_dob=patient_dob
            )

        # Normalize results for JSON persistence (ORM + audit log require plain dicts)
        results_serializable = self._results_to_json_serializable(results)

        # Update results
        order_test.results = results_serializable
        order_test.resultEnteredAt = datetime.now(timezone.utc)
        order_test.enteredBy = str(user_id)  # Convert to string as per model requirement
        order_test.technicianNotes = technician_notes
        order_test.status = TestStatus.RESULTED

        # Update flags
        if flags:
            order_test.flags = self.flag_calculator.flags_to_string_list(flags)
            flag_modified(order_test, 'flags')

        # Check for critical values
        has_critical = self.flag_calculator.has_critical_values(flags)
        order_test.hasCriticalValues = has_critical

        # Log critical value detection if found
        if has_critical:
            critical_flags = self.flag_calculator.get_critical_flags(flags)
            self.audit.log_critical_value_detected(
                order_id=order_id,
                test_id=order_test.id,
                test_code=test_code,
                user_id=user_id,
                critical_values=self.flag_calculator.flags_to_json(critical_flags)
            )

        # Log audit (after_state must be JSON-serializable)
        self.audit.log_result_entry(
            order_id=order_id,
            test_code=test_code,
            test_id=order_test.id,
            user_id=user_id,
            results=results_serializable,
            comment=technician_notes
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
        order_test = self._get_validatable_order_test(order_id, test_code)

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
            return self._rejection_handler.reject_with_retest(
                order_id, test_code, user_id, rejection_reason
            )
        if action == RejectionAction.RECOLLECT_NEW_SAMPLE:
            return self._rejection_handler.reject_with_recollect(
                order_id, test_code, user_id, rejection_reason
            )
        if action == RejectionAction.ESCALATE_TO_SUPERVISOR:
            return self._rejection_handler.reject_with_escalate(
                order_id, test_code, user_id, rejection_reason
            )
        raise LabOperationError(f"Unknown rejection action: {action.value}")

    def resolve_escalation_force_validate(
        self,
        order_id: int,
        test_code: str,
        user_id: int,
        validation_notes: Optional[str] = None
    ) -> OrderTest:
        """
        Resolve escalated test by force-validating (Path 1).
        Fetches the test with status=ESCALATED so we do not pick up a superseded row
        when multiple tests exist for the same order_id + test_code.
        """
        order_test = self._get_order_test(order_id, test_code, status=TestStatus.ESCALATED)
        can_validate, reason = TestStateMachine.can_validate(order_test.status)
        if not can_validate:
            raise LabOperationError(reason)

        order_test.resultValidatedAt = datetime.now(timezone.utc)
        order_test.validatedBy = str(user_id)
        order_test.validationNotes = validation_notes
        order_test.status = TestStatus.VALIDATED

        self.audit.log_result_validation_approve(
            order_id=order_id,
            test_code=test_code,
            test_id=order_test.id,
            user_id=user_id,
            validation_notes=validation_notes
        )

        self.db.commit()
        self.db.refresh(order_test)
        update_order_status(self.db, order_id)
        return order_test

    def resolve_escalation_authorize_retest(
        self,
        order_id: int,
        test_code: str,
        user_id: int,
        reason: str
    ) -> RejectionResult:
        """
        Resolve escalated test by authorizing a retest (Path 2).
        Original -> SUPERSEDED; new OrderTest with retestNumber=0 (fresh retry chain).
        """
        original_test = self._get_order_test(order_id, test_code, status=TestStatus.ESCALATED)
        TestStateMachine.validate_transition(TestStatus.ESCALATED, TestStatus.SUPERSEDED)

        rejection_record = {
            "rejectedAt": datetime.now(timezone.utc).isoformat(),
            "rejectedBy": str(user_id),
            "rejectionReason": reason,
            "rejectionType": "authorize_retest"
        }
        if original_test.resultRejectionHistory is None:
            original_test.resultRejectionHistory = []
        original_test.resultRejectionHistory.append(rejection_record)
        flag_modified(original_test, 'resultRejectionHistory')

        original_test.resultValidatedAt = datetime.now(timezone.utc)
        original_test.validatedBy = str(user_id)
        original_test.validationNotes = reason

        new_order_test = OrderTest(
            orderId=order_id,
            testCode=test_code,
            status=TestStatus.SAMPLE_COLLECTED,
            priceAtOrder=original_test.priceAtOrder,
            sampleId=original_test.sampleId,
            isRetest=True,
            retestOfTestId=original_test.id,
            retestNumber=0,
            resultRejectionHistory=original_test.resultRejectionHistory,
            technicianNotes=f"Authorized re-test (escalation resolution): {reason}",
            flags=original_test.flags,
            isReflexTest=original_test.isReflexTest,
            triggeredBy=original_test.triggeredBy,
            reflexRule=original_test.reflexRule
        )

        self.db.add(new_order_test)
        self.db.flush()

        original_test.retestOrderTestId = new_order_test.id
        original_test.status = TestStatus.SUPERSEDED

        self.audit.log_escalation_resolution_authorize_retest(
            order_id=order_id,
            test_code=test_code,
            original_test_id=original_test.id,
            new_test_id=new_order_test.id,
            user_id=user_id,
            reason=reason
        )

        self.db.commit()
        self.db.refresh(new_order_test)
        update_order_status(self.db, order_id)

        return RejectionResult(
            success=True,
            action=RejectionAction.RETEST_SAME_SAMPLE,
            message="Authorized re-test created. Test is ready for new result entry.",
            originalTestId=original_test.id,
            newTestId=new_order_test.id
        )

    def resolve_escalation_final_reject(
        self,
        order_id: int,
        test_code: str,
        user_id: int,
        rejection_reason: str
    ) -> RejectionResult:
        """
        Resolve escalated test by final reject / new sample (Path 3).
        Rejects sample and requests recollection.
        """
        original_test = self._get_order_test(order_id, test_code, status=TestStatus.ESCALATED)
        TestStateMachine.validate_transition(TestStatus.ESCALATED, TestStatus.REJECTED)

        if not original_test.sampleId:
            raise LabOperationError("Cannot final reject - no sample linked to this test")

        sample = self._get_sample(original_test.sampleId)
        can_reject, reject_reason = SampleStateMachine.can_reject(sample.status)
        if not can_reject:
            raise LabOperationError(reject_reason)

        rejection_record = {
            "rejectedAt": datetime.now(timezone.utc).isoformat(),
            "rejectedBy": str(user_id),
            "rejectionReason": rejection_reason,
            "rejectionType": "re-collect"
        }
        if original_test.resultRejectionHistory is None:
            original_test.resultRejectionHistory = []
        original_test.resultRejectionHistory.append(rejection_record)
        flag_modified(original_test, 'resultRejectionHistory')

        # Transition ESCALATED -> REJECTED before reject_and_recollect (which does REJECTED -> PENDING)
        rejection_notes = f"Final reject (escalation resolution): {rejection_reason}"
        original_test.resultValidatedAt = datetime.now(timezone.utc)
        original_test.validatedBy = str(user_id)
        original_test.validationNotes = rejection_notes
        original_test.status = TestStatus.REJECTED

        rejected_sample, new_sample = self.reject_and_recollect(
            sample_id=sample.sampleId,
            user_id=user_id,
            rejection_reasons=["other"],
            rejection_notes=rejection_notes,
            recollection_reason=rejection_reason
        )

        self.audit.log_escalation_resolution_final_reject(
            order_id=order_id,
            test_code=test_code,
            test_id=original_test.id,
            sample_id=sample.sampleId,
            new_sample_id=new_sample.sampleId,
            user_id=user_id,
            rejection_reason=rejection_reason
        )

        self.db.commit()
        self.db.refresh(original_test)

        return RejectionResult(
            success=True,
            action=RejectionAction.RECOLLECT_NEW_SAMPLE,
            message=f"Sample rejected and new sample requested. New sample ID: {new_sample.sampleId}",
            originalTestId=original_test.id,
            newSampleId=new_sample.sampleId
        )
