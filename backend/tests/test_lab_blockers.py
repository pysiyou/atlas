"""Tests for lab blocker reason resolution."""

from app.schemas.enums import (
    EscalationReasonCode,
    PaymentStatus,
    SampleStatus,
    TestStatus,
)
from app.services.lab.blockers import blocked_reason_for_work_item


def test_payment_unpaid_on_pending():
    assert (
        blocked_reason_for_work_item(
            status=TestStatus.PENDING.value,
            payment_status=PaymentStatus.UNPAID.value,
        )
        == "payment_unpaid"
    )


def test_retest_pending_on_collected_retest():
    assert (
        blocked_reason_for_work_item(
            status=TestStatus.SAMPLE_COLLECTED.value,
            is_retest=True,
        )
        == "retest_pending"
    )


def test_critical_value_escalation():
    assert (
        blocked_reason_for_work_item(
            status=TestStatus.ESCALATED.value,
            escalation_reason_code=EscalationReasonCode.CRIT_VAL.value,
        )
        == "critical_value"
    )


def test_sample_rejected():
    assert (
        blocked_reason_for_work_item(
            status=TestStatus.SAMPLE_COLLECTED.value,
            sample_status=SampleStatus.REJECTED.value,
        )
        == "sample_rejected"
    )


def test_no_blocker_when_paid_and_collected():
    assert (
        blocked_reason_for_work_item(
            status=TestStatus.SAMPLE_COLLECTED.value,
            payment_status=PaymentStatus.PAID.value,
            is_retest=False,
        )
        is None
    )
