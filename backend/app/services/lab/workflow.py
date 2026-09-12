"""
Unified Lab Operations Service — thin facade delegating to domain operation modules.
"""
from typing import Any, Dict, Optional

from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.models.order import OrderTest
from app.models.sample import Sample
from app.schemas.enums import (
    PaymentStatus,
    TestStatus,
)
from app.services.audit.logger import AuditService
from app.services.lab.collection_ops import CollectionOperations
from app.services.lab.escalation import EscalationEngine
from app.services.lab.escalation_ops import EscalationOperations
from app.services.lab.quality import QualityIssueService
from app.services.lab.recollection import RecollectionRequestService
from app.services.lab.result_ops import ResultOperations
from app.services.lab.results import FlagCalculatorService, ResultValidatorService
from app.services.lab.types import EscalationResolveResult
from app.utils.exceptions import LabOperationError

__all__ = ["LabOperationsService", "LabOperationError", "EscalationResolveResult"]


class LabOperationsService:
    """Composition root for lab workflow mutations."""

    def __init__(self, db: Session):
        self.db = db
        self.audit = AuditService(db)
        self.escalation = EscalationEngine(db, self.audit)
        self.quality = QualityIssueService(db, self.audit, self.escalation)
        self.recollection = RecollectionRequestService(db, self.audit, self.quality)
        self.quality.recollection_requests = self.recollection
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
        status: Optional[TestStatus] = None,
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
        from app.models.order import Order

        order = self.db.query(Order).filter(Order.orderId == order_id).first()
        if not order:
            raise LabOperationError(f"Order {order_id} not found", status_code=404)
        if order.paymentStatus != PaymentStatus.PAID:
            raise LabOperationError(
                "Sample collection requires payment. Mark the order as paid before collecting.",
                status_code=402,
            )

    def _serialize_sample_state(self, sample: Sample) -> Dict[str, Any]:
        return {
            "sampleId": sample.sampleId,
            "status": sample.status.value if sample.status else None,
            "collectedAt": sample.collectedAt.isoformat() if sample.collectedAt else None,
            "rejectedAt": sample.rejectedAt.isoformat() if sample.rejectedAt else None,
            "recollectionAttempt": sample.recollectionAttempt,
        }

    @staticmethod
    def _results_to_json_serializable(results: Dict[str, Any]) -> Dict[str, Any]:
        out: Dict[str, Any] = {}
        for k, v in results.items():
            if v is None or isinstance(v, (str, int, float, bool)):
                out[k] = v
            elif isinstance(v, BaseModel):
                out[k] = v.model_dump()
            elif isinstance(v, dict):
                out[k] = LabOperationsService._results_to_json_serializable(v)
            elif isinstance(v, list):
                out[k] = [
                    item.model_dump() if isinstance(item, BaseModel) else item
                    for item in v
                ]
            else:
                out[k] = v
        return out

    def _linked_order_tests(
        self,
        sample: Sample,
        *,
        exclude_statuses: Optional[list[TestStatus]] = None,
    ) -> list[OrderTest]:
        query = self.db.query(OrderTest).filter(
            OrderTest.orderId == sample.orderId,
            OrderTest.testCode.in_(sample.testCodes),
            OrderTest.sampleId == sample.sampleId,
        )
        if exclude_statuses:
            query = query.filter(OrderTest.status.notin_(exclude_statuses))
        return query.all()

    def collect_sample(self, **kwargs) -> Sample:
        return self._collection.collect_sample(**kwargs)

    def enter_results(self, **kwargs) -> OrderTest:
        return self._results.enter_results(**kwargs)

    def validate_results(self, **kwargs) -> OrderTest:
        return self._results.validate_results(**kwargs)

    def request_amendment(self, **kwargs) -> OrderTest:
        return self._results.request_amendment(**kwargs)

    def resolve_escalation(self, **kwargs) -> EscalationResolveResult:
        return self._escalation_ops.resolve_escalation(**kwargs)
