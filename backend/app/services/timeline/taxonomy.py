"""
Event taxonomy for lab entity timelines.

Single registry mapping every LabOperationType to timeline scope, workflow phase, and tone.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Optional

from app.schemas.enums import LabOperationType


class TimelineScopeKind(str, Enum):
    ENTITY = "entity"
    COMMAND_CENTER_ONLY = "command_center_only"


class WorkflowPhase(str, Enum):
    SPECIMEN = "specimen"
    RESULTS = "results"
    VALIDATION = "validation"
    ESCALATION = "escalation"
    COMPOSITION = "composition"


class TimelineEventTone(str, Enum):
    NEUTRAL = "neutral"
    PROBLEM = "problem"
    RESOLUTION = "resolution"


@dataclass(frozen=True)
class EventDefinition:
    operation_type: LabOperationType
    timeline_scope: TimelineScopeKind
    phase: WorkflowPhase
    tone: TimelineEventTone
    quality_issue_stage_override: Optional[str] = None  # "collection" | "validation"


_RECOLLECTION_TYPES = {
    LabOperationType.RECOLLECTION_REQUEST_CREATED,
    LabOperationType.RECOLLECTION_REQUEST_APPROVED,
    LabOperationType.RECOLLECTION_REQUEST_DENIED,
}

_ESCALATION_TRIGGER_TYPES = {
    LabOperationType.ESCALATION_TRIGGER_CRIT_VAL,
    LabOperationType.ESCALATION_TRIGGER_REJ_SAMP,
    LabOperationType.ESCALATION_TRIGGER_LIMIT_HIT,
    LabOperationType.ESCALATION_TRIGGER_AMEND_RES,
}

_ESCALATION_RESOLUTION_TYPES = {
    LabOperationType.ESCALATION_RESOLUTION_AUTHORIZE_RETEST,
    LabOperationType.ESCALATION_RESOLUTION_AUTHORIZE_RECOLLECT,
    LabOperationType.ESCALATION_RESOLUTION_FORCE_VALIDATE,
    LabOperationType.ESCALATION_RESOLUTION_APPLY_AMENDMENT,
    LabOperationType.ESCALATION_RESOLUTION_CANCEL_TEST,
}

_EVENT_REGISTRY: dict[LabOperationType, EventDefinition] = {
    LabOperationType.SAMPLE_COLLECT: EventDefinition(
        LabOperationType.SAMPLE_COLLECT,
        TimelineScopeKind.ENTITY,
        WorkflowPhase.SPECIMEN,
        TimelineEventTone.NEUTRAL,
    ),
    LabOperationType.SAMPLE_REJECT: EventDefinition(
        LabOperationType.SAMPLE_REJECT,
        TimelineScopeKind.ENTITY,
        WorkflowPhase.SPECIMEN,
        TimelineEventTone.PROBLEM,
    ),
    LabOperationType.SAMPLE_RECOLLECTION_REQUEST: EventDefinition(
        LabOperationType.SAMPLE_RECOLLECTION_REQUEST,
        TimelineScopeKind.ENTITY,
        WorkflowPhase.SPECIMEN,
        TimelineEventTone.PROBLEM,
    ),
    LabOperationType.RECOLLECTION_REQUEST_CREATED: EventDefinition(
        LabOperationType.RECOLLECTION_REQUEST_CREATED,
        TimelineScopeKind.ENTITY,
        WorkflowPhase.SPECIMEN,
        TimelineEventTone.PROBLEM,
    ),
    LabOperationType.RECOLLECTION_REQUEST_APPROVED: EventDefinition(
        LabOperationType.RECOLLECTION_REQUEST_APPROVED,
        TimelineScopeKind.ENTITY,
        WorkflowPhase.SPECIMEN,
        TimelineEventTone.RESOLUTION,
    ),
    LabOperationType.RECOLLECTION_REQUEST_DENIED: EventDefinition(
        LabOperationType.RECOLLECTION_REQUEST_DENIED,
        TimelineScopeKind.ENTITY,
        WorkflowPhase.SPECIMEN,
        TimelineEventTone.PROBLEM,
    ),
    LabOperationType.RESULT_ENTRY: EventDefinition(
        LabOperationType.RESULT_ENTRY,
        TimelineScopeKind.ENTITY,
        WorkflowPhase.RESULTS,
        TimelineEventTone.NEUTRAL,
    ),
    LabOperationType.CRITICAL_VALUE_DETECTED: EventDefinition(
        LabOperationType.CRITICAL_VALUE_DETECTED,
        TimelineScopeKind.ENTITY,
        WorkflowPhase.RESULTS,
        TimelineEventTone.PROBLEM,
    ),
    LabOperationType.CRITICAL_VALUE_NOTIFIED: EventDefinition(
        LabOperationType.CRITICAL_VALUE_NOTIFIED,
        TimelineScopeKind.ENTITY,
        WorkflowPhase.RESULTS,
        TimelineEventTone.PROBLEM,
    ),
    LabOperationType.CRITICAL_VALUE_ACKNOWLEDGED: EventDefinition(
        LabOperationType.CRITICAL_VALUE_ACKNOWLEDGED,
        TimelineScopeKind.ENTITY,
        WorkflowPhase.RESULTS,
        TimelineEventTone.RESOLUTION,
    ),
    LabOperationType.RESULT_VALIDATION_APPROVE: EventDefinition(
        LabOperationType.RESULT_VALIDATION_APPROVE,
        TimelineScopeKind.ENTITY,
        WorkflowPhase.VALIDATION,
        TimelineEventTone.RESOLUTION,
    ),
    LabOperationType.QUALITY_ISSUE_REPORTED: EventDefinition(
        LabOperationType.QUALITY_ISSUE_REPORTED,
        TimelineScopeKind.ENTITY,
        WorkflowPhase.VALIDATION,
        TimelineEventTone.PROBLEM,
        quality_issue_stage_override="validation",
    ),
    LabOperationType.TEST_ADDED: EventDefinition(
        LabOperationType.TEST_ADDED,
        TimelineScopeKind.ENTITY,
        WorkflowPhase.COMPOSITION,
        TimelineEventTone.NEUTRAL,
    ),
    LabOperationType.TEST_REMOVED: EventDefinition(
        LabOperationType.TEST_REMOVED,
        TimelineScopeKind.ENTITY,
        WorkflowPhase.COMPOSITION,
        TimelineEventTone.PROBLEM,
    ),
    LabOperationType.ORDER_STATUS_CHANGE: EventDefinition(
        LabOperationType.ORDER_STATUS_CHANGE,
        TimelineScopeKind.COMMAND_CENTER_ONLY,
        WorkflowPhase.COMPOSITION,
        TimelineEventTone.NEUTRAL,
    ),
    LabOperationType.ORDER_PAYMENT_RECORDED: EventDefinition(
        LabOperationType.ORDER_PAYMENT_RECORDED,
        TimelineScopeKind.COMMAND_CENTER_ONLY,
        WorkflowPhase.COMPOSITION,
        TimelineEventTone.RESOLUTION,
    ),
}

for _op in _ESCALATION_TRIGGER_TYPES:
    _EVENT_REGISTRY[_op] = EventDefinition(
        _op, TimelineScopeKind.ENTITY, WorkflowPhase.ESCALATION, TimelineEventTone.PROBLEM
    )

for _op in _ESCALATION_RESOLUTION_TYPES:
    _EVENT_REGISTRY[_op] = EventDefinition(
        _op, TimelineScopeKind.ENTITY, WorkflowPhase.ESCALATION, TimelineEventTone.RESOLUTION
    )


def _parse_operation_type(value: str | LabOperationType | None) -> Optional[LabOperationType]:
    if value is None:
        return None
    if isinstance(value, LabOperationType):
        return value
    try:
        return LabOperationType(value)
    except ValueError:
        return None


def get_event_definition(operation_type: str | LabOperationType | None) -> Optional[EventDefinition]:
    parsed = _parse_operation_type(operation_type)
    if parsed is None:
        return None
    return _EVENT_REGISTRY.get(parsed)


def is_entity_visible(operation_type: str | LabOperationType | None) -> bool:
    definition = get_event_definition(operation_type)
    if definition is None:
        return False
    return definition.timeline_scope == TimelineScopeKind.ENTITY


def get_event_phase(
    operation_type: str | LabOperationType | None,
    *,
    quality_stage: Optional[str] = None,
) -> Optional[str]:
    definition = get_event_definition(operation_type)
    if definition is None:
        return None
    if (
        definition.operation_type == LabOperationType.QUALITY_ISSUE_REPORTED
        and quality_stage == "collection"
    ):
        return WorkflowPhase.SPECIMEN.value
    return definition.phase.value


def get_event_tone(operation_type: str | LabOperationType | None) -> str:
    definition = get_event_definition(operation_type)
    if definition is None:
        return TimelineEventTone.NEUTRAL.value
    return definition.tone.value


RECOLLECTION_REQUEST_TYPES = {op.value for op in _RECOLLECTION_TYPES}
