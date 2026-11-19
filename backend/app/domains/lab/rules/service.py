from __future__ import annotations

# --- from rules/test_status_sets.py ---

"""Named test status sets for lab queues, collection, and lineage filtering."""

from app.shared.enums import TestStatus

# Superseded/removed lines disappear from operational worklists.
INACTIVE_LINEAGE_STATUSES: tuple[TestStatus, ...] = (
    TestStatus.SUPERSEDED,
    TestStatus.REMOVED,
)

# Rollup/reporting inactive set (includes cancelled).
INACTIVE_ROLLUP_EXTRA_STATUSES: tuple[TestStatus, ...] = (TestStatus.CANCELLED,)

# Terminal outcomes excluded when listing "active" work on a sample during collection.
COLLECTION_LINKED_TEST_EXCLUDE_STATUSES: tuple[TestStatus, ...] = (
    TestStatus.SUPERSEDED,
    TestStatus.REMOVED,
    TestStatus.CANCELLED,
)

# Worklist dashboards: hide lineage-inactive tests only.
WORKLIST_EXCLUDED_TEST_STATUSES: tuple[TestStatus, ...] = INACTIVE_LINEAGE_STATUSES

# Collection worklist linked tests: also skip validated/cancelled terminal rows.
COLLECTION_WORKLIST_LINKED_EXCLUDE: tuple[TestStatus, ...] = (
    TestStatus.SUPERSEDED,
    TestStatus.REMOVED,
    TestStatus.VALIDATED,
    TestStatus.CANCELLED,
)

# Tests ignored when validating collection transitions (not cancelled — handled separately).
COLLECTION_TRANSITION_SKIP_STATUSES: frozenset[TestStatus] = frozenset(
    {
        TestStatus.SUPERSEDED,
        TestStatus.REMOVED,
        TestStatus.VALIDATED,
    }
)

# Monitor board: hide inactive lineage plus cancelled tests.
BOARD_EXCLUDED_TEST_STATUSES: tuple[TestStatus, ...] = (
    *INACTIVE_LINEAGE_STATUSES,
    *INACTIVE_ROLLUP_EXTRA_STATUSES,
)


# --- from rules/state_machines.py ---

"""
State Machine Service for Laboratory Operations

Provides strict validation of status transitions for samples and tests.
"""

from app.shared.enums import SampleStatus, TestStatus


class StateTransitionError(Exception):
    """Raised when an invalid state transition is attempted"""

    def __init__(self, entity_type: str, from_status: str, to_status: str, message: str = None):
        self.entity_type = entity_type
        self.from_status = from_status
        self.to_status = to_status
        self.message = (
            message or f"Invalid {entity_type} transition from '{from_status}' to '{to_status}'"
        )
        super().__init__(self.message)


class SampleStateMachine:
    """
    Sample Lifecycle:
    PENDING -> COLLECTED -> REJECTED (terminal — recollection creates new sample)
    """

    TRANSITIONS: dict[SampleStatus, set[SampleStatus]] = {
        SampleStatus.PENDING: {SampleStatus.COLLECTED},
        SampleStatus.COLLECTED: {SampleStatus.REJECTED},
        SampleStatus.REJECTED: set(),
    }

    REJECTABLE_STATES: set[SampleStatus] = {SampleStatus.COLLECTED}

    @classmethod
    def can_transition(cls, from_status: SampleStatus, to_status: SampleStatus) -> bool:
        allowed = cls.TRANSITIONS.get(from_status, set())
        return to_status in allowed

    @classmethod
    def validate_transition(cls, from_status: SampleStatus, to_status: SampleStatus) -> None:
        if not cls.can_transition(from_status, to_status):
            allowed = cls.TRANSITIONS.get(from_status, set())
            allowed_str = (
                ", ".join(s.value for s in allowed) if allowed else "none (terminal state)"
            )
            raise StateTransitionError(
                entity_type="sample",
                from_status=from_status.value,
                to_status=to_status.value,
                message=f"Cannot transition sample from '{from_status.value}' to '{to_status.value}'. Allowed transitions: {allowed_str}",
            )

    @classmethod
    def can_reject(cls, status: SampleStatus) -> tuple[bool, str]:
        if status in cls.REJECTABLE_STATES:
            return True, ""
        if status == SampleStatus.PENDING:
            return False, "Sample must be collected before it can be rejected"
        if status == SampleStatus.REJECTED:
            return False, "Sample is already rejected"
        return False, f"Cannot reject sample with status '{status.value}'"


