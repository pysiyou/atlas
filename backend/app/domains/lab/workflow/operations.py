"""Unified Lab Operations Service — composition root for lab workflow mutations.

Transaction policy: every user-facing lab mutation runs through run_lab_mutation():
domain code mutates the shared Session only (no commit); rollup via apply_order_status_rollup;
one db.commit(); then board cache invalidation once.
"""
from __future__ import annotations

from collections.abc import Callable
from datetime import UTC, datetime
from typing import Any, TypeVar

from app.domains.audit.emitter import AuditEmitter
from app.domains.lab.quality.critical import CriticalNotificationService
from app.domains.lab.quality.issues import QualityIssueService
from app.domains.lab.quality.recollection import RecollectionExecutionService
from app.domains.lab.quality.schemas import AcknowledgeRequest, NotifyRequest
from app.domains.lab.results.flags import FlagCalculatorService
from app.domains.lab.results.validator import ResultValidatorService
from app.domains.lab.rules.eligibility import active_linked_tests_for_collection, assert_can_collect
from app.domains.lab.specimen.lookup import get_sample_or_error, linked_order_tests_for_sample
from app.domains.lab.specimen.models import Sample
from app.domains.lab.specimen.volume import apply_received_volume_quality_issues
from app.domains.lab.workflow.result_commands import ResultCommandHandler
from app.domains.orders.models import Order, OrderTest
from app.domains.orders.service import apply_order_status_rollup
from app.platform.cache import invalidate_lab_board_summary_cache
from app.platform.debug_log import lab_mutation as debug_lab_mutation
from app.shared.errors import LabOperationError
from app.shared.generated.enums import SampleStatus, TestStatus
from pydantic import BaseModel
from sqlalchemy.orm import Session

T = TypeVar("T")

__all__ = ["LabOperationsService", "LabOperationError"]


class CollectionCommandHandler:
    """Sample collection mutation used by LabOperationsService."""

    def __init__(self, svc: LabOperationsService):
        self._svc = svc

    @property
    def db(self):
        return self._svc.db

    def collect_sample(
        self,
        sample_id: str,
        user_id: str,
        collected_volume: float,
        container_type: str,
        container_color: str,
        collection_notes: str | None = None,
    ) -> Sample:
        sample = self._svc._get_sample(sample_id, for_update=True)
        order = self.db.query(Order).filter(Order.orderId == sample.orderId).first()
        if not order:
            raise LabOperationError(f"Order {sample.orderId} not found", status_code=404)
        order_tests_all = self._svc._linked_order_tests(sample)
        assert_can_collect(sample, order, order_tests_all, db=self.db)
        order_tests = active_linked_tests_for_collection(order_tests_all)
        if not order_tests:
            raise LabOperationError(
                "No tests on this sample are eligible for collection.",
                status_code=400,
                error_code="INVALID_TRANSITION",
            )
        test_ids = [ot.id for ot in order_tests]
        locked = (
            self.db.query(OrderTest)
            .filter(OrderTest.id.in_(test_ids))
            .with_for_update()
            .all()
        )
        locked_by_id = {ot.id: ot for ot in locked}
        order_tests = [locked_by_id[i] for i in test_ids if i in locked_by_id]
        before_state = self._svc._serialize_sample_state(sample)

        sample.status = SampleStatus.COLLECTED
        sample.collectedAt = datetime.now(UTC)
        sample.collectedBy = str(user_id)
        sample.collectedVolume = collected_volume
        sample.actualContainerType = container_type
        sample.actualContainerColor = container_color
        sample.collectionNotes = collection_notes
        sample.remainingVolume = collected_volume
        sample.updatedBy = str(user_id)

        for order_test in order_tests:
            if order_test.status == TestStatus.PENDING:
                order_test.status = TestStatus.SAMPLE_COLLECTED
                order_test.sampleId = sample_id
            elif order_test.status in (
                TestStatus.SAMPLE_COLLECTED,
                TestStatus.RESULTED,
                TestStatus.ESCALATED,
            ):
                continue
            else:
                status_val = (
                    order_test.status.value if order_test.status else str(order_test.status)
                )
                raise LabOperationError(
                    f"Test {order_test.testCode} cannot be marked collected (status {status_val})",
                    status_code=400,
                    error_code="INVALID_TRANSITION",
                )

        after_state = self._svc._serialize_sample_state(sample)
        self._svc.emitter.sample_collected(
            sample_id,
            sample.orderId,
            user_id,
            before_state,
            after_state,
            metadata={"test_codes": sample.testCodes},
        )
        return sample

    def receive_sample(
        self,
        sample_id: str,
        user_id: str,
        received_volume_ml: float,
        notes: str | None = None,
    ) -> Sample:
        sample = self._svc._get_sample(sample_id, for_update=True)
        if sample.status != SampleStatus.COLLECTED:
            raise LabOperationError(
                "Received volume can only be recorded for collected samples.",
                status_code=400,
            )
        sample.receivedVolumeMl = float(received_volume_ml)
        if notes:
            existing = sample.qualityNotes or ""
            sample.qualityNotes = f"{existing}\n{notes}".strip() if existing else notes
        apply_received_volume_quality_issues(sample, float(received_volume_ml))
        sample.updatedBy = str(user_id)
        return sample


