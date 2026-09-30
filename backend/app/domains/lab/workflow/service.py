"""Unified Lab Operations Service — composition root for lab workflow mutations.

Transaction policy: every user-facing lab mutation runs through run_lab_mutation():
domain code mutates the shared Session only (no commit); rollup via apply_order_status_rollup;
one db.commit(); then board cache invalidation once.
"""
from collections.abc import Callable
from typing import Any, TypeVar

from app.domains.audit.service import AuditEmitter
from app.domains.lab.models.sample import Sample
from app.domains.lab.quality.critical_notifications import CriticalNotificationService
from app.domains.lab.quality.escalation import (
    EscalationEngine,
    EscalationOperations,
    EscalationResolveResult,
)
from app.domains.lab.quality.issues_service import QualityIssueService
from app.domains.lab.quality.recollection_requests import RecollectionRequestService
from app.domains.lab.results import FlagCalculatorService, ResultValidatorService
from app.domains.lab.rules.eligibility import assert_can_collect
from app.domains.lab.schemas.critical_values import AcknowledgeRequest, NotifyRequest
from app.domains.lab.workflow.collection_commands import CollectionCommandHandler
from app.domains.lab.workflow.result_commands import ResultCommandHandler
from app.domains.orders.models import Order, OrderTest
from app.domains.orders.service import apply_order_status_rollup
from app.platform.cache import invalidate_lab_board_summary_cache
from app.platform.utils.exceptions import LabOperationError
from app.shared.contracts.enums import PaymentStatus, SampleStatus, TestStatus
from pydantic import BaseModel
from sqlalchemy.orm import Session

T = TypeVar("T")

__all__ = ["LabOperationsService", "LabOperationError", "EscalationResolveResult"]


