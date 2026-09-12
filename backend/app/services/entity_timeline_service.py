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
from app.utils.exceptions import LabOperationError

RECOLLECTION_ORDER_OPS = frozenset(
    {
        LabOperationType.RECOLLECTION_REQUEST_CREATED,
        LabOperationType.RECOLLECTION_REQUEST_APPROVED,
        LabOperationType.RECOLLECTION_REQUEST_DENIED,
    }
)

EXCLUDED_ENTITY_OPS = frozenset(
    {
        LabOperationType.ORDER_STATUS_CHANGE,
        LabOperationType.TEST_ADDED,
    }
)


@dataclass
class TimelineScope:
    anchor_type: Literal["sample", "order_test"]
    anchor_id: int
    sample_ids: set[int] = field(default_factory=set)
    order_test_ids: set[int] = field(default_factory=set)
    quality_issue_ids: set[int] = field(default_factory=set)
    test_codes: set[str] = field(default_factory=set)
    recollection_request_ids: set[int] = field(default_factory=set)
    order_id: Optional[int] = None


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
        relevant_logs = [log for log in logs if self._is_event_relevant(log, scope)]
        events = self._format_events(relevant_logs)
        return events, len(events)

    def _scope_for_sample(self, sample_id: int) -> TimelineScope:
        sample = self.db.query(Sample).filter(Sample.sampleId == sample_id).first()
        if not sample:
            raise LabOperationError(f"Sample {sample_id} not found", status_code=404)

        sample_ids = self._collect_sample_chain(sample)
        linked_tests = self.db.query(OrderTest).filter(OrderTest.sampleId.in_(sample_ids)).all()
        order_test_ids = {t.id for t in linked_tests if t.id is not None}
        test_codes = {t.testCode for t in linked_tests if t.testCode}
        quality_issue_ids = self._quality_issue_ids(sample_ids, order_test_ids)
        recollection_request_ids = self._recollection_request_ids(
            sample_ids, order_test_ids, sample.orderId
        )

        return TimelineScope(
            anchor_type="sample",
            anchor_id=sample_id,
            sample_ids=sample_ids,
            order_test_ids=order_test_ids,
            quality_issue_ids=quality_issue_ids,
            test_codes=test_codes,
            recollection_request_ids=recollection_request_ids,
            order_id=sample.orderId,
        )

    def _scope_for_order_test(self, order_test_id: int) -> TimelineScope:
        order_test = self.db.query(OrderTest).filter(OrderTest.id == order_test_id).first()
        if not order_test:
            raise LabOperationError(f"Order test {order_test_id} not found", status_code=404)

        order_test_ids = self._collect_retest_chain(order_test)
        chain_tests = self.db.query(OrderTest).filter(OrderTest.id.in_(order_test_ids)).all()
        test_codes = {t.testCode for t in chain_tests if t.testCode}
        sample_ids: set[int] = set()

        for test in chain_tests:
            if not test.sampleId:
                continue
            linked_sample = (
                self.db.query(Sample).filter(Sample.sampleId == test.sampleId).first()
            )
            if linked_sample:
                sample_ids.update(self._collect_sample_chain(linked_sample))

        quality_issue_ids = self._quality_issue_ids(sample_ids, order_test_ids)
        recollection_request_ids = self._recollection_request_ids(
            sample_ids, order_test_ids, order_test.orderId
        )

        return TimelineScope(
            anchor_type="order_test",
            anchor_id=order_test_id,
            sample_ids=sample_ids,
            order_test_ids=order_test_ids,
            quality_issue_ids=quality_issue_ids,
            test_codes=test_codes,
            recollection_request_ids=recollection_request_ids,
            order_id=order_test.orderId,
        )

    def _recollection_request_ids(
        self,
        sample_ids: set[int],
        order_test_ids: set[int],
        order_id: Optional[int],
    ) -> set[int]:
        if order_id is None:
            return set()

        requests = (
            self.db.query(RecollectionRequest)
            .filter(RecollectionRequest.orderId == order_id)
            .all()
        )
        ids: set[int] = set()
        for request in requests:
            if request.rejectedSampleId and request.rejectedSampleId in sample_ids:
                ids.add(request.id)
                continue
            if request.orderTestId and request.orderTestId in order_test_ids:
                ids.add(request.id)
                continue
            affected = set(request.affectedOrderTestIds or [])
            if affected.intersection(order_test_ids):
                ids.add(request.id)
        return ids

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

    def _quality_issue_ids(
        self, sample_ids: set[int], order_test_ids: set[int]
    ) -> set[int]:
        if not sample_ids and not order_test_ids:
            return set()
        query = self.db.query(QualityIssue.id)
        filters = []
        if sample_ids:
            filters.append(QualityIssue.sampleId.in_(sample_ids))
        if order_test_ids:
            filters.append(QualityIssue.orderTestId.in_(order_test_ids))
        return {row[0] for row in query.filter(or_(*filters)).all()}

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
        if scope.recollection_request_ids and scope.order_id is not None:
            conditions.append(
                and_(
                    LabOperationLog.entityType == "order",
                    LabOperationLog.entityId == scope.order_id,
                    LabOperationLog.operationType.in_(RECOLLECTION_ORDER_OPS),
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

    def _is_event_relevant(self, log: LabOperationLog, scope: TimelineScope) -> bool:
        op_type = log.operationType
        if op_type in EXCLUDED_ENTITY_OPS:
            return False

        metadata = log.operationData or {}

        if op_type in RECOLLECTION_ORDER_OPS:
            request_id = metadata.get("requestId")
            if request_id is None:
                return False
            try:
                return int(request_id) in scope.recollection_request_ids
            except (TypeError, ValueError):
                return False

        if log.entityType == "order":
            return False

        if op_type == LabOperationType.SAMPLE_COLLECT:
            if log.entityId not in scope.sample_ids:
                return False
            event_codes = metadata.get("testCodes")
            if not isinstance(event_codes, list) or not event_codes:
                return True
            return bool(scope.test_codes.intersection(str(code) for code in event_codes))

        if op_type in (
            LabOperationType.SAMPLE_REJECT,
            LabOperationType.SAMPLE_RECOLLECTION_REQUEST,
        ):
            return log.entityId in scope.sample_ids

        if log.entityType in ("test", "order_test"):
            if op_type == LabOperationType.TEST_REMOVED:
                return log.entityId in scope.order_test_ids
            return log.entityId in scope.order_test_ids

        if log.entityType == "quality_issue":
            return log.entityId in scope.quality_issue_ids

        if log.entityType == "sample":
            return log.entityId in scope.sample_ids

        return False

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
            events.append(
                {
                    "id": log.id,
                    "type": op_type,
                    "entityType": log.entityType,
                    "entityId": log.entityId,
                    "timestamp": log.performedAt.isoformat(),
                    "performedBy": log.performedBy,
                    "performedByName": performed_by_name,
                    "metadata": log.operationData or {},
                    "beforeState": log.beforeState,
                    "afterState": log.afterState,
                    "comment": log.comment,
                }
            )
        return events
