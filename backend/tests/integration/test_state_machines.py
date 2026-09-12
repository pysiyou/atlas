import pytest
from app.schemas.enums import SampleStatus, TestStatus
from app.services.lab.state import SampleStateMachine, StateTransitionError, TestStateMachine


class TestSampleSM:
    def test_valid(self):
        SampleStateMachine.validate_transition(SampleStatus.PENDING, SampleStatus.COLLECTED)
        SampleStateMachine.validate_transition(SampleStatus.COLLECTED, SampleStatus.REJECTED)

    def test_invalid(self):
        with pytest.raises(StateTransitionError):
            SampleStateMachine.validate_transition(SampleStatus.PENDING, SampleStatus.REJECTED)


class TestTestSM:
    def test_happy_path(self):
        TestStateMachine.validate_transition(TestStatus.PENDING, TestStatus.SAMPLE_COLLECTED)
        TestStateMachine.validate_transition(TestStatus.SAMPLE_COLLECTED, TestStatus.RESULTED)
        TestStateMachine.validate_transition(TestStatus.RESULTED, TestStatus.VALIDATED)

    def test_guards(self):
        assert TestStateMachine.can_enter_results(TestStatus.SAMPLE_COLLECTED)[0]
        assert TestStateMachine.can_validate(TestStatus.RESULTED)[0]
