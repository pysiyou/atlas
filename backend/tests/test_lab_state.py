"""Tests for lab sample/test state machines."""

import pytest

from app.schemas.enums import SampleStatus, TestStatus
from app.services.lab.state import SampleStateMachine, StateTransitionError, TestStateMachine


def test_sample_pending_to_collected():
    assert SampleStateMachine.can_transition(SampleStatus.PENDING, SampleStatus.COLLECTED)


def test_sample_pending_to_rejected_invalid():
    assert not SampleStateMachine.can_transition(SampleStatus.PENDING, SampleStatus.REJECTED)


def test_sample_validate_transition_raises():
    with pytest.raises(StateTransitionError):
        SampleStateMachine.validate_transition(SampleStatus.PENDING, SampleStatus.REJECTED)


def test_test_happy_path_transitions():
    assert TestStateMachine.can_transition(TestStatus.PENDING, TestStatus.SAMPLE_COLLECTED)
    assert TestStateMachine.can_transition(TestStatus.SAMPLE_COLLECTED, TestStatus.RESULTED)
    assert TestStateMachine.can_transition(TestStatus.RESULTED, TestStatus.VALIDATED)


def test_test_same_status_allowed():
    assert TestStateMachine.can_transition(TestStatus.RESULTED, TestStatus.RESULTED)


def test_test_validated_to_escalated_amendment():
    assert TestStateMachine.can_transition(TestStatus.VALIDATED, TestStatus.ESCALATED)
