"""
State Machine Service for Laboratory Operations

Provides strict validation of status transitions for samples and tests.
Ensures that only valid state transitions are allowed.
"""
from typing import Set, Dict, Tuple
from app.schemas.enums import SampleStatus, TestStatus


class StateTransitionError(Exception):
    """Raised when an invalid state transition is attempted"""
    def __init__(self, entity_type: str, from_status: str, to_status: str, message: str = None):
        self.entity_type = entity_type
        self.from_status = from_status
        self.to_status = to_status
        self.message = message or f"Invalid {entity_type} transition from '{from_status}' to '{to_status}'"
        super().__init__(self.message)


class SampleStateMachine:
    """
    State machine for Sample status transitions.

    Sample Lifecycle:
    PENDING -> COLLECTED -> RECEIVED -> ACCESSIONED -> IN_PROGRESS -> COMPLETED -> STORED/DISPOSED
    Any post-collection state can transition to REJECTED (quality issue).
    REJECTED is terminal - recollection creates a new sample.
    """

    TRANSITIONS: Dict[SampleStatus, Set[SampleStatus]] = {
        SampleStatus.PENDING: {SampleStatus.COLLECTED},
        SampleStatus.COLLECTED: {SampleStatus.RECEIVED, SampleStatus.REJECTED},
        SampleStatus.RECEIVED: {SampleStatus.ACCESSIONED, SampleStatus.REJECTED},
        SampleStatus.ACCESSIONED: {SampleStatus.IN_PROGRESS, SampleStatus.REJECTED},
        SampleStatus.IN_PROGRESS: {SampleStatus.COMPLETED, SampleStatus.REJECTED},
        SampleStatus.COMPLETED: {SampleStatus.STORED, SampleStatus.DISPOSED, SampleStatus.REJECTED},
        SampleStatus.STORED: {SampleStatus.DISPOSED, SampleStatus.REJECTED},
        SampleStatus.REJECTED: set(),  # Terminal - recollection creates new sample
        SampleStatus.DISPOSED: set(),  # Terminal
    }

    # States that can be rejected (have had collection)
    REJECTABLE_STATES: Set[SampleStatus] = {
        SampleStatus.COLLECTED,
        SampleStatus.RECEIVED,
        SampleStatus.ACCESSIONED,
        SampleStatus.IN_PROGRESS,
        SampleStatus.COMPLETED,
        SampleStatus.STORED
    }

    @classmethod
    def can_transition(cls, from_status: SampleStatus, to_status: SampleStatus) -> bool:
        """Check if a transition is valid"""
        allowed = cls.TRANSITIONS.get(from_status, set())
        return to_status in allowed

    @classmethod
    def validate_transition(cls, from_status: SampleStatus, to_status: SampleStatus) -> None:
        """
        Validate a transition, raising an exception if invalid.

        Raises:
            StateTransitionError: If the transition is not allowed
        """
        if not cls.can_transition(from_status, to_status):
            allowed = cls.TRANSITIONS.get(from_status, set())
            allowed_str = ", ".join(s.value for s in allowed) if allowed else "none (terminal state)"
            raise StateTransitionError(
                entity_type="sample",
                from_status=from_status.value,
                to_status=to_status.value,
                message=f"Cannot transition sample from '{from_status.value}' to '{to_status.value}'. Allowed transitions: {allowed_str}"
            )

    @classmethod
    def can_reject(cls, status: SampleStatus) -> Tuple[bool, str]:
        """
        Check if a sample with given status can be rejected.

        Returns:
            Tuple of (can_reject, reason)
        """
        if status in cls.REJECTABLE_STATES:
            return True, ""
        if status == SampleStatus.PENDING:
            return False, "Sample must be collected before it can be rejected"
        if status == SampleStatus.REJECTED:
            return False, "Sample is already rejected"
        if status == SampleStatus.DISPOSED:
            return False, "Cannot reject a disposed sample"
        return False, f"Cannot reject sample with status '{status.value}'"

    @classmethod
    def is_terminal(cls, status: SampleStatus) -> bool:
        """Check if a status is terminal (no further transitions)"""
        return len(cls.TRANSITIONS.get(status, set())) == 0


