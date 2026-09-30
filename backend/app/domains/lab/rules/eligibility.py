"""Lab action eligibility — shared by mutations and worklist DTOs."""

from __future__ import annotations

from typing import Any, TypedDict

from app.domains.lab.models.sample import Sample
from app.domains.lab.rules.state_machines import (
    SampleStateMachine,
    StateTransitionError,
    TestStateMachine,
)
from app.domains.orders.models import Order, OrderTest
from app.platform.utils.exceptions import LabOperationError
from app.shared.contracts.enums import (
    EscalationReasonCode,
    PaymentStatus,
    SampleStatus,
    TestStatus,
)
from app.shared.contracts.lab_blockers import BLOCKED_LABELS


class WorklistAllowedActions(TypedDict):
    collect: bool
    enterResults: bool
    validate: bool
    reject: bool


def _empty_actions() -> WorklistAllowedActions:
    return {
        "collect": False,
        "enterResults": False,
        "validate": False,
        "reject": False,
    }


def deny_message(reason: str | None) -> str | None:
    if not reason:
        return None
    return BLOCKED_LABELS.get(reason)


def blocked_reason_for_work_item(
    *,
    status: str,
    is_retest: bool = False,
    payment_status: str | None = None,
    sample_status: str | None = None,
    sample_is_recollection: bool = False,
    escalation_reason_code: str | None = None,
) -> str | None:
    """Canonical blocked-reason key for a pipeline work item."""
    if payment_status == PaymentStatus.UNPAID.value and status in (
        TestStatus.PENDING.value,
        "pending",
    ):
        return "payment_unpaid"
    if status == TestStatus.ESCALATED.value:
        if escalation_reason_code == EscalationReasonCode.CRIT_VAL.value:
            return "critical_value"
        if escalation_reason_code == EscalationReasonCode.AMEND_RES.value:
            return "amendment_pending"
        if escalation_reason_code == EscalationReasonCode.LIMIT_HIT.value:
            return "retry_limit"
        if escalation_reason_code == EscalationReasonCode.REJ_SAMP.value:
            return "recollection_limit"
        return "supervisor_review"
    if sample_status == SampleStatus.REJECTED.value:
        return "sample_rejected"
    if sample_is_recollection and status in (TestStatus.PENDING.value, "pending"):
        return "specimen_recollection"
    if is_retest and status == TestStatus.SAMPLE_COLLECTED.value:
        return "retest_pending"
    return None


def _tests_must_transition_on_collect(order_tests: list[OrderTest]) -> tuple[bool, str | None]:
    """Ensure every active linked test can move to SAMPLE_COLLECTED (or is already past that)."""
    skip_statuses = {
        TestStatus.SUPERSEDED,
        TestStatus.REMOVED,
        TestStatus.VALIDATED,
    }
    for order_test in order_tests:
        if order_test.status in skip_statuses:
            continue
        if order_test.status == TestStatus.CANCELLED:
            return (
                False,
                f"Test {order_test.testCode} cannot be marked collected (status cancelled)",
            )
        if TestStateMachine.can_transition(order_test.status, TestStatus.SAMPLE_COLLECTED):
            continue
        if order_test.status in (
            TestStatus.SAMPLE_COLLECTED,
            TestStatus.RESULTED,
            TestStatus.ESCALATED,
        ):
            continue
        status_val = order_test.status.value if order_test.status else str(order_test.status)
        return (
            False,
            f"Test {order_test.testCode} cannot be marked collected (status {status_val})",
        )
    return True, None


def assert_can_collect(sample: Sample, order: Order, order_tests: list[OrderTest]) -> None:
    if order.paymentStatus != PaymentStatus.PAID:
        raise LabOperationError(
            "Sample collection requires payment. Mark the order as paid before collecting.",
            status_code=402,
            error_code="PAYMENT_REQUIRED",
        )
    try:
        SampleStateMachine.validate_transition(sample.status, SampleStatus.COLLECTED)
    except StateTransitionError as exc:
        raise LabOperationError(
            exc.message, status_code=400, error_code="INVALID_TRANSITION"
        ) from exc

    ok, message = _tests_must_transition_on_collect(order_tests)
    if not ok:
        raise LabOperationError(
            message or "Invalid test state for collection",
            status_code=400,
            error_code="INVALID_TRANSITION",
        )


def assert_can_enter_results(order_test: OrderTest) -> None:
    can_enter, reason = TestStateMachine.can_enter_results(order_test.status)
    if not can_enter:
        raise LabOperationError(reason, status_code=400, error_code="INVALID_TRANSITION")


def assert_can_validate(order_test: OrderTest) -> None:
    can_validate, reason = TestStateMachine.can_validate(order_test.status)
    if not can_validate:
        raise LabOperationError(reason, status_code=400, error_code="INVALID_TRANSITION")


def action_flags_for_collection(
    *,
    sample: Sample,
    order: Order,
    order_tests: list[OrderTest],
) -> tuple[WorklistAllowedActions, str | None]:
    payment_status = order.paymentStatus.value if order.paymentStatus else None
    blocked = blocked_reason_for_work_item(
        status=TestStatus.PENDING.value,
        payment_status=payment_status,
        sample_is_recollection=bool(sample.isRecollection),
    )
    actions = _empty_actions()
    if sample.status != SampleStatus.PENDING:
        return actions, blocked

    if blocked == "payment_unpaid":
        return actions, blocked

    try:
        SampleStateMachine.validate_transition(sample.status, SampleStatus.COLLECTED)
    except StateTransitionError:
        return actions, blocked or "supervisor_review"

    ok, _ = _tests_must_transition_on_collect(order_tests)
    if not ok:
        return actions, blocked or "supervisor_review"

    actions["collect"] = True
    return actions, None


def action_flags_for_entry(
    *, order_test: OrderTest, is_retest: bool
) -> tuple[WorklistAllowedActions, str | None]:
    blocked = "retest_pending" if is_retest else None
    actions = _empty_actions()
    if blocked:
        return actions, blocked
    can_enter, _ = TestStateMachine.can_enter_results(order_test.status)
    actions["enterResults"] = can_enter
    return actions, blocked


def action_flags_for_validation(
    *, order_test: OrderTest
) -> tuple[WorklistAllowedActions, str | None]:
    actions = _empty_actions()
    can_validate, _ = TestStateMachine.can_validate(order_test.status)
    actions["validate"] = can_validate
    actions["reject"] = order_test.status == TestStatus.RESULTED
    return actions, None


def escalation_force_validate_allowed(order_test: OrderTest, *, reason_code: str | None) -> bool:
    """Supervisor force-validate requires critical notify when escalation is CRIT-VAL."""
    if reason_code != EscalationReasonCode.CRIT_VAL.value:
        return True
    return bool(order_test.criticalNotificationSent)


def escalation_action_flags(order_test: OrderTest, *, reason_code: str | None) -> dict[str, Any]:
    return {
        "criticalNotificationSent": bool(order_test.criticalNotificationSent),
        "allowForceValidate": escalation_force_validate_allowed(
            order_test, reason_code=reason_code
        ),
    }