class TestStateMachine:
    """
    Test Lifecycle - Active Paths:
    PENDING -> SAMPLE_COLLECTED -> RESULTED -> VALIDATED (happy path)
    SAMPLE_COLLECTED -> ESCALATED (critical value trigger)
    RESULTED -> ESCALATED (limit-hit, validator escalate)
    VALIDATED -> ESCALATED (amendment request - AMEND-RES)
    ESCALATED -> VALIDATED | SUPERSEDED | CANCELLED (supervisor resolution)

    Quality issue paths:
    - SAMPLE_COLLECTED -> PENDING (specimen rejection reset)
    - PENDING -> ESCALATED (recollection limit at collection)
    - RESULTED -> PENDING (specimen rejection — clear unvalidated results)
    - RESULTED -> SUPERSEDED (retest/recollection)

    Terminal: VALIDATED, SUPERSEDED, REMOVED, CANCELLED
    """

    TRANSITIONS: dict[TestStatus, set[TestStatus]] = {
        TestStatus.PENDING: {
            TestStatus.SAMPLE_COLLECTED,
            TestStatus.REMOVED,
            TestStatus.CANCELLED,
            TestStatus.ESCALATED,
        },
        TestStatus.SAMPLE_COLLECTED: {
            TestStatus.RESULTED,
            TestStatus.PENDING,
            TestStatus.ESCALATED,  # Critical value trigger
            TestStatus.CANCELLED,  # Sample rejection + cancel remedy
        },
        TestStatus.RESULTED: {
            TestStatus.VALIDATED,
            TestStatus.PENDING,
            TestStatus.ESCALATED,  # Limit-hit or validator escalate
            TestStatus.SUPERSEDED,  # Retest/recollection
            TestStatus.CANCELLED,
        },
        TestStatus.VALIDATED: {
            TestStatus.ESCALATED,  # Amendment request (AMEND-RES)
        },
        TestStatus.ESCALATED: {
            TestStatus.VALIDATED,  # Force validate or apply amendment
            TestStatus.SUPERSEDED,  # Authorize retest/recollect
            TestStatus.CANCELLED,  # Cancel test
        },
        TestStatus.SUPERSEDED: set(),
        TestStatus.REMOVED: set(),
        TestStatus.CANCELLED: set(),
    }

    RESULT_ENTRY_STATES: set[TestStatus] = {TestStatus.SAMPLE_COLLECTED}

    VALIDATION_STATES: set[TestStatus] = {TestStatus.RESULTED}

    @classmethod
    def can_transition(cls, from_status: TestStatus, to_status: TestStatus) -> bool:
        if from_status == to_status:
            return True
        allowed = cls.TRANSITIONS.get(from_status, set())
        return to_status in allowed

    @classmethod
    def validate_transition(cls, from_status: TestStatus, to_status: TestStatus) -> None:
        if from_status == to_status:
            return
        if not cls.can_transition(from_status, to_status):
            allowed = cls.TRANSITIONS.get(from_status, set())
            allowed_str = (
                ", ".join(s.value for s in allowed) if allowed else "none (terminal state)"
            )
            raise StateTransitionError(
                entity_type="test",
                from_status=from_status.value,
                to_status=to_status.value,
                message=f"Cannot transition test from '{from_status.value}' to '{to_status.value}'. Allowed transitions: {allowed_str}",
            )

    @classmethod
    def can_enter_results(cls, status: TestStatus) -> tuple[bool, str]:
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
    def can_validate(cls, status: TestStatus) -> tuple[bool, str]:
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


# --- from rules/eligibility.py ---

"""Lab action eligibility — shared by mutations and worklist DTOs."""


from typing import Any, TypedDict

from app.domains.lab.specimen.models import Sample
from app.domains.orders.models import Order, OrderTest
from app.shared.exceptions import LabOperationError
from app.shared.enums import (
    EscalationReasonCode,
    PaymentStatus,
    SampleStatus,
    TestStatus,
)
from app.shared.lab_contract import ATTENTION_LABELS, reason_blocks_progress


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
    return ATTENTION_LABELS.get(reason)


