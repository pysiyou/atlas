"""
Unified lab work-item projection for worklists, orders, and monitor.

Semantics:
- denyReason: primary reason the row's main action is disabled (fix this to proceed).
- blockedReason: contextual blocker for badges/attention (often equals denyReason).
- blockedLabel / denyMessage: human copy from contracts/lab-blockers.json.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Literal

from app.domains.lab.models.sample import Sample
from app.domains.lab.rules.eligibility import (
    action_flags_for_collection,
    action_flags_for_entry,
    action_flags_for_validation,
    blocked_reason_for_work_item,
    deny_message,
    escalation_action_flags,
)
from app.domains.lab.schemas.allowed_actions import LabWorklistAllowedActions
from app.domains.orders.models import Order, OrderTest
from app.domains.lab.rules.status_presentation import (
    resolve_sample_presentation,
    resolve_test_presentation,
)
from app.shared.contracts.enums import TestStatus
from app.shared.contracts.lab_blockers import BLOCKED_LABELS
from app.shared.schemas.status_presentation import StatusPresentation
from pydantic import BaseModel, Field

MonitorAttentionStage = Literal["collection", "entry", "validation", "escalation"]

PipelineStage = Literal[
    "collection", "entry", "validation", "escalation", "completed", "cancelled"
]


class EscalationActionFlags(BaseModel):
    criticalNotificationSent: bool = False
    allowForceValidate: bool = True


class LabWorkItemProjection(BaseModel):
    model_config = {"populate_by_name": True}

    pipelineStage: PipelineStage
    blockedReason: str | None = None
    blockedLabel: str | None = None
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
    recollection_approval_pending: bool = False


def _blocked_label(reason: str | None) -> str | None:
    if not reason:
        return None
    return BLOCKED_LABELS.get(reason)


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
                blocked_reason=projection.blockedReason,
                blocked_label=projection.blockedLabel,
            )
        }
    )


def project_collection_sample(ctx: LabWorkItemContext) -> LabWorkItemProjection:
    if ctx.sample is None:
        raise ValueError("sample is required for collection projection")

    sample = ctx.sample
    order = ctx.order
    blocked = blocked_reason_for_work_item(
        status=TestStatus.PENDING.value,
        payment_status=_payment_status(order),
        sample_is_recollection=bool(sample.isRecollection),
    )
    if ctx.recollection_approval_pending:
        blocked = blocked or "recollection_approval"

    allowed, deny_reason = action_flags_for_collection(
        sample=sample,
        order=order,
        order_tests=ctx.linked_order_tests,
    )
    effective_deny = deny_reason or blocked

    base = LabWorkItemProjection(
        pipelineStage="collection",
        blockedReason=blocked,
        blockedLabel=_blocked_label(blocked),
        denyReason=effective_deny,
        denyMessage=deny_message(effective_deny),
        allowedActions=_actions_model(allowed),
        statusPresentation=resolve_sample_presentation(
            status=sample.status,
            blocked_reason=blocked,
            blocked_label=_blocked_label(blocked),
        ),
    )
    return base


def project_order_test_entry(ctx: LabWorkItemContext) -> LabWorkItemProjection:
    if ctx.order_test is None:
        raise ValueError("order_test is required for entry projection")

    order_test = ctx.order_test
    status = _test_status_value(order_test)
    blocked = blocked_reason_for_work_item(
        status=status,
        is_retest=bool(order_test.isRetest),
        payment_status=_payment_status(ctx.order),
        sample_status=_sample_status_value(ctx.sample),
        sample_is_recollection=bool(ctx.sample.isRecollection) if ctx.sample else False,
        escalation_reason_code=ctx.escalation_reason_code,
    )
    if ctx.recollection_approval_pending:
        blocked = blocked or "recollection_approval"

    allowed, deny_reason = action_flags_for_entry(order_test=order_test)
    enter_allowed = bool(allowed.get("enterResults"))
    # retest_pending is informational (monitor/TAT); it must not deny entry after collection.
    effective_deny = deny_reason if not enter_allowed else None
    if not enter_allowed:
        effective_deny = effective_deny or blocked

    return _with_test_presentation(
        LabWorkItemProjection(
            pipelineStage="entry",
            blockedReason=blocked,
            blockedLabel=_blocked_label(blocked),
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
    blocked = blocked_reason_for_work_item(
        status=status,
        is_retest=bool(order_test.isRetest),
        sample_status=_sample_status_value(ctx.sample),
        escalation_reason_code=ctx.escalation_reason_code,
    )
    if ctx.recollection_approval_pending:
        blocked = blocked or "recollection_approval"

    allowed, deny_reason = action_flags_for_validation(order_test=order_test)
    effective_deny = deny_reason or blocked
    esc: dict[str, Any] | None = None
    if status == TestStatus.ESCALATED.value:
        esc = escalation_action_flags(order_test, reason_code=ctx.escalation_reason_code)

    return _with_test_presentation(
        LabWorkItemProjection(
            pipelineStage="validation",
            blockedReason=blocked,
            blockedLabel=_blocked_label(blocked),
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


def blocked_label_for_reason(reason: str | None) -> str | None:
    return _blocked_label(reason)


def blocked_reason_for_monitor_row(
    stage: MonitorAttentionStage,
    *,
    payment_status: str | None = None,
    sample_status: str | None = None,
    sample_is_recollection: bool = False,
    is_retest: bool = False,
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

    blocked = blocked_reason_for_work_item(
        status=status,
        payment_status=payment_status,
        sample_status=sample_status,
        sample_is_recollection=sample_is_recollection,
        is_retest=is_retest,
        escalation_reason_code=escalation_reason_code,
    )
    if stage == "escalation":
        return blocked or "supervisor_review"
    return blocked


def projection_to_worklist_fields(projection: LabWorkItemProjection) -> dict[str, Any]:
    """Flatten projection for legacy worklist dict builders."""
    presentation = None
    if projection.statusPresentation is not None:
        presentation = projection.statusPresentation.model_dump()
    return {
        "blockedReason": projection.blockedReason,
        "blockedLabel": projection.blockedLabel,
        "allowedActions": projection.allowedActions.model_dump(by_alias=True),
        "denyReason": projection.denyReason,
        "denyMessage": projection.denyMessage,
        "statusPresentation": presentation,
    }
