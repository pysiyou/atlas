"""Unified Lab Operations Service — thin facade delegating to domain operation modules."""
from typing import Any

from app.models.order import Order, OrderTest
from app.models.sample import Sample
from app.schemas.enums import (
    PaymentStatus,
    TestStatus,
)
from app.services.audit import AuditEmitter
from app.services.lab.collection_ops import CollectionOperations
from app.services.lab.escalation import (
    EscalationEngine,
    EscalationOperations,
    EscalationResolveResult,
)
from app.services.lab.quality import QualityIssueService
from app.services.lab.recollection import RecollectionRequestService
from app.services.lab.result_ops import ResultOperations
from app.services.lab.results import FlagCalculatorService, ResultValidatorService
from app.core.cache import invalidate_lab_board_summary_cache
from app.utils.exceptions import LabOperationError
from pydantic import BaseModel
from sqlalchemy.orm import Session

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
        self._collection = CollectionOperations(self)
        self._results = ResultOperations(self)
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
        if order.paymentStatus != PaymentStatus.PAID:
            raise LabOperationError(
                "Sample collection requires payment. Mark the order as paid before collecting.",
                status_code=402,
            )

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
        sample = self._collection.collect_sample(**kwargs)
        self._invalidate_lab_monitor_cache()
        return sample

    def enter_results(self, **kwargs) -> OrderTest:
        order_test = self._results.enter_results(**kwargs)
        self._invalidate_lab_monitor_cache()
        return order_test

    def validate_results(self, **kwargs) -> OrderTest:
        order_test = self._results.validate_results(**kwargs)
        self._invalidate_lab_monitor_cache()
        return order_test

    def reject_results(self, **kwargs):
        result = self._results.reject_results(**kwargs)
        self._invalidate_lab_monitor_cache()
        return result

    def request_amendment(self, **kwargs) -> OrderTest:
        order_test = self._results.request_amendment(**kwargs)
        self._invalidate_lab_monitor_cache()
        return order_test

    def resolve_escalation(self, **kwargs) -> EscalationResolveResult:
        result = self._escalation_ops.resolve_escalation(**kwargs)
        self._invalidate_lab_monitor_cache()
        return result