def attention_reason_for_work_item(
    *,
    status: str,
    payment_status: str | None = None,
    sample_status: str | None = None,
    escalation_reason_code: str | None = None,
) -> str | None:
    """Canonical attention-reason key for a pipeline work item (not lineage)."""
    outstanding = {PaymentStatus.UNPAID.value, PaymentStatus.PARTIAL.value}
    if payment_status in outstanding and status in (
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
        if escalation_reason_code == EscalationReasonCode.VAL_REJ.value:
            return "validation_rejected"
        return "supervisor_review"
    if sample_status == SampleStatus.REJECTED.value:
        return "sample_rejected"
    return None


def active_linked_tests_for_collection(order_tests: list[OrderTest]) -> list[OrderTest]:
    """Linked tests that should transition when a sample is collected."""
    return [ot for ot in order_tests if ot.status not in COLLECTION_WORKLIST_LINKED_EXCLUDE]


def _tests_must_transition_on_collect(order_tests: list[OrderTest]) -> tuple[bool, str | None]:
    """Ensure every active linked test can move to SAMPLE_COLLECTED (or is already past that)."""
    for order_test in order_tests:
        if order_test.status in COLLECTION_TRANSITION_SKIP_STATUSES:
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
    # Check workflow requirements based on configuration
    from app.platform.config import client_config
    
    # Workflow: requirePaymentBeforeCollection
    require_payment = client_config.workflows.get("requirePaymentBeforeCollection", True)
    if require_payment and order.paymentStatus != PaymentStatus.PAID:
        raise LabOperationError(
            "Sample collection requires payment. Mark the order as paid before collecting.",
            status_code=402,
            error_code="PAYMENT_REQUIRED",
        )
    
    # Workflow: requireDoctorApproval
    require_doctor_approval = client_config.workflows.get("requireDoctorApproval", False)
    if require_doctor_approval and not order.doctorApprovedBy:
        raise LabOperationError(
            "Sample collection requires doctor approval. Order must be approved before collecting.",
            status_code=403,
            error_code="DOCTOR_APPROVAL_REQUIRED",
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


def assert_can_validate(order_test: OrderTest, validator_id: str | None = None) -> None:
    """
    Check if result can be validated.
    If requireDualValidation is enabled, ensures second validator is different from first.
    """
    from app.platform.config import client_config
    
    can_validate, reason = TestStateMachine.can_validate(order_test.status)
    if not can_validate:
        raise LabOperationError(reason, status_code=400, error_code="INVALID_TRANSITION")
    
    # Workflow: requireDualValidation — second sign-off must be a different user
    require_dual = client_config.workflows.get("requireDualValidation", False)
    if require_dual and order_test.validatedBy and not order_test.secondValidatorId:
        if validator_id and order_test.validatedBy == validator_id:
            raise LabOperationError(
                "Dual validation requires a different validator for the second validation.",
                status_code=403,
                error_code="DUAL_VALIDATION_REQUIRED",
            )


def action_flags_for_collection(
    *,
    sample: Sample,
    order: Order,
    order_tests: list[OrderTest],
) -> tuple[WorklistAllowedActions, str | None]:
    payment_status = order.paymentStatus.value if order.paymentStatus else None
    attention = attention_reason_for_work_item(
        status=TestStatus.PENDING.value,
        payment_status=payment_status,
    )
    actions = _empty_actions()
    if sample.status != SampleStatus.PENDING:
        return actions, None

    if attention == "payment_unpaid":
        return actions, attention

    try:
        SampleStateMachine.validate_transition(sample.status, SampleStatus.COLLECTED)
    except StateTransitionError:
        return actions, attention or "supervisor_review"

    ok, _ = _tests_must_transition_on_collect(order_tests)
    if not ok:
        return actions, attention or "supervisor_review"

    actions["collect"] = True
    return actions, None


def action_flags_for_entry(*, order_test: OrderTest) -> tuple[WorklistAllowedActions, str | None]:
    """Entry worklist actions — retest rows use the same rules as primary tests once collected."""
    actions = _empty_actions()
    can_enter, _ = TestStateMachine.can_enter_results(order_test.status)
    actions["enterResults"] = can_enter
    return actions, None


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


def effective_deny_reason(
    *,
    deny_reason: str | None,
    attention_reason: str | None,
    primary_action_allowed: bool,
) -> str | None:
    """Deny only when the queue action is disabled or attention blocks progress."""
    if primary_action_allowed:
        return None
    if deny_reason:
        return deny_reason
    if attention_reason and reason_blocks_progress(attention_reason):
        return attention_reason
    return deny_reason


# --- from rules/blockers.py ---

"""Lab attention vocabulary and attention-reason resolution."""


from typing import Any

from app.shared.enums import PriorityLevel
from app.shared.lab_contract import (
    ATTENTION_LABELS,
)
from app.shared.lab_contract import (
    ATTENTION_TYPE_BY_REASON as _GENERATED_ATTENTION_TYPE_BY_REASON,
)
from app.shared.lab_contract import (
    ATTENTION_TYPE_SORT as _GENERATED_ATTENTION_TYPE_SORT,
)
from app.shared.lab_contract import (
    PRIORITY_ATTENTION_TYPES as _GENERATED_PRIORITY_ATTENTION,
)
from app.shared.lab_contract import (
    PRIORITY_RANK as _GENERATED_PRIORITY_RANK,
)
from app.shared.lab_contract import (
    PRIORITY_WEIGHT as _GENERATED_PRIORITY_WEIGHT,
)
from app.shared.lab_contract import (
    SUPERVISOR_ATTENTION_TYPES as _GENERATED_SUPERVISOR_ATTENTION,
)
from sqlalchemy import case

__all__ = [
    "ATTENTION_LABELS",
    "attention_reason_for_work_item",
    "ATTENTION_TYPE_BY_REASON",
    "ATTENTION_TYPE_SORT",
    "SUPERVISOR_ATTENTION_TYPES",
    "PRIORITY_ATTENTION_TYPES",
    "should_surface_attention",
    "attention_type_for",
    "priority_rank",
    "priority_sort_key",
    "PRIORITY_RANK",
    "PRIORITY_WEIGHT",
]

ATTENTION_TYPE_BY_REASON = dict(_GENERATED_ATTENTION_TYPE_BY_REASON)
ATTENTION_TYPE_SORT = dict(_GENERATED_ATTENTION_TYPE_SORT)
SUPERVISOR_ATTENTION_TYPES = set(_GENERATED_SUPERVISOR_ATTENTION)
PRIORITY_ATTENTION_TYPES = set(_GENERATED_PRIORITY_ATTENTION)


def should_surface_attention(
    attention_reason: str | None,
    status: str,
    *,
    always: bool = False,
) -> bool:
    """Surface blocked work, TAT breaches, and always-on supervisor items."""
    if always or attention_reason:
        return True
    return status in ("warning", "critical")


def attention_type_for(
    attention_reason: str | None,
    status: str,
    priority: str,
) -> str:
    if attention_reason:
        return ATTENTION_TYPE_BY_REASON.get(attention_reason, "queue_overdue_warning")
    if status == "critical":
        return "queue_overdue_critical"
    if status == "warning":
        return "queue_overdue_warning"
    if priority == PriorityLevel.URGENT.value:
        return "priority_urgent"
    if priority == PriorityLevel.HIGH.value:
        return "priority_high"
    return "queue_overdue_warning"


def _priority_rank_map() -> dict[Any, int]:
    rank = dict(_GENERATED_PRIORITY_RANK)
    rank.update(
        {
            PriorityLevel.URGENT: rank.get(PriorityLevel.URGENT.value, 99),
            PriorityLevel.HIGH: rank.get(PriorityLevel.HIGH.value, 99),
            PriorityLevel.MEDIUM: rank.get(PriorityLevel.MEDIUM.value, 99),
            PriorityLevel.LOW: rank.get(PriorityLevel.LOW.value, 99),
            PriorityLevel.URGENT.value: rank.get(PriorityLevel.URGENT.value, 99),
            PriorityLevel.HIGH.value: rank.get(PriorityLevel.HIGH.value, 99),
            PriorityLevel.MEDIUM.value: rank.get(PriorityLevel.MEDIUM.value, 99),
            PriorityLevel.LOW.value: rank.get(PriorityLevel.LOW.value, 99),
        }
    )
    return rank


PRIORITY_RANK = _priority_rank_map()
PRIORITY_WEIGHT = dict(_GENERATED_PRIORITY_WEIGHT)


def priority_rank(priority: Any) -> int:
    if isinstance(priority, PriorityLevel):
        return PRIORITY_RANK.get(priority, 99)
    return PRIORITY_RANK.get(priority, 99)


def priority_sort_key(column):
    return case(
        (column == PriorityLevel.URGENT, 0),
        (column == PriorityLevel.HIGH, 1),
        (column == PriorityLevel.MEDIUM, 2),
        (column == PriorityLevel.LOW, 3),
        else_=99,
    )


# --- from rules/order_test_lab_loader.py ---

"""Batch-load lab work-item projections for order tests."""


from collections import defaultdict

from app.domains.lab.specimen.models import Sample
from app.domains.orders.models import Order, OrderTest
from app.shared.enums import TestStatus
from sqlalchemy.orm import Session


def lab_projections_for_orders(
    db: Session,
    orders: list[Order],
) -> dict[str, dict[int, LabWorkItemProjection]]:
    """
    Project every test on a page of orders in one sample/escalation pass.

    Returns ``{orderId: {orderTestId: projection}}``.
    """
    result: dict[str, dict[int, LabWorkItemProjection]] = {order.orderId: {} for order in orders}
    all_tests: list[tuple[Order, OrderTest]] = []
    for order in orders:
        for order_test in list(order.tests or []):
            all_tests.append((order, order_test))
    if not all_tests:
        return result

    sample_ids = {order_test.sampleId for _, order_test in all_tests if order_test.sampleId}
    samples_by_id: dict[str, Sample] = {}
    if sample_ids:
        for sample in db.query(Sample).filter(Sample.sampleId.in_(sample_ids)).all():
            samples_by_id[sample.sampleId] = sample

    linked_by_sample: dict[str, list[OrderTest]] = defaultdict(list)
    for _, order_test in all_tests:
        if order_test.sampleId is not None:
            linked_by_sample[order_test.sampleId].append(order_test)

    escalated_ids = [
        order_test.id for _, order_test in all_tests if order_test.status == TestStatus.ESCALATED
    ]
    from app.domains.lab.quality.service import open_escalation_reason_codes_by_order_test_id

    escalation_code_by_test = open_escalation_reason_codes_by_order_test_id(db, escalated_ids)

    for order, order_test in all_tests:
        sample = samples_by_id.get(order_test.sampleId) if order_test.sampleId else None
        ctx = LabWorkItemContext(
            order=order,
            order_test=order_test,
            sample=sample,
            linked_order_tests=list(
                linked_by_sample.get(order_test.sampleId, []) if order_test.sampleId else []
            ),
            escalation_reason_code=escalation_code_by_test.get(order_test.id),
        )
        result[order.orderId][order_test.id] = project_order_test_pipeline(ctx)

    return result


def lab_projections_for_order(
    db: Session,
    order: Order,
) -> dict[int, LabWorkItemProjection]:
    """Project one order's tests."""
    return lab_projections_for_orders(db, [order]).get(order.orderId, {})


# --- from rules/status_presentation.py ---

"""
Map stored entity status + lab attention reasons to canonical presentation for UI.
"""

from app.shared.enums import (
    PRESENTATION_PRIMARY_BADGE_VARIANTS,
    PresentationPrimary,
)
from app.shared.lab_contract import (
    ATTENTION_LABELS,
    ORDER_STATUS_TO_PRIMARY,
    SAMPLE_STATUS_TO_PRIMARY,
    TERMINAL_TEST_STATUSES,
    TEST_STATUS_TO_PRIMARY,
    reason_blocks_progress,
)
from app.shared.http import StatusPresentation


def _variant(primary: str) -> str:
    return PRESENTATION_PRIMARY_BADGE_VARIANTS.get(primary, "neutral")


def _label_for_reason(reason: str | None) -> str | None:
    if not reason:
        return None
    return ATTENTION_LABELS.get(reason)


def _test_status_value(status) -> str:
    if hasattr(status, "value"):
        return status.value
    return str(status)


def _primary_for_status(status_str: str, mapping: dict[str, str]) -> str:
    return mapping.get(status_str, PresentationPrimary.PENDING.value)


def resolve_test_presentation(
    *,
    status,
    attention_reason: str | None = None,
    attention_label: str | None = None,
) -> StatusPresentation:
    """Presentation for an order test row."""
    status_str = _test_status_value(status)
    secondary_label = attention_label or _label_for_reason(attention_reason)

    if (
        status_str not in TERMINAL_TEST_STATUSES
        and attention_reason
        and reason_blocks_progress(attention_reason)
    ):
        blocked = PresentationPrimary.BLOCKED.value
        return StatusPresentation(
            primary=blocked,
            secondary=secondary_label,
            variant=_variant(blocked),
        )

    primary = _primary_for_status(status_str, TEST_STATUS_TO_PRIMARY)
    secondary: str | None = None
    if status_str == "escalated" and secondary_label:
        secondary = secondary_label

    return StatusPresentation(primary=primary, secondary=secondary, variant=_variant(primary))


def resolve_sample_presentation(
    *,
    status,
    attention_reason: str | None = None,
    attention_label: str | None = None,
    rejection_secondary: str | None = None,
) -> StatusPresentation:
    """Presentation for a sample (collection queue)."""
    status_str = status.value if hasattr(status, "value") else str(status)
    secondary_label = attention_label or _label_for_reason(attention_reason)

    if status_str == "pending" and attention_reason and reason_blocks_progress(attention_reason):
        blocked = PresentationPrimary.BLOCKED.value
        return StatusPresentation(
            primary=blocked,
            secondary=secondary_label,
            variant=_variant(blocked),
        )

    primary = _primary_for_status(status_str, SAMPLE_STATUS_TO_PRIMARY)
    secondary = rejection_secondary if primary == PresentationPrimary.REJECTED.value else None

    return StatusPresentation(primary=primary, secondary=secondary, variant=_variant(primary))


def resolve_order_presentation(overall_status) -> StatusPresentation:
    """Presentation for order rollup status."""
    status_str = overall_status.value if hasattr(overall_status, "value") else str(overall_status)
    primary = _primary_for_status(status_str, ORDER_STATUS_TO_PRIMARY)
    return StatusPresentation(primary=primary, secondary=None, variant=_variant(primary))


# --- from rules/work_item_projection.py ---

"""
Unified lab work-item projection for worklists, orders, and monitor.

Semantics:
- denyReason: primary reason the row's main action is disabled (fix this to proceed).
- attentionReason: contextual reason for badges/monitor (may block progress).
- attentionLabel / denyMessage: human copy from contracts/lab-policy.json blockers.
"""


from dataclasses import dataclass, field
from typing import Any, Literal

from app.domains.lab.specimen.models import Sample
from app.domains.orders.models import Order, OrderTest
from app.shared.enums import TestStatus
from app.shared.lab_contract import ATTENTION_LABELS, reason_blocks_progress
from app.shared.http import StatusPresentation
from pydantic import BaseModel, Field

MonitorAttentionStage = Literal["collection", "entry", "validation", "escalation"]

PipelineStage = Literal["collection", "entry", "validation", "completed", "cancelled"]


class LabWorklistAllowedActions(BaseModel):
    """Shared allowed-action flags for lab worklists and order test projections."""

    model_config = {"populate_by_name": True}

    collect: bool = False
    enterResults: bool = False
    can_validate: bool = Field(default=False, alias="validate")
    reject: bool = False


class EscalationActionFlags(BaseModel):
    criticalNotificationSent: bool = False
    allowForceValidate: bool = True


class LabWorkItemProjection(BaseModel):
    model_config = {"populate_by_name": True}

    pipelineStage: PipelineStage
    attentionReason: str | None = None
    attentionLabel: str | None = None
    denyReason: str | None = None
    denyMessage: str | None = None
    allowedActions: LabWorklistAllowedActions = Field(default_factory=LabWorklistAllowedActions)
    escalation: EscalationActionFlags | None = None
    statusPresentation: StatusPresentation | None = None


@dataclass
class LabWorkItemContext:
    order: Order
    order_test: OrderTest | None = None
    sample: Sample | None = None
    linked_order_tests: list[OrderTest] = field(default_factory=list)
    escalation_reason_code: str | None = None


def _attention_label(reason: str | None) -> str | None:
    if not reason:
        return None
    return ATTENTION_LABELS.get(reason)


def _surface_attention(reason: str | None) -> tuple[str | None, str | None]:
    """Expose reason/label only when it blocks progress (or is an explicit gate)."""
    if not reason:
        return None, None
    if reason_blocks_progress(reason):
        return reason, _attention_label(reason)
    return None, None


def _actions_model(actions: dict[str, bool]) -> LabWorklistAllowedActions:
    return LabWorklistAllowedActions(
        collect=bool(actions.get("collect")),
        enterResults=bool(actions.get("enterResults")),
        validate=bool(actions.get("validate")),
        reject=bool(actions.get("reject")),
    )


def _payment_status(order: Order) -> str | None:
    if order.paymentStatus is None:
        return None
    return (
        order.paymentStatus.value
        if hasattr(order.paymentStatus, "value")
        else str(order.paymentStatus)
    )


def _test_status_value(order_test: OrderTest) -> str:
    status = order_test.status
    return status.value if hasattr(status, "value") else str(status)


def _sample_status_value(sample: Sample | None) -> str | None:
    if sample is None or sample.status is None:
        return None
    return sample.status.value if hasattr(sample.status, "value") else str(sample.status)


def _with_test_presentation(
    projection: LabWorkItemProjection,
    test_status: TestStatus | str,
) -> LabWorkItemProjection:
    return projection.model_copy(
        update={
            "statusPresentation": resolve_test_presentation(
                status=test_status,
                attention_reason=projection.attentionReason,
                attention_label=projection.attentionLabel,
            )
        }
    )


def project_collection_sample(ctx: LabWorkItemContext) -> LabWorkItemProjection:
    if ctx.sample is None:
        raise ValueError("sample is required for collection projection")

    sample = ctx.sample
    order = ctx.order
    raw_attention = attention_reason_for_work_item(
        status=TestStatus.PENDING.value,
        payment_status=_payment_status(order),
    )
    allowed, deny_reason = action_flags_for_collection(
        sample=sample,
        order=order,
        order_tests=ctx.linked_order_tests,
    )
    collect_allowed = bool(allowed.get("collect"))
    effective_deny = effective_deny_reason(
        deny_reason=deny_reason,
        attention_reason=raw_attention,
        primary_action_allowed=collect_allowed,
    )
    attention_reason, attention_label = _surface_attention(raw_attention)

    base = LabWorkItemProjection(
        pipelineStage="collection",
        attentionReason=attention_reason,
        attentionLabel=attention_label,
        denyReason=effective_deny,
        denyMessage=deny_message(effective_deny),
        allowedActions=_actions_model(allowed),
        statusPresentation=resolve_sample_presentation(
            status=sample.status,
            attention_reason=raw_attention,
            attention_label=_attention_label(raw_attention),
        ),
    )
    return base


def project_order_test_entry(ctx: LabWorkItemContext) -> LabWorkItemProjection:
    if ctx.order_test is None:
        raise ValueError("order_test is required for entry projection")

    order_test = ctx.order_test
    status = _test_status_value(order_test)
    raw_attention = attention_reason_for_work_item(
        status=status,
        payment_status=_payment_status(ctx.order),
        sample_status=_sample_status_value(ctx.sample),
        escalation_reason_code=ctx.escalation_reason_code,
    )
    allowed, deny_reason = action_flags_for_entry(order_test=order_test)
    enter_allowed = bool(allowed.get("enterResults"))
    effective_deny = effective_deny_reason(
        deny_reason=deny_reason,
        attention_reason=raw_attention,
        primary_action_allowed=enter_allowed,
    )
    attention_reason, attention_label = _surface_attention(raw_attention)

    return _with_test_presentation(
        LabWorkItemProjection(
            pipelineStage="entry",
            attentionReason=attention_reason,
            attentionLabel=attention_label,
            denyReason=effective_deny,
            denyMessage=deny_message(effective_deny),
            allowedActions=_actions_model(allowed),
        ),
        order_test.status,
    )


def project_order_test_validation(ctx: LabWorkItemContext) -> LabWorkItemProjection:
    if ctx.order_test is None:
        raise ValueError("order_test is required for validation projection")

    order_test = ctx.order_test
    status = _test_status_value(order_test)
    raw_attention = attention_reason_for_work_item(
        status=status,
        sample_status=_sample_status_value(ctx.sample),
        escalation_reason_code=ctx.escalation_reason_code,
    )
    allowed, deny_reason = action_flags_for_validation(order_test=order_test)
    validate_allowed = bool(allowed.get("validate"))
    effective_deny = effective_deny_reason(
        deny_reason=deny_reason,
        attention_reason=raw_attention,
        primary_action_allowed=validate_allowed,
    )
    attention_reason, attention_label = _surface_attention(raw_attention)
    esc: dict[str, Any] | None = None
    if status == TestStatus.ESCALATED.value:
        esc = escalation_action_flags(order_test, reason_code=ctx.escalation_reason_code)

    return _with_test_presentation(
        LabWorkItemProjection(
            pipelineStage="validation",
            attentionReason=attention_reason,
            attentionLabel=attention_label,
            denyReason=effective_deny,
            denyMessage=deny_message(effective_deny),
            allowedActions=_actions_model(allowed),
            escalation=EscalationActionFlags.model_validate(esc) if esc else None,
        ),
        order_test.status,
    )


def project_order_test_pipeline(ctx: LabWorkItemContext) -> LabWorkItemProjection:
    """Project from order test status (entry vs validation vs terminal)."""
    if ctx.order_test is None:
        raise ValueError("order_test is required")

    status = ctx.order_test.status
    if status == TestStatus.SAMPLE_COLLECTED:
        return project_order_test_entry(ctx)
    if status == TestStatus.RESULTED:
        return project_order_test_validation(ctx)
    if status == TestStatus.ESCALATED:
        return project_order_test_validation(ctx)
    if status in (TestStatus.VALIDATED, TestStatus.SUPERSEDED, TestStatus.REMOVED):
        return _with_test_presentation(
            LabWorkItemProjection(
                pipelineStage="completed",
                allowedActions=_actions_model({}),
            ),
            status,
        )
    if status == TestStatus.CANCELLED:
        return _with_test_presentation(
            LabWorkItemProjection(
                pipelineStage="cancelled",
                allowedActions=_actions_model({}),
            ),
            status,
        )
    if status == TestStatus.PENDING and ctx.sample is not None:
        collection = project_collection_sample(ctx)
        return _with_test_presentation(collection, status)

    return _with_test_presentation(
        LabWorkItemProjection(
            pipelineStage="entry",
            allowedActions=_actions_model({}),
        ),
        status,
    )


def attention_label_for_reason(reason: str | None) -> str | None:
    return _attention_label(reason)


def attention_reason_for_monitor_row(
    stage: MonitorAttentionStage,
    *,
    payment_status: str | None = None,
    sample_status: str | None = None,
    escalation_reason_code: str | None = None,
) -> str | None:
    """Board/TAT attention rows (dict snapshots) — same rules as work-item projection."""
    if stage == "collection":
        status = TestStatus.PENDING.value
    elif stage == "entry":
        status = TestStatus.SAMPLE_COLLECTED.value
    elif stage == "validation":
        status = TestStatus.RESULTED.value
    else:
        status = TestStatus.ESCALATED.value

    attention = attention_reason_for_work_item(
        status=status,
        payment_status=payment_status,
        sample_status=sample_status,
        escalation_reason_code=escalation_reason_code,
    )
    if stage == "escalation":
        return attention or "supervisor_review"
    return attention


def projection_to_worklist_fields(projection: LabWorkItemProjection) -> dict[str, Any]:
    """Flatten projection for worklist dict builders."""
    presentation = None
    if projection.statusPresentation is not None:
        presentation = projection.statusPresentation.model_dump()
    return {
        "pipelineStage": projection.pipelineStage,
        "attentionReason": projection.attentionReason,
        "attentionLabel": projection.attentionLabel,
        "allowedActions": projection.allowedActions.model_dump(by_alias=True),
        "denyReason": projection.denyReason,
        "denyMessage": projection.denyMessage,
        "statusPresentation": presentation,
    }
