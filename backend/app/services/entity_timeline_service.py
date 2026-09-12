"""
Entity Timeline Service — audit history for a sample or order test, including related chain objects.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal, Optional

from sqlalchemy import and_, desc, or_
from sqlalchemy.orm import Session

from app.models.lab_audit import LabOperationLog
from app.models.order import OrderTest
from app.models.quality_issue import QualityIssue
from app.models.recollection_request import RecollectionRequest
from app.models.sample import Sample
from app.models.user import User
from app.schemas.enums import LabOperationType
from app.services.timeline.event_taxonomy import get_event_phase, get_event_tone
from app.services.timeline.relevance_engine import (
    RelevanceEngine,
    SampleTimelineScope,
    TestTimelineScope,
)
from app.utils.exceptions import LabOperationError


EntityKind = Literal["sample", "order_test"]


@dataclass
class TimelineScope:
    entity_kind: EntityKind
    anchor_id: int
    sample_ids: set[int] = field(default_factory=set)
    order_test_ids: set[int] = field(default_factory=set)
    quality_issue_ids: set[int] = field(default_factory=set)
    order_id: Optional[int] = None
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
        else:
            raise LabOperationError(
                f"Unsupported entity type '{entity_type}'. Use 'sample' or 'order_test'.",
                status_code=400,
            )

        logs = self._fetch_logs(scope)
        filtered = self._filter_logs(logs, scope)
        events = self._format_events(filtered)
        return events, len(events)

    def _scope_for_sample(self, sample_id: int) -> TimelineScope:
        sample = self.db.query(Sample).filter(Sample.sampleId == sample_id).first()
        if not sample:
            raise LabOperationError(f"Sample {sample_id} not found", status_code=404)

        sample_ids = self._collect_sample_chain(sample)
        order_tests = (
            self.db.query(OrderTest).filter(OrderTest.sampleId.in_(sample_ids)).all()
        )
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
        chain_tests = (
            self.db.query(OrderTest).filter(OrderTest.id.in_(order_test_ids)).all()
        )
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
                q.id: q.orderTestId
                for q in quality_issues
                if q.orderTestId is not None
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
            self.db.query(QualityIssue)
            .filter(QualityIssue.orderTestId.in_(order_test_ids))
            .all()
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
            self.db.query(RecollectionRequest)
            .filter(RecollectionRequest.orderId == order_id)
            .all()
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
                self.db.query(Sample.sampleId)
                .filter(Sample.originalSampleId.in_(ids))
                .all()
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
                    self.db.query(OrderTest)
                    .filter(OrderTest.id == current.retestOfTestId)
                    .first()
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
        # Legacy recollection workflow rows logged on order entity.
        if scope.order_id is not None:
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

    def _filter_logs(self, logs: list[LabOperationLog], scope: TimelineScope) -> list[LabOperationLog]:
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
            return [log for log in logs if RelevanceEngine.applies_to_test_timeline(log, test_scope)]

        sample_scope = SampleTimelineScope(
            anchor_sample_id=scope.anchor_id,
            sample_ids=scope.sample_ids,
            quality_issue_sample_map=scope.quality_issue_sample_map,
            recollection_request_map=scope.recollection_request_map,
        )
        return [log for log in logs if RelevanceEngine.applies_to_sample_timeline(log, sample_scope)]

    def _format_events(self, logs: list[LabOperationLog]) -> list[dict]:
        user_ids = {
            int(log.performedBy)
            for log in logs
            if log.performedBy and log.performedBy.isdigit()
        }
        user_map: dict[str, str] = {}
        if user_ids:
            users = self.db.query(User.id, User.name).filter(User.id.in_(user_ids)).all()
            user_map = {str(user.id): user.name for user in users}

        events = []
        for log in logs:
            performed_by_name = None
            if log.performedBy == "system":
                performed_by_name = "System"
            elif log.performedBy in user_map:
                performed_by_name = user_map[log.performedBy]

            op_type = log.operationType.value if log.operationType else None
            metadata = log.operationData or {}
            quality_stage = metadata.get("stage") or (log.afterState or {}).get("stage")

            events.append(
                {
                    "id": log.id,
                    "type": op_type,
                    "phase": get_event_phase(op_type, quality_stage=quality_stage),
                    "tone": get_event_tone(op_type),
                    "entityType": log.entityType,
                    "entityId": log.entityId,
                    "timestamp": log.performedAt.isoformat(),
                    "performedBy": log.performedBy,
                    "performedByName": performed_by_name,
                    "metadata": metadata,
                    "beforeState": log.beforeState,
                    "afterState": log.afterState,
                    "comment": log.comment,
                }
            )
        return events
