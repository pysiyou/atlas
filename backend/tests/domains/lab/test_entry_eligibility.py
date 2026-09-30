"""Entry worklist eligibility for retest / recollection rows."""

from __future__ import annotations

from types import SimpleNamespace

from app.domains.lab.rules.eligibility import action_flags_for_entry
from app.domains.lab.rules.work_item_projection import (
    LabWorkItemContext,
    project_order_test_entry,
)
from app.shared.contracts.enums import PaymentStatus, TestStatus


def _order_test(**kwargs):
    defaults = {
        "status": TestStatus.SAMPLE_COLLECTED,
        "isRetest": False,
        "testCode": "RUBELLA_IGG",
    }
    defaults.update(kwargs)
    return SimpleNamespace(**defaults)


def _order():
    return SimpleNamespace(paymentStatus=PaymentStatus.PAID)


def _sample(**kwargs):
    defaults = {
        "status": SimpleNamespace(value="collected"),
        "isRecollection": True,
    }
    defaults.update(kwargs)
    return SimpleNamespace(**defaults)


def test_retest_sample_collected_allows_enter_results() -> None:
    order_test = _order_test(isRetest=True)
    actions, deny = action_flags_for_entry(order_test=order_test)

    assert deny is None
    assert actions["enterResults"] is True


def test_entry_projection_retest_does_not_set_deny_message() -> None:
    order_test = _order_test(isRetest=True, retestOfTestId=42)
    sample = _sample()
    projection = project_order_test_entry(
        LabWorkItemContext(order=_order(), order_test=order_test, sample=sample)
    )

    assert projection.allowedActions.enterResults is True
    assert projection.denyReason is None
    assert projection.denyMessage is None
    assert projection.blockedReason == "retest_pending"