class LabOperationsService:
    """Composition root for lab workflow mutations."""

    def __init__(self, db: Session):
        self.db = db
        self.emitter = AuditEmitter(db)
        self.escalation = EscalationEngine(db, self.emitter)
        self.recollection = RecollectionRequestService(db, quality_service=None)
        self.quality = QualityIssueService(
            db,
            self.escalation,
            self.emitter,
            recollection_requests=self.recollection,
        )
        self.recollection.quality = self.quality
        self.result_validator = ResultValidatorService()
        self.flag_calculator = FlagCalculatorService()
        self._collection = CollectionCommandHandler(self)
        self._results = ResultCommandHandler(self)
        self._escalation_ops = EscalationOperations(self)

    def _get_sample(self, sample_id: int, for_update: bool = False) -> Sample:
        query = self.db.query(Sample).filter(Sample.sampleId == sample_id)
        if for_update:
            query = query.with_for_update()
        sample = query.first()
        if not sample:
            raise LabOperationError(f"Sample {sample_id} not found", status_code=404)
        return sample

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

    def _assert_order_paid_for_collection(self, order_id: int) -> None:
        order = self.db.query(Order).filter(Order.orderId == order_id).first()
        if not order:
            raise LabOperationError(f"Order {order_id} not found", status_code=404)
        sample = (
            self.db.query(Sample)
            .filter(Sample.orderId == order_id, Sample.status == SampleStatus.PENDING)
            .first()
        )
        if sample:
            order_tests = self._linked_order_tests(sample)
            assert_can_collect(sample, order, order_tests)
        elif order.paymentStatus != PaymentStatus.PAID:
            raise LabOperationError(
                "Sample collection requires payment. Mark the order as paid before collecting.",
                status_code=402,
                error_code="PAYMENT_REQUIRED",
            )

    @staticmethod
    def _resolve_order_id(result: Any, explicit: int | None) -> int | None:
        if explicit is not None:
            return explicit
        if result is None:
            return None
        if isinstance(result, dict):
            oid = result.get("orderId") or result.get("order_id")
            return int(oid) if oid is not None else None
        for attr in ("orderId", "order_id"):
            if hasattr(result, attr):
                val = getattr(result, attr)
                if val is not None:
                    return int(val)
        if hasattr(result, "sampleId"):
            return None
        return None

    def _refresh_mutation_result(self, result: Any) -> None:
        if isinstance(result, Sample | OrderTest):
            self.db.refresh(result)

    def run_lab_mutation(
        self,
        fn: Callable[[], T],
        *,
        order_id: int | None = None,
    ) -> T:
        """Single commit, in-session order rollup, cache invalidate. fn must not commit."""
        try:
            with self.db.begin_nested():
                result = fn()
                resolved_order_id = self._resolve_order_id(result, order_id)
                if resolved_order_id is not None:
                    apply_order_status_rollup(self.db, resolved_order_id)
            self.db.commit()
            self._refresh_mutation_result(result)
            self._invalidate_lab_monitor_cache()
            return result
        except LabOperationError:
            raise
        except Exception:
            self.db.rollback()
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
        query = self.db.query(OrderTest).filter(
            OrderTest.orderId == sample.orderId,
            OrderTest.testCode.in_(sample.testCodes),
            OrderTest.sampleId == sample.sampleId,
        )
        if exclude_statuses:
            query = query.filter(OrderTest.status.notin_(exclude_statuses))
        return query.all()

    def _invalidate_lab_monitor_cache(self) -> None:
        invalidate_lab_board_summary_cache()

    def collect_sample(self, **kwargs) -> Sample:
        sample_id = kwargs["sample_id"]
        row = self.db.query(Sample).filter(Sample.sampleId == sample_id).first()
        order_id = row.orderId if row else None
        return self.run_lab_mutation(
            lambda: self._collection.collect_sample(**kwargs),
            order_id=order_id,
        )

    def enter_results(self, **kwargs) -> OrderTest:
        order_test_id = kwargs.get("order_test_id")
        order_id = None
        if order_test_id:
            ot = self.db.query(OrderTest).filter(OrderTest.id == order_test_id).first()
            order_id = ot.orderId if ot else None
        return self.run_lab_mutation(
            lambda: self._results.enter_results(**kwargs),
            order_id=order_id,
        )

    def validate_results(self, **kwargs) -> OrderTest:
        from app.domains.orders.service import OrderService
        from app.shared.contracts.enums import OrderStatus

        order_test_id = kwargs.get("order_test_id")

        def _mutate() -> OrderTest:
            return self._results.validate_results(**kwargs)

        order_id = None
        if order_test_id:
            ot = self.db.query(OrderTest).filter(OrderTest.id == order_test_id).first()
            order_id = ot.orderId if ot else None
        order_test = self.run_lab_mutation(_mutate, order_id=order_id)
        order = self.db.query(Order).filter(Order.orderId == order_test.orderId).first()
        if order and order.overallStatus == OrderStatus.COMPLETED:
            import logging

            logger = logging.getLogger(__name__)
            try:
                OrderService(self.db).mark_as_reported(order_test.orderId)
            except Exception as exc:
                logger.error(
                    "mark_as_reported failed after validation for order %s: %s",
                    order_test.orderId,
                    exc,
                    exc_info=True,
                )
        return order_test

    def reject_results(self, **kwargs):
        order_test_id = kwargs.get("order_test_id")
        order_id = None
        if order_test_id:
            ot = self.db.query(OrderTest).filter(OrderTest.id == order_test_id).first()
            order_id = ot.orderId if ot else None
        return self.run_lab_mutation(
            lambda: self._results.reject_results(**kwargs),
            order_id=order_id,
        )

    def request_amendment(self, **kwargs) -> OrderTest:
        order_test_id = kwargs.get("order_test_id")
        order_id = None
        if order_test_id:
            ot = self.db.query(OrderTest).filter(OrderTest.id == order_test_id).first()
            order_id = ot.orderId if ot else None
        return self.run_lab_mutation(
            lambda: self._results.request_amendment(**kwargs),
            order_id=order_id,
        )

    def resolve_escalation(self, **kwargs) -> EscalationResolveResult:
        order_test_id = kwargs.get("order_test_id")
        order_id = None
        if order_test_id:
            ot = self.db.query(OrderTest).filter(OrderTest.id == order_test_id).first()
            order_id = ot.orderId if ot else None
        return self.run_lab_mutation(
            lambda: self._escalation_ops.resolve_escalation(**kwargs),
            order_id=order_id,
        )

    def report_quality_issue(self, **kwargs):
        from app.shared.contracts.enums import QualityIssueTargetType

        target_id = kwargs.get("target_id")
        target_type = kwargs.get("target_type")
        order_id = None
        if target_type == QualityIssueTargetType.SAMPLE:
            sample = self.db.query(Sample).filter(Sample.sampleId == target_id).first()
            order_id = sample.orderId if sample else None
        elif target_id:
            ot = self.db.query(OrderTest).filter(OrderTest.id == target_id).first()
            order_id = ot.orderId if ot else None
        return self.run_lab_mutation(
            lambda: self.quality.report_issue(**kwargs),
            order_id=order_id,
        )

    def approve_recollection_request(self, request_id: int, user_id: int, review_notes: str | None):
        from app.domains.lab.models.recollection_request import RecollectionRequest

        req = (
            self.db.query(RecollectionRequest).filter(RecollectionRequest.id == request_id).first()
        )
        order_id = req.orderId if req else None
        return self.run_lab_mutation(
            lambda: self.recollection.approve(request_id, user_id, review_notes),
            order_id=order_id,
        )

    def deny_recollection_request(self, request_id: int, user_id: int, review_notes: str | None):
        from app.domains.lab.models.recollection_request import RecollectionRequest

        req = (
            self.db.query(RecollectionRequest).filter(RecollectionRequest.id == request_id).first()
        )
        order_id = req.orderId if req else None
        return self.run_lab_mutation(
            lambda: self.recollection.deny(request_id, user_id, review_notes),
            order_id=order_id,
        )

    def notify_critical_value(self, test_id: int, request: NotifyRequest, user_id: int) -> dict:
        ot = self.db.query(OrderTest).filter(OrderTest.id == test_id).first()
        order_id = ot.orderId if ot else None
        return self.run_lab_mutation(
            lambda: CriticalNotificationService(self.db).notify(test_id, request, user_id),
            order_id=order_id,
        )

    def acknowledge_critical_value(
        self, test_id: int, request: AcknowledgeRequest, user_id: int
    ) -> dict:
        ot = self.db.query(OrderTest).filter(OrderTest.id == test_id).first()
        order_id = ot.orderId if ot else None
        return self.run_lab_mutation(
            lambda: CriticalNotificationService(self.db).acknowledge(test_id, request, user_id),
            order_id=order_id,
        )
