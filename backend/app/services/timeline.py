"""
Event taxonomy for lab entity timelines.

Single registry mapping every LabOperationType to timeline scope, category, and tone.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from enum import Enum
from typing import Any, Literal

from app.models.lab_audit import LabOperationLog
from app.models.order import Order, OrderTest
from app.models.quality_issue import QualityIssue
from app.models.recollection_request import RecollectionRequest
from app.models.sample import Sample
from app.models.user import User
from app.schemas.enums import LabOperationType
from app.utils.exceptions import LabOperationError
from sqlalchemy import and_, desc, func, or_
from sqlalchemy.orm import Session


class TimelineScopeKind(str, Enum):
    ENTITY = "entity"
    COMMAND_CENTER_ONLY = "command_center_only"


class TimelineCategory(str, Enum):
    ORDER = "order"
    PAYMENT = "payment"
    SAMPLE = "sample"
    RESULT = "result"
    OTHER = "other"


class TimelineEventTone(str, Enum):
    NEUTRAL = "neutral"
    PROBLEM = "problem"
    RESOLUTION = "resolution"


@dataclass(frozen=True)
class EventDefinition:
    operation_type: LabOperationType
    timeline_scope: TimelineScopeKind
    category: TimelineCategory
    tone: TimelineEventTone
    quality_issue_stage_override: str | None = None  # "collection" | "validation"


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
        TimelineCategory.SAMPLE,
        TimelineEventTone.NEUTRAL,
    ),
    LabOperationType.SAMPLE_REJECT: EventDefinition(
        LabOperationType.SAMPLE_REJECT,
        TimelineScopeKind.ENTITY,
        TimelineCategory.SAMPLE,
        TimelineEventTone.PROBLEM,
    ),
    LabOperationType.SAMPLE_RECOLLECTION_REQUEST: EventDefinition(
        LabOperationType.SAMPLE_RECOLLECTION_REQUEST,
        TimelineScopeKind.ENTITY,
        TimelineCategory.SAMPLE,
        TimelineEventTone.PROBLEM,
    ),
    LabOperationType.RECOLLECTION_REQUEST_CREATED: EventDefinition(
        LabOperationType.RECOLLECTION_REQUEST_CREATED,
        TimelineScopeKind.ENTITY,
        TimelineCategory.OTHER,
        TimelineEventTone.PROBLEM,
    ),
    LabOperationType.RECOLLECTION_REQUEST_APPROVED: EventDefinition(
        LabOperationType.RECOLLECTION_REQUEST_APPROVED,
        TimelineScopeKind.ENTITY,
        TimelineCategory.OTHER,
        TimelineEventTone.RESOLUTION,
    ),
    LabOperationType.RECOLLECTION_REQUEST_DENIED: EventDefinition(
        LabOperationType.RECOLLECTION_REQUEST_DENIED,
        TimelineScopeKind.ENTITY,
        TimelineCategory.OTHER,
        TimelineEventTone.PROBLEM,
    ),
    LabOperationType.RESULT_ENTRY: EventDefinition(
        LabOperationType.RESULT_ENTRY,
        TimelineScopeKind.ENTITY,
        TimelineCategory.RESULT,
        TimelineEventTone.NEUTRAL,
    ),
    LabOperationType.CRITICAL_VALUE_DETECTED: EventDefinition(
        LabOperationType.CRITICAL_VALUE_DETECTED,
        TimelineScopeKind.ENTITY,
        TimelineCategory.RESULT,
        TimelineEventTone.PROBLEM,
    ),
    LabOperationType.CRITICAL_VALUE_NOTIFIED: EventDefinition(
        LabOperationType.CRITICAL_VALUE_NOTIFIED,
        TimelineScopeKind.ENTITY,
        TimelineCategory.RESULT,
        TimelineEventTone.PROBLEM,
    ),
    LabOperationType.CRITICAL_VALUE_ACKNOWLEDGED: EventDefinition(
        LabOperationType.CRITICAL_VALUE_ACKNOWLEDGED,
        TimelineScopeKind.ENTITY,
        TimelineCategory.RESULT,
        TimelineEventTone.RESOLUTION,
    ),
    LabOperationType.RESULT_VALIDATION_APPROVE: EventDefinition(
        LabOperationType.RESULT_VALIDATION_APPROVE,
        TimelineScopeKind.ENTITY,
        TimelineCategory.RESULT,
        TimelineEventTone.RESOLUTION,
    ),
    LabOperationType.QUALITY_ISSUE_REPORTED: EventDefinition(
        LabOperationType.QUALITY_ISSUE_REPORTED,
        TimelineScopeKind.ENTITY,
        TimelineCategory.RESULT,
        TimelineEventTone.PROBLEM,
        quality_issue_stage_override="validation",
    ),
    LabOperationType.TEST_ADDED: EventDefinition(
        LabOperationType.TEST_ADDED,
        TimelineScopeKind.ENTITY,
        TimelineCategory.ORDER,
        TimelineEventTone.NEUTRAL,
    ),
    LabOperationType.TEST_REMOVED: EventDefinition(
        LabOperationType.TEST_REMOVED,
        TimelineScopeKind.ENTITY,
        TimelineCategory.ORDER,
        TimelineEventTone.PROBLEM,
    ),
    LabOperationType.ORDER_STATUS_CHANGE: EventDefinition(
        LabOperationType.ORDER_STATUS_CHANGE,
        TimelineScopeKind.COMMAND_CENTER_ONLY,
        TimelineCategory.ORDER,
        TimelineEventTone.NEUTRAL,
    ),
    LabOperationType.ORDER_PAYMENT_RECORDED: EventDefinition(
        LabOperationType.ORDER_PAYMENT_RECORDED,
        TimelineScopeKind.COMMAND_CENTER_ONLY,
        TimelineCategory.PAYMENT,
        TimelineEventTone.RESOLUTION,
    ),
}

for _op in _ESCALATION_TRIGGER_TYPES:
    _EVENT_REGISTRY[_op] = EventDefinition(
        _op, TimelineScopeKind.ENTITY, TimelineCategory.OTHER, TimelineEventTone.PROBLEM
    )

for _op in _ESCALATION_RESOLUTION_TYPES:
    _EVENT_REGISTRY[_op] = EventDefinition(
        _op, TimelineScopeKind.ENTITY, TimelineCategory.OTHER, TimelineEventTone.RESOLUTION
    )


def _parse_operation_type(value: str | LabOperationType | None) -> LabOperationType | None:
    if value is None:
        return None
    if isinstance(value, LabOperationType):
        return value
    try:
        return LabOperationType(value)
    except ValueError:
        return None


def get_event_definition(operation_type: str | LabOperationType | None) -> EventDefinition | None:
    parsed = _parse_operation_type(operation_type)
    if parsed is None:
        return None
    return _EVENT_REGISTRY.get(parsed)


def is_entity_visible(operation_type: str | LabOperationType | None) -> bool:
    definition = get_event_definition(operation_type)
    if definition is None:
        return False
    return definition.timeline_scope == TimelineScopeKind.ENTITY


def get_event_category(
    operation_type: str | LabOperationType | None,
    *,
    quality_stage: str | None = None,
) -> str | None:
    definition = get_event_definition(operation_type)
    if definition is None:
        return None
    if (
        definition.operation_type == LabOperationType.QUALITY_ISSUE_REPORTED
        and quality_stage == "collection"
    ):
        return TimelineCategory.SAMPLE.value
    return definition.category.value


def get_event_tone(operation_type: str | LabOperationType | None) -> str:
    definition = get_event_definition(operation_type)
    if definition is None:
        return TimelineEventTone.NEUTRAL.value
    return definition.tone.value


RECOLLECTION_REQUEST_TYPES = {op.value for op in _RECOLLECTION_TYPES}

_TIMELINE_CATEGORY_ALIASES: dict[str, str] = {
    "specimen": "sample",
    "results": "result",
    "validation": "result",
    "escalation": "other",
    "quality": "result",
    "composition": "order",
}

TIMELINE_CATEGORY_TYPES: dict[str, set[LabOperationType]] = {
    "sample": {
        LabOperationType.SAMPLE_COLLECT,
        LabOperationType.SAMPLE_REJECT,
        LabOperationType.SAMPLE_RECOLLECTION_REQUEST,
        LabOperationType.QUALITY_ISSUE_REPORTED,
    },
    "result": {
        LabOperationType.RESULT_ENTRY,
        LabOperationType.RESULT_VALIDATION_APPROVE,
        LabOperationType.CRITICAL_VALUE_DETECTED,
        LabOperationType.CRITICAL_VALUE_NOTIFIED,
        LabOperationType.CRITICAL_VALUE_ACKNOWLEDGED,
        LabOperationType.QUALITY_ISSUE_REPORTED,
    },
    "order": {
        LabOperationType.TEST_ADDED,
        LabOperationType.TEST_REMOVED,
        LabOperationType.ORDER_STATUS_CHANGE,
    },
    "payment": {
        LabOperationType.ORDER_PAYMENT_RECORDED,
    },
    "other": {
        LabOperationType.RECOLLECTION_REQUEST_CREATED,
        LabOperationType.RECOLLECTION_REQUEST_APPROVED,
        LabOperationType.RECOLLECTION_REQUEST_DENIED,
        *_ESCALATION_TRIGGER_TYPES,
        *_ESCALATION_RESOLUTION_TYPES,
    },
}


def _normalize_category_name(name: str) -> str:
    key = name.strip().lower()
    return _TIMELINE_CATEGORY_ALIASES.get(key, key)


def operation_types_for_categories(categories: list[str] | None) -> list[LabOperationType] | None:
    """Resolve command-center timeline category names to LabOperationType values."""
    if not categories:
        return None
    types: set[LabOperationType] = set()
    for category in categories:
        mapped = TIMELINE_CATEGORY_TYPES.get(_normalize_category_name(category))
        if mapped:
            types.update(mapped)
    return sorted(types, key=lambda op: op.value) if types else None


"""Shared audit log → timeline event formatting."""


class TimelineFormatter:
    def __init__(self, db: Session):
        self.db = db

    def build_user_map(self, logs: list[LabOperationLog]) -> dict[str, str]:
        user_ids = {
            int(log.performedBy) for log in logs if log.performedBy and log.performedBy.isdigit()
        }
        if not user_ids:
            return {}
        users = self.db.query(User.id, User.name).filter(User.id.in_(user_ids)).all()
        return {str(user.id): user.name for user in users}

    @staticmethod
    def performer_name(log: LabOperationLog, user_map: dict[str, str]) -> str | None:
        if log.performedBy == "system":
            return "System"
        return user_map.get(log.performedBy)

    def format_command_center_event(self, log: LabOperationLog, user_map: dict[str, str]) -> dict:
        op_type = log.operationType.value if log.operationType else None
        metadata = log.operationData or {}
        quality_stage = metadata.get("stage") or (log.afterState or {}).get("stage")
        return {
            "id": log.id,
            "type": op_type,
            "category": get_event_category(op_type, quality_stage=quality_stage),
            "tone": get_event_tone(op_type),
            "entityType": log.entityType,
            "entityId": log.entityId,
            "timestamp": log.performedAt.isoformat(),
            "performedBy": log.performedBy,
            "performedByName": self.performer_name(log, user_map),
            "metadata": metadata,
            "beforeState": log.beforeState,
            "afterState": log.afterState,
            "comment": log.comment,
        }

    def format_entity_event(self, log: LabOperationLog, user_map: dict[str, str]) -> dict:
        op_type = log.operationType.value if log.operationType else None
        metadata = log.operationData or {}
        quality_stage = metadata.get("stage") or (log.afterState or {}).get("stage")
        return {
            "id": log.id,
            "type": op_type,
            "category": get_event_category(op_type, quality_stage=quality_stage),
            "tone": get_event_tone(op_type),
            "entityType": log.entityType,
            "entityId": log.entityId,
            "timestamp": log.performedAt.isoformat(),
            "performedBy": log.performedBy,
            "performedByName": self.performer_name(log, user_map),
            "metadata": metadata,
            "beforeState": log.beforeState,
            "afterState": log.afterState,
            "comment": log.comment,
        }


"""
Relevance engine — decides which audit logs belong on sample vs test entity timelines.
"""


@dataclass
class TestTimelineScope:
    """Context for filtering events on an order_test timeline."""

    anchor_test_id: int
    order_test_ids: set[int] = field(default_factory=set)
    sample_ids: set[int] = field(default_factory=set)
    test_codes: set[str] = field(default_factory=set)
    test_sample_map: dict[int, int] = field(default_factory=dict)  # order_test_id -> sample_id
    quality_issue_order_test_map: dict[int, int] = field(
        default_factory=dict
    )  # issue_id -> order_test_id
    recollection_request_map: dict[int, dict[str, Any]] = field(
        default_factory=dict
    )  # request_id -> row


@dataclass
class SampleTimelineScope:
    """Context for filtering events on a sample (tube) timeline."""

    anchor_sample_id: int
    sample_ids: set[int] = field(default_factory=set)
    quality_issue_sample_map: dict[int, int] = field(default_factory=dict)  # issue_id -> sample_id
    recollection_request_map: dict[int, dict[str, Any]] = field(default_factory=dict)


def _operation_value(log: LabOperationLog) -> str | None:
    if log.operationType is None:
        return None
    return (
        log.operationType.value if hasattr(log.operationType, "value") else str(log.operationType)
    )


def _metadata(log: LabOperationLog) -> dict[str, Any]:
    return log.operationData or {}


def _ids_from_metadata(meta: dict[str, Any], *keys: str) -> set[int]:
    found: set[int] = set()
    for key in keys:
        value = meta.get(key)
        if isinstance(value, int) and value > 0:
            found.add(value)
        elif isinstance(value, list):
            for item in value:
                if isinstance(item, int) and item > 0:
                    found.add(item)
    return found


def _test_codes_from_metadata(meta: dict[str, Any]) -> set[str]:
    codes: set[str] = set()
    raw = meta.get("testCodes")
    if isinstance(raw, list):
        codes.update(str(c) for c in raw if c)
    single = meta.get("testCode")
    if single:
        codes.add(str(single))
    return codes


class RelevanceEngine:
    """Filters lab operation logs for entity-scoped timelines."""

    @staticmethod
    def applies_to_test_timeline(log: LabOperationLog, scope: TestTimelineScope) -> bool:
        op = _operation_value(log)
        if not op or not is_entity_visible(op):
            return False

        entity_type = log.entityType
        entity_id = log.entityId
        meta = _metadata(log)

        if entity_type in ("test", "order_test"):
            return entity_id in scope.order_test_ids

        if entity_type == "quality_issue":
            issue_test_id = scope.quality_issue_order_test_map.get(entity_id)
            if issue_test_id is not None and issue_test_id in scope.order_test_ids:
                return True
            meta_test_ids = _ids_from_metadata(meta, "orderTestId", "escalatedTestId", "newTestId")
            return bool(meta_test_ids & scope.order_test_ids)

        if entity_type == "sample":
            if entity_id not in scope.sample_ids:
                return False
            meta_test_ids = _ids_from_metadata(meta, "orderTestId")
            if meta_test_ids & scope.order_test_ids:
                return True
            event_codes = _test_codes_from_metadata(meta)
            if event_codes:
                return bool(event_codes & scope.test_codes)
            for test_id in scope.order_test_ids:
                if scope.test_sample_map.get(test_id) == entity_id:
                    return True
            return False

        if entity_type == "order":
            if op not in RECOLLECTION_REQUEST_TYPES:
                return False
            return RelevanceEngine._recollection_applies_to_test(meta, scope)

        if op in (LabOperationType.TEST_ADDED.value, LabOperationType.TEST_REMOVED.value):
            return entity_id in scope.order_test_ids

        return False

    @staticmethod
    def applies_to_sample_timeline(log: LabOperationLog, scope: SampleTimelineScope) -> bool:
        op = _operation_value(log)
        if not op or not is_entity_visible(op):
            return False

        entity_type = log.entityType
        entity_id = log.entityId
        meta = _metadata(log)

        if entity_type == "sample":
            return entity_id in scope.sample_ids

        if entity_type == "quality_issue":
            issue_sample_id = scope.quality_issue_sample_map.get(entity_id)
            if issue_sample_id is not None and issue_sample_id in scope.sample_ids:
                stage = meta.get("stage") or (log.afterState or {}).get("stage")
                return stage == "collection"
            sample_id = meta.get("sampleId")
            if isinstance(sample_id, int) and sample_id in scope.sample_ids:
                stage = meta.get("stage") or (log.afterState or {}).get("stage")
                return stage == "collection"
            return False

        if entity_type == "order":
            if op not in RECOLLECTION_REQUEST_TYPES:
                return False
            return RelevanceEngine._recollection_applies_to_sample(meta, scope)

        # Test-result, escalation, validation events are not tube-centric.
        return False

    @staticmethod
    def _recollection_applies_to_test(meta: dict[str, Any], scope: TestTimelineScope) -> bool:
        meta_test_ids = _ids_from_metadata(meta, "orderTestId", "createdTestId")
        affected = _ids_from_metadata(meta, "affectedOrderTestIds")
        meta_test_ids.update(affected)
        if meta_test_ids & scope.order_test_ids:
            return True

        request_id = meta.get("requestId")
        if isinstance(request_id, int) and request_id in scope.recollection_request_map:
            row = scope.recollection_request_map[request_id]
            row_test_ids = _ids_from_metadata(row, "orderTestId")
            row_test_ids.update(_ids_from_metadata(row, "affectedOrderTestIds"))
            if row.get("createdTestId"):
                row_test_ids.add(int(row["createdTestId"]))
            return bool(row_test_ids & scope.order_test_ids)

        rejected_sample_id = meta.get("rejectedSampleId")
        if isinstance(rejected_sample_id, int) and rejected_sample_id in scope.sample_ids:
            if meta_test_ids:
                return bool(meta_test_ids & scope.order_test_ids)
            return True

        return False

    @staticmethod
    def _recollection_applies_to_sample(meta: dict[str, Any], scope: SampleTimelineScope) -> bool:
        rejected = meta.get("rejectedSampleId")
        if isinstance(rejected, int) and rejected in scope.sample_ids:
            return True

        request_id = meta.get("requestId")
        if isinstance(request_id, int) and request_id in scope.recollection_request_map:
            row = scope.recollection_request_map[request_id]
            rejected_id = row.get("rejectedSampleId")
            if isinstance(rejected_id, int) and rejected_id in scope.sample_ids:
                return True
            created_id = row.get("createdSampleId")
            if isinstance(created_id, int) and created_id in scope.sample_ids:
                return True

        created = meta.get("createdSampleId")
        if isinstance(created, int) and created in scope.sample_ids:
            return True

        return False


"""
Timeline services — command center feed and per-entity audit timelines.
"""


class CommandCenterService:
    """Global lab activity timeline."""

    def __init__(self, db: Session):
        self.db = db
        self._formatter = TimelineFormatter(db)

    def get_timeline_events(
        self,
        hours_back: int = 24,
        limit: int = 100,
        offset: int = 0,
        categories: list[str] | None = None,
    ) -> list[dict]:
        cutoff = datetime.now(UTC) - timedelta(hours=hours_back)
        query = self.db.query(LabOperationLog).filter(LabOperationLog.performedAt >= cutoff)
        operation_types = operation_types_for_categories(categories)
        if operation_types:
            query = query.filter(LabOperationLog.operationType.in_(operation_types))
        logs = query.order_by(LabOperationLog.performedAt.desc()).offset(offset).limit(limit).all()
        user_map = self._formatter.build_user_map(logs)
        return [self._formatter.format_command_center_event(log, user_map) for log in logs]

    def get_timeline_count(self, hours_back: int = 24, categories: list[str] | None = None) -> int:
        cutoff = datetime.now(UTC) - timedelta(hours=hours_back)
        query = self.db.query(func.count(LabOperationLog.id)).filter(
            LabOperationLog.performedAt >= cutoff
        )
        operation_types = operation_types_for_categories(categories)
        if operation_types:
            query = query.filter(LabOperationLog.operationType.in_(operation_types))
        return query.scalar() or 0


EntityKind = Literal["sample", "order_test", "order"]


@dataclass
class TimelineScope:
    entity_kind: EntityKind
    anchor_id: int
    sample_ids: set[int] = field(default_factory=set)
    order_test_ids: set[int] = field(default_factory=set)
    quality_issue_ids: set[int] = field(default_factory=set)
    order_id: int | None = None
    test_codes: set[str] = field(default_factory=set)
    test_sample_map: dict[int, int] = field(default_factory=dict)
    quality_issue_order_test_map: dict[int, int] = field(default_factory=dict)
    quality_issue_sample_map: dict[int, int] = field(default_factory=dict)
    recollection_request_map: dict[int, dict] = field(default_factory=dict)


class EntityTimelineService:
    """Builds a unified operation timeline for lab workflow entities."""

    def __init__(self, db: Session):
        self.db = db

    def get_timeline(self, entity_type: str, entity_id: int) -> tuple[list[dict], int]:
        normalized = entity_type.replace("-", "_")
        if normalized == "sample":
            scope = self._scope_for_sample(entity_id)
        elif normalized in ("order_test", "test"):
            scope = self._scope_for_order_test(entity_id)
        elif normalized == "order":
            scope = self._scope_for_order(entity_id)
        else:
            raise LabOperationError(
                f"Unsupported entity type '{entity_type}'. Use 'sample', 'order_test', or 'order'.",
                status_code=400,
            )

        logs = self._fetch_logs(scope)
        filtered = self._filter_logs(logs, scope)
        events = self._format_events(filtered)
        return events, len(events)

    def _scope_for_order(self, order_id: int) -> TimelineScope:
        order = self.db.query(Order).filter(Order.orderId == order_id).first()
        if not order:
            raise LabOperationError(f"Order {order_id} not found", status_code=404)

        samples = self.db.query(Sample).filter(Sample.orderId == order_id).all()
        sample_ids: set[int] = set()
        for sample in samples:
            sample_ids.update(self._collect_sample_chain(sample))

        order_tests = self.db.query(OrderTest).filter(OrderTest.orderId == order_id).all()
        order_test_ids = {t.id for t in order_tests}
        test_codes = {t.testCode for t in order_tests if t.testCode}
        test_sample_map = {
            t.id: t.sampleId for t in order_tests if t.sampleId is not None
        }

        quality_issues = self._quality_issues_for_test_scope(order_test_ids, sample_ids)

        return TimelineScope(
            entity_kind="order",
            anchor_id=order_id,
            sample_ids=sample_ids,
            order_test_ids=order_test_ids,
            quality_issue_ids={q.id for q in quality_issues},
            order_id=order_id,
            test_codes=test_codes,
            test_sample_map=test_sample_map,
            quality_issue_order_test_map={
                q.id: q.orderTestId for q in quality_issues if q.orderTestId is not None
            },
            quality_issue_sample_map={
                q.id: q.sampleId for q in quality_issues if q.sampleId is not None
            },
            recollection_request_map=self._recollection_request_map(order_id),
        )

    def _scope_for_sample(self, sample_id: int) -> TimelineScope:
        sample = self.db.query(Sample).filter(Sample.sampleId == sample_id).first()
        if not sample:
            raise LabOperationError(f"Sample {sample_id} not found", status_code=404)

        sample_ids = self._collect_sample_chain(sample)
        order_tests = self.db.query(OrderTest).filter(OrderTest.sampleId.in_(sample_ids)).all()
        order_test_ids = {t.id for t in order_tests}
        quality_issues = self._quality_issues_for_sample_scope(sample_ids, order_test_ids)

        return TimelineScope(
            entity_kind="sample",
            anchor_id=sample_id,
            sample_ids=sample_ids,
            order_test_ids=order_test_ids,
            quality_issue_ids={q.id for q in quality_issues},
            order_id=sample.orderId,
            quality_issue_sample_map={
                q.id: q.sampleId for q in quality_issues if q.sampleId is not None
            },
            recollection_request_map=self._recollection_request_map(sample.orderId),
        )

    def _scope_for_order_test(self, order_test_id: int) -> TimelineScope:
        order_test = self.db.query(OrderTest).filter(OrderTest.id == order_test_id).first()
        if not order_test:
            raise LabOperationError(f"Order test {order_test_id} not found", status_code=404)

        order_test_ids = self._collect_retest_chain(order_test)
        chain_tests = self.db.query(OrderTest).filter(OrderTest.id.in_(order_test_ids)).all()
        sample_ids: set[int] = set()
        test_codes: set[str] = set()
        test_sample_map: dict[int, int] = {}

        for test in chain_tests:
            if test.testCode:
                test_codes.add(test.testCode)
            if test.sampleId:
                test_sample_map[test.id] = test.sampleId
                linked_sample = (
                    self.db.query(Sample).filter(Sample.sampleId == test.sampleId).first()
                )
                if linked_sample:
                    sample_ids.update(self._collect_sample_chain(linked_sample))

        quality_issues = self._quality_issues_for_test_scope(order_test_ids, sample_ids)

        return TimelineScope(
            entity_kind="order_test",
            anchor_id=order_test_id,
            sample_ids=sample_ids,
            order_test_ids=order_test_ids,
            quality_issue_ids={q.id for q in quality_issues},
            order_id=order_test.orderId,
            test_codes=test_codes,
            test_sample_map=test_sample_map,
            quality_issue_order_test_map={
                q.id: q.orderTestId for q in quality_issues if q.orderTestId is not None
            },
            recollection_request_map=self._recollection_request_map(order_test.orderId),
        )

    def _quality_issues_for_sample_scope(
        self, sample_ids: set[int], order_test_ids: set[int]
    ) -> list[QualityIssue]:
        if not sample_ids and not order_test_ids:
            return []
        filters = []
        if sample_ids:
            filters.append(QualityIssue.sampleId.in_(sample_ids))
        if order_test_ids:
            filters.append(QualityIssue.orderTestId.in_(order_test_ids))
        return self.db.query(QualityIssue).filter(or_(*filters)).all()

    def _quality_issues_for_test_scope(
        self, order_test_ids: set[int], sample_ids: set[int]
    ) -> list[QualityIssue]:
        if not order_test_ids:
            return []
        by_test = (
            self.db.query(QualityIssue).filter(QualityIssue.orderTestId.in_(order_test_ids)).all()
        )
        if not sample_ids:
            return by_test
        by_sample = (
            self.db.query(QualityIssue)
            .filter(
                QualityIssue.sampleId.in_(sample_ids),
                QualityIssue.orderTestId.in_(order_test_ids),
            )
            .all()
        )
        seen = {q.id for q in by_test}
        return by_test + [q for q in by_sample if q.id not in seen]

    def _recollection_request_map(self, order_id: int) -> dict[int, dict]:
        requests = (
            self.db.query(RecollectionRequest).filter(RecollectionRequest.orderId == order_id).all()
        )
        result: dict[int, dict] = {}
        for req in requests:
            result[req.id] = {
                "orderTestId": req.orderTestId,
                "affectedOrderTestIds": list(req.affectedOrderTestIds or []),
                "rejectedSampleId": req.rejectedSampleId,
                "createdSampleId": req.createdSampleId,
                "createdTestId": req.createdTestId,
            }
        return result

    def _collect_sample_chain(self, sample: Sample) -> set[int]:
        ids: set[int] = {sample.sampleId}
        current = sample
        while current.originalSampleId and current.originalSampleId not in ids:
            ids.add(current.originalSampleId)
            current = (
                self.db.query(Sample).filter(Sample.sampleId == current.originalSampleId).first()
            )
            if not current:
                break

        while True:
            successors = (
                self.db.query(Sample.sampleId).filter(Sample.originalSampleId.in_(ids)).all()
            )
            new_ids = {sid for (sid,) in successors if sid not in ids}
            if not new_ids:
                break
            ids.update(new_ids)
        return ids

    def _collect_retest_chain(self, order_test: OrderTest) -> set[int]:
        ids: set[int] = {order_test.id}
        queue = [order_test]

        while queue:
            current = queue.pop()
            if current.retestOfTestId and current.retestOfTestId not in ids:
                parent = (
                    self.db.query(OrderTest).filter(OrderTest.id == current.retestOfTestId).first()
                )
                if parent:
                    ids.add(parent.id)
                    queue.append(parent)
            if current.retestOrderTestId and current.retestOrderTestId not in ids:
                child = (
                    self.db.query(OrderTest)
                    .filter(OrderTest.id == current.retestOrderTestId)
                    .first()
                )
                if child:
                    ids.add(child.id)
                    queue.append(child)

        return ids

    def _fetch_logs(self, scope: TimelineScope) -> list[LabOperationLog]:
        conditions = []
        if scope.sample_ids:
            conditions.append(
                and_(
                    LabOperationLog.entityType == "sample",
                    LabOperationLog.entityId.in_(scope.sample_ids),
                )
            )
        if scope.order_test_ids:
            for entity_type in ("test", "order_test"):
                conditions.append(
                    and_(
                        LabOperationLog.entityType == entity_type,
                        LabOperationLog.entityId.in_(scope.order_test_ids),
                    )
                )
        if scope.quality_issue_ids:
            conditions.append(
                and_(
                    LabOperationLog.entityType == "quality_issue",
                    LabOperationLog.entityId.in_(scope.quality_issue_ids),
                )
            )
        if scope.order_id is not None:
            if scope.entity_kind == "order":
                conditions.append(
                    and_(
                        LabOperationLog.entityType == "order",
                        LabOperationLog.entityId == scope.order_id,
                    )
                )
            else:
                recollection_types = [
                    LabOperationType.RECOLLECTION_REQUEST_CREATED,
                    LabOperationType.RECOLLECTION_REQUEST_APPROVED,
                    LabOperationType.RECOLLECTION_REQUEST_DENIED,
                ]
                conditions.append(
                    and_(
                        LabOperationLog.entityType == "order",
                        LabOperationLog.entityId == scope.order_id,
                        LabOperationLog.operationType.in_(recollection_types),
                    )
                )

        if not conditions:
            return []

        return (
            self.db.query(LabOperationLog)
            .filter(or_(*conditions))
            .order_by(desc(LabOperationLog.performedAt))
            .all()
        )

    def _filter_logs(
        self, logs: list[LabOperationLog], scope: TimelineScope
    ) -> list[LabOperationLog]:
        if scope.entity_kind == "order":
            seen: set[int] = set()
            unique: list[LabOperationLog] = []
            for log in logs:
                if log.id in seen:
                    continue
                seen.add(log.id)
                unique.append(log)
            return unique

        if scope.entity_kind == "order_test":
            test_scope = TestTimelineScope(
                anchor_test_id=scope.anchor_id,
                order_test_ids=scope.order_test_ids,
                sample_ids=scope.sample_ids,
                test_codes=scope.test_codes,
                test_sample_map=scope.test_sample_map,
                quality_issue_order_test_map=scope.quality_issue_order_test_map,
                recollection_request_map=scope.recollection_request_map,
            )
            return [
                log for log in logs if RelevanceEngine.applies_to_test_timeline(log, test_scope)
            ]

        sample_scope = SampleTimelineScope(
            anchor_sample_id=scope.anchor_id,
            sample_ids=scope.sample_ids,
            quality_issue_sample_map=scope.quality_issue_sample_map,
            recollection_request_map=scope.recollection_request_map,
        )
        return [
            log for log in logs if RelevanceEngine.applies_to_sample_timeline(log, sample_scope)
        ]

    def _format_events(self, logs: list[LabOperationLog]) -> list[dict]:
        formatter = TimelineFormatter(self.db)
        user_map = formatter.build_user_map(logs)
        return [formatter.format_entity_event(log, user_map) for log in logs]
