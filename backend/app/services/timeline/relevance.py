"""
Relevance engine — decides which audit logs belong on sample vs test entity timelines.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Optional

from app.models.lab_audit import LabOperationLog
from app.schemas.enums import LabOperationType
from app.services.timeline.taxonomy import RECOLLECTION_REQUEST_TYPES, is_entity_visible


@dataclass
class TestTimelineScope:
    """Context for filtering events on an order_test timeline."""

    anchor_test_id: int
    order_test_ids: set[int] = field(default_factory=set)
    sample_ids: set[int] = field(default_factory=set)
    test_codes: set[str] = field(default_factory=set)
    test_sample_map: dict[int, int] = field(default_factory=dict)  # order_test_id -> sample_id
    quality_issue_order_test_map: dict[int, int] = field(default_factory=dict)  # issue_id -> order_test_id
    recollection_request_map: dict[int, dict[str, Any]] = field(default_factory=dict)  # request_id -> row


@dataclass
class SampleTimelineScope:
    """Context for filtering events on a sample (tube) timeline."""

    anchor_sample_id: int
    sample_ids: set[int] = field(default_factory=set)
    quality_issue_sample_map: dict[int, int] = field(default_factory=dict)  # issue_id -> sample_id
    recollection_request_map: dict[int, dict[str, Any]] = field(default_factory=dict)


def _operation_value(log: LabOperationLog) -> Optional[str]:
    if log.operationType is None:
        return None
    return log.operationType.value if hasattr(log.operationType, "value") else str(log.operationType)


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