class LabOperationsService:
    """Composition root for lab workflow mutations."""

    def __init__(self, db: Session):
        self.db = db
        self.emitter = AuditEmitter(db)
        self.recollection = RecollectionExecutionService(db, quality_service=None)
        self.quality = QualityIssueService(
            db,
            self.emitter,
            recollection_execution=self.recollection,
        )
        self.recollection.quality = self.quality
        self.result_validator = ResultValidatorService()
        self.flag_calculator = FlagCalculatorService()
        self._collection = CollectionCommandHandler(self)
        self._results = ResultCommandHandler(self)

    def _get_sample(self, sample_id: str, for_update: bool = False) -> Sample:
        return get_sample_or_error(self.db, sample_id, for_update=for_update)

    def _get_order_test(
        self,
        order_test_id: int,
        status: TestStatus | None = None,
        for_update: bool = False,
    ) -> OrderTest:
        query = self.db.query(OrderTest).filter(OrderTest.id == order_test_id)
        if status:
            query = query.filter(OrderTest.status == status)
        if for_update:
            query = query.with_for_update()
        order_test = query.first()
        if not order_test:
            status_msg = f" with status '{status.value}'" if status else ""
            raise LabOperationError(
                f"Order test {order_test_id} not found{status_msg}",
                status_code=404,
            )
        return order_test

    def _order_id_for_order_test(self, order_test_id: int | str | None) -> str | None:
        """Resolve order_id without raising so missing tests skip cache targeting."""
        if order_test_id is None or order_test_id == "":
            return None
        try:
            parsed = int(order_test_id)
        except (TypeError, ValueError):
            return None
        ot = self.db.query(OrderTest).filter(OrderTest.id == parsed).first()
        return ot.orderId if ot else None

    def _resolve_order_id(self, result: Any, explicit: str | None) -> str | None:
        if explicit:
            return explicit
        if result is None:
            return None
        if isinstance(result, dict):
            oid = result.get("orderId") or result.get("order_id")
            if oid is not None:
                return str(oid)
            sample_id = result.get("sampleId") or result.get("sample_id")
            if sample_id:
                row = self.db.query(Sample).filter(Sample.sampleId == sample_id).first()
                return row.orderId if row else None
            return None
        for attr in ("orderId", "order_id"):
            if hasattr(result, attr):
                val = getattr(result, attr)
                if val is not None:
                    return str(val)
        if hasattr(result, "sampleId"):
            oid = getattr(result, "orderId", None)
            if oid is not None:
                return str(oid)
            sample_id = getattr(result, "sampleId", None)
            if sample_id:
                row = self.db.query(Sample).filter(Sample.sampleId == sample_id).first()
                return row.orderId if row else None
        return None

    def _refresh_mutation_result(self, result: Any) -> None:
        if isinstance(result, Sample | OrderTest):
            self.db.refresh(result)

    def run_lab_mutation(
        self,
        fn: Callable[[], T],
        *,
        order_id: str | None = None,
        after_rollup: Callable[[str], None] | None = None,
        action: str = "lab_mutation",
    ) -> T:
        """Single commit, in-session order rollup, cache invalidate. fn must not commit."""
        debug_lab_mutation(action, "start", order_id=order_id)
        try:
            with self.db.begin_nested():
                result = fn()
                resolved_order_id = self._resolve_order_id(result, order_id)
                if resolved_order_id is not None:
                    apply_order_status_rollup(self.db, resolved_order_id)
                    if after_rollup is not None:
                        after_rollup(resolved_order_id)
            self.db.commit()
            self._refresh_mutation_result(result)
            self._invalidate_lab_monitor_cache()
            debug_lab_mutation(action, "ok", order_id=resolved_order_id or order_id)
            return result
        except LabOperationError as exc:
            self.db.rollback()
            debug_lab_mutation(
                action,
                "rejected",
                order_id=order_id,
                code=exc.error_code,
                message=exc.message,
            )
            raise
        except Exception as exc:
            self.db.rollback()
            debug_lab_mutation(action, "failed", order_id=order_id, error=str(exc))
            raise

    def _serialize_sample_state(self, sample: Sample) -> dict[str, Any]:
        return {
            "sampleId": sample.sampleId,
            "status": sample.status.value if sample.status else None,
            "collectedAt": sample.collectedAt.isoformat() if sample.collectedAt else None,
            "rejectedAt": sample.rejectedAt.isoformat() if sample.rejectedAt else None,
            "recollectionAttempt": sample.recollectionAttempt,
        }

    @staticmethod
    def _results_to_json_serializable(results: dict[str, Any]) -> dict[str, Any]:
        out: dict[str, Any] = {}
        for k, v in results.items():
            if v is None or isinstance(v, str | int | float | bool):
                out[k] = v
            elif isinstance(v, BaseModel):
                out[k] = v.model_dump()
            elif isinstance(v, dict):
                out[k] = LabOperationsService._results_to_json_serializable(v)
            elif isinstance(v, list):
                out[k] = [item.model_dump() if isinstance(item, BaseModel) else item for item in v]
            else:
                out[k] = v
        return out

    def _linked_order_tests(
        self,
        sample: Sample,
        *,
        exclude_statuses: list[TestStatus] | None = None,
    ) -> list[OrderTest]:
        return linked_order_tests_for_sample(self.db, sample, exclude_statuses=exclude_statuses)

    def _invalidate_lab_monitor_cache(self) -> None:
        invalidate_lab_board_summary_cache()

    def collect_sample(self, **kwargs) -> Sample:
        sample_id = kwargs["sample_id"]
        row = self.db.query(Sample).filter(Sample.sampleId == sample_id).first()
        order_id = row.orderId if row else None
        return self.run_lab_mutation(
            lambda: self._collection.collect_sample(**kwargs),
            order_id=order_id,
            action="collect_sample",
        )

    def receive_sample(self, **kwargs) -> Sample:
        sample_id = kwargs["sample_id"]
        row = self.db.query(Sample).filter(Sample.sampleId == sample_id).first()
        order_id = row.orderId if row else None
        return self.run_lab_mutation(
            lambda: self._collection.receive_sample(**kwargs),
            order_id=order_id,
            action="receive_sample",
        )

    def create_aliquots(
        self,
        *,
        parent_id: str,
        count: int,
        aliquot_volume: float,
        test_codes: list[str] | None,
        user_id: str,
    ) -> list[Sample]:
        from app.domains.lab.specimen.aliquots import create_aliquots as create_aliquots_fn

        row = self.db.query(Sample).filter(Sample.sampleId == parent_id).first()
        order_id = row.orderId if row else None

        def _mutate() -> list[Sample]:
            return create_aliquots_fn(
                self.db,
                parent_id=parent_id,
                count=count,
                aliquot_volume=aliquot_volume,
                test_codes=test_codes,
                user_id=user_id,
                emitter=self.emitter,
            )

        return self.run_lab_mutation(_mutate, order_id=order_id, action="create_aliquots")

    def enter_results(self, **kwargs) -> OrderTest:
        return self.run_lab_mutation(
            lambda: self._results.enter_results(**kwargs),
            order_id=self._order_id_for_order_test(kwargs.get("order_test_id")),
            action="enter_results",
        )

    def validate_results(self, **kwargs) -> OrderTest:
        from app.domains.orders.service import OrderService
        from app.shared.generated.enums import OrderStatus

        user_id = kwargs["user_id"]

        def _after_rollup(resolved_order_id: str) -> None:
            order = self.db.query(Order).filter(Order.orderId == resolved_order_id).first()
            if order and order.overallStatus == OrderStatus.COMPLETED:
                OrderService(self.db).record_reporting_generated(resolved_order_id, user_id)

        def _mutate() -> OrderTest:
            return self._results.validate_results(**kwargs)

        return self.run_lab_mutation(
            _mutate,
            order_id=self._order_id_for_order_test(kwargs.get("order_test_id")),
            after_rollup=_after_rollup,
            action="validate_results",
        )

    def resolve_escalation(self, **kwargs):
        return self.run_lab_mutation(
            lambda: self._results.resolve_escalation(**kwargs),
            order_id=self._order_id_for_order_test(kwargs.get("order_test_id")),
            action="resolve_escalation",
        )

    def reject_results(self, **kwargs):
        return self.run_lab_mutation(
            lambda: self._results.reject_results(**kwargs),
            order_id=self._order_id_for_order_test(kwargs.get("order_test_id")),
            action="reject_results",
        )

    def report_quality_issue(self, **kwargs):
        from app.shared.generated.enums import QualityIssueTargetType

        target_id = kwargs.get("target_id")
        target_type = kwargs.get("target_type")
        if target_type == QualityIssueTargetType.SAMPLE:
            sample = self.db.query(Sample).filter(Sample.sampleId == target_id).first()
            order_id = sample.orderId if sample else None
        else:
            order_id = self._order_id_for_order_test(target_id)
        return self.run_lab_mutation(
            lambda: self.quality.report_issue(**kwargs),
            order_id=order_id,
            action="report_quality_issue",
        )

    def notify_critical_value(self, test_id: int, request: NotifyRequest, user_id: str) -> dict:
        return self.run_lab_mutation(
            lambda: CriticalNotificationService(self.db).notify(test_id, request, user_id),
            order_id=self._order_id_for_order_test(test_id),
            action="notify_critical_value",
        )

    def acknowledge_critical_value(
        self, test_id: int, request: AcknowledgeRequest, user_id: str
    ) -> dict:
        return self.run_lab_mutation(
            lambda: CriticalNotificationService(self.db).acknowledge(test_id, request, user_id),
            order_id=self._order_id_for_order_test(test_id),
            action="acknowledge_critical_value",
        )
