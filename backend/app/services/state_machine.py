"""
State Machine Service for Laboratory Operations

Provides strict validation of status transitions for samples and tests.
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
    Sample Lifecycle:
    PENDING -> COLLECTED -> REJECTED (terminal — recollection creates new sample)
    """

    TRANSITIONS: Dict[SampleStatus, Set[SampleStatus]] = {
        SampleStatus.PENDING: {SampleStatus.COLLECTED},
        SampleStatus.COLLECTED: {SampleStatus.REJECTED},
        SampleStatus.REJECTED: set(),
    }

    REJECTABLE_STATES: Set[SampleStatus] = {SampleStatus.COLLECTED}

    @classmethod
    def can_transition(cls, from_status: SampleStatus, to_status: SampleStatus) -> bool:
        allowed = cls.TRANSITIONS.get(from_status, set())
        return to_status in allowed

    @classmethod
    def validate_transition(cls, from_status: SampleStatus, to_status: SampleStatus) -> None:
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
        if status in cls.REJECTABLE_STATES:
            return True, ""
        if status == SampleStatus.PENDING:
            return False, "Sample must be collected before it can be rejected"
        if status == SampleStatus.REJECTED:
            return False, "Sample is already rejected"
        return False, f"Cannot reject sample with status '{status.value}'"

    @classmethod
    def is_terminal(cls, status: SampleStatus) -> bool:
        return len(cls.TRANSITIONS.get(status, set())) == 0


class TestStateMachine:
    """
    Test Lifecycle:
    PENDING -> SAMPLE_COLLECTED -> RESULTED -> VALIDATED

    Quality issue paths:
    - SAMPLE_COLLECTED/PENDING/SUSPENDED -> SUSPENDED (specimen issue, awaiting recollection)
    - RESULTED -> SUPERSEDED (retry) or ESCALATED (limit/critical)
    - SUSPENDED -> PENDING (recollection linked)
    - ESCALATED -> VALIDATED | SUPERSEDED | CANCELLED | PENDING (supervisor)

    Terminal: VALIDATED, SUPERSEDED, REMOVED, CANCELLED
    """

    TRANSITIONS: Dict[TestStatus, Set[TestStatus]] = {
        TestStatus.PENDING: {
            TestStatus.SAMPLE_COLLECTED,
            TestStatus.SUSPENDED,
            TestStatus.REMOVED,
            TestStatus.ESCALATED,
        },
        TestStatus.SAMPLE_COLLECTED: {
            TestStatus.RESULTED,
            TestStatus.SUSPENDED,
            TestStatus.ESCALATED,
        },
        TestStatus.RESULTED: {
            TestStatus.VALIDATED,
            TestStatus.ESCALATED,
            TestStatus.SUPERSEDED,
        },
        TestStatus.VALIDATED: {TestStatus.ESCALATED},
        TestStatus.SUSPENDED: {TestStatus.PENDING, TestStatus.ESCALATED},
        TestStatus.ESCALATED: {
            TestStatus.VALIDATED,
            TestStatus.SUPERSEDED,
            TestStatus.CANCELLED,
            TestStatus.PENDING,
        },
        TestStatus.SUPERSEDED: set(),
        TestStatus.REMOVED: set(),
        TestStatus.CANCELLED: set(),
    }

    RESULT_ENTRY_STATES: Set[TestStatus] = {TestStatus.SAMPLE_COLLECTED}

    VALIDATION_STATES: Set[TestStatus] = {TestStatus.RESULTED}

    @classmethod
    def can_transition(cls, from_status: TestStatus, to_status: TestStatus) -> bool:
        allowed = cls.TRANSITIONS.get(from_status, set())
        return to_status in allowed

    @classmethod
    def validate_transition(cls, from_status: TestStatus, to_status: TestStatus) -> None:
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
        if status in cls.RESULT_ENTRY_STATES:
            return True, ""
        if status == TestStatus.PENDING:
            return False, "Sample must be collected before results can be entered"
        if status == TestStatus.RESULTED:
            return False, "Results already entered for this test"
        if status == TestStatus.ESCALATED:
            return False, "Test is escalated for supervisor review"
        if status == TestStatus.VALIDATED:
            return False, "Test has already been validated"
        if status == TestStatus.SUPERSEDED:
            return False, "This test has been superseded by a retest"
        if status == TestStatus.CANCELLED:
            return False, "This test has been cancelled"
        if status == TestStatus.REMOVED:
            return False, "This test has been removed from the order"
        return False, f"Cannot enter results for test with status '{status.value}'"

    @classmethod
    def can_validate(cls, status: TestStatus) -> Tuple[bool, str]:
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
        if status == TestStatus.CANCELLED:
            return False, "This test has been cancelled"
        if status == TestStatus.REMOVED:
            return False, "This test has been removed from the order"
        return False, f"Cannot validate test with status '{status.value}'"

    @classmethod
    def is_terminal(cls, status: TestStatus) -> bool:
        return len(cls.TRANSITIONS.get(status, set())) == 0

    @classmethod
    def is_active(cls, status: TestStatus) -> bool:
        return status not in {TestStatus.SUPERSEDED, TestStatus.REMOVED, TestStatus.VALIDATED, TestStatus.CANCELLED}