class TestStateMachine:
    """
    State machine for OrderTest status transitions.

    Test Lifecycle:
    PENDING -> SAMPLE_COLLECTED -> IN_PROGRESS -> COMPLETED -> VALIDATED

    Rejection paths:
    - COMPLETED -> SUPERSEDED (when retest is created)
    - SAMPLE_COLLECTED/IN_PROGRESS -> REJECTED (sample rejection)
    - REJECTED -> PENDING (when recollection sample is linked)
    """

    TRANSITIONS: Dict[TestStatus, Set[TestStatus]] = {
        TestStatus.PENDING: {TestStatus.SAMPLE_COLLECTED, TestStatus.REJECTED},
        TestStatus.SAMPLE_COLLECTED: {TestStatus.IN_PROGRESS, TestStatus.RESULTED, TestStatus.REJECTED},
        TestStatus.IN_PROGRESS: {TestStatus.RESULTED, TestStatus.REJECTED},
        TestStatus.RESULTED: {TestStatus.VALIDATED, TestStatus.SUPERSEDED},
        TestStatus.VALIDATED: set(),  # Terminal
        TestStatus.REJECTED: {TestStatus.PENDING},  # Can transition to pending when recollection is ready
        TestStatus.SUPERSEDED: set(),  # Terminal - replaced by retest
    }

    # States from which results can be entered
    RESULT_ENTRY_STATES: Set[TestStatus] = {
        TestStatus.SAMPLE_COLLECTED,
    }

    # States from which results can be validated
    VALIDATION_STATES: Set[TestStatus] = {
        TestStatus.RESULTED,
    }

    @classmethod
    def can_transition(cls, from_status: TestStatus, to_status: TestStatus) -> bool:
        """Check if a transition is valid"""
        allowed = cls.TRANSITIONS.get(from_status, set())
        return to_status in allowed

    @classmethod
    def validate_transition(cls, from_status: TestStatus, to_status: TestStatus) -> None:
        """
        Validate a transition, raising an exception if invalid.

        Raises:
            StateTransitionError: If the transition is not allowed
        """
        if not cls.can_transition(from_status, to_status):
            allowed = cls.TRANSITIONS.get(from_status, set())
            allowed_str = ", ".join(s.value for s in allowed) if allowed else "none (terminal state)"
            raise StateTransitionError(
                entity_type="test",
                from_status=from_status.value,
                to_status=to_status.value,
                message=f"Cannot transition test from '{from_status.value}' to '{to_status.value}'. Allowed transitions: {allowed_str}"
            )

    @classmethod
    def can_enter_results(cls, status: TestStatus) -> Tuple[bool, str]:
        """
        Check if results can be entered for a test with given status.

        Returns:
            Tuple of (can_enter, reason)
        """
        if status in cls.RESULT_ENTRY_STATES:
            return True, ""
        if status == TestStatus.PENDING:
            return False, "Sample must be collected before results can be entered"
        if status == TestStatus.RESULTED:
            return False, "Results already entered for this test"
        if status == TestStatus.VALIDATED:
            return False, "Test has already been validated"
        if status == TestStatus.SUPERSEDED:
            return False, "This test has been superseded by a retest"
        return False, f"Cannot enter results for test with status '{status.value}'"

    @classmethod
    def can_validate(cls, status: TestStatus) -> Tuple[bool, str]:
        """
        Check if a test with given status can be validated.

        Returns:
            Tuple of (can_validate, reason)
        """
        if status in cls.VALIDATION_STATES:
            return True, ""
        if status == TestStatus.PENDING:
            return False, "Test is still pending sample collection"
        if status == TestStatus.SAMPLE_COLLECTED:
            return False, "Results must be entered before validation"
        if status == TestStatus.VALIDATED:
            return False, "Test has already been validated"
        if status == TestStatus.SUPERSEDED:
            return False, "This test has been superseded by a retest"
        return False, f"Cannot validate test with status '{status.value}'"

    @classmethod
    def is_terminal(cls, status: TestStatus) -> bool:
        """Check if a status is terminal (no further transitions)"""
        return len(cls.TRANSITIONS.get(status, set())) == 0

    @classmethod
    def is_active(cls, status: TestStatus) -> bool:
        """Check if a test is active (not superseded or rejected permanently)"""
        return status not in {TestStatus.SUPERSEDED, TestStatus.VALIDATED}
