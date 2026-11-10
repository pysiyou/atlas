"""Immediate recollection — create pending tube and reattach tests."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from app.domains.lab.models.sample import Sample
from app.domains.orders.models import OrderTest
from app.platform.utils.exceptions import LabOperationError
from app.shared.contracts.enums import QualityStage, TestStatus
from sqlalchemy.orm import Session


@dataclass(frozen=True)
class RecollectionExecuteResult:
    created_sample_id: int
    created_test_id: int | None
    message: str = "Pending sample created for collection."


class RecollectionExecutionService:
    def __init__(self, db: Session, quality_service: Any | None = None):
        self.db = db
        self.quality = quality_service

    def execute_recollection(
        self,
        *,
        rejected_sample: Sample,
        user_id: int,
        reason: str,
        stage: QualityStage,
        order_test_id: int | None = None,
        supervisor_authorized: bool = False,
        validate_work_exists: bool = True,
    ) -> RecollectionExecuteResult:
        if not self.quality:
            raise LabOperationError("Quality service not configured", status_code=500)

        if validate_work_exists:
            pending_tests_to_reattach = [
                test
                for test in self.quality.linked_tests(
                    rejected_sample,
                    exclude=[TestStatus.SUPERSEDED, TestStatus.REMOVED, TestStatus.CANCELLED],
                )
                if test.status == TestStatus.PENDING and test.sampleId == rejected_sample.sampleId
            ]
            original_test_valid = False
            if order_test_id and stage == QualityStage.VALIDATION:
                original_test = self.db.query(OrderTest).filter(OrderTest.id == order_test_id).first()
                original_test_valid = bool(
                    original_test and original_test.status == TestStatus.SUPERSEDED
                )
            if not pending_tests_to_reattach and not original_test_valid:
                raise LabOperationError(
                    "No pending tests remain to recollect on this specimen.",
                    status_code=400,
                )

        new_sample = self.quality.create_recollection_sample(
            rejected_sample,
            user_id,
            reason,
            supervisor_authorized=supervisor_authorized,
        )
        self.quality.reattach_tests_to_recollection(rejected_sample, new_sample)

        created_test_id: int | None = None
        if order_test_id and stage == QualityStage.VALIDATION:
            original_test = self.db.query(OrderTest).filter(OrderTest.id == order_test_id).first()
            if original_test and original_test.status == TestStatus.SUPERSEDED:
                next_retest = (original_test.retestNumber or 0) + 1
                new_test = OrderTest(
                    orderId=original_test.orderId,
                    testCode=original_test.testCode,
                    status=TestStatus.PENDING,
                    priceAtOrder=original_test.priceAtOrder,
                    sampleId=new_sample.sampleId,
                    isRetest=True,
                    retestOfTestId=original_test.id,
                    retestNumber=next_retest,
                    technicianNotes=f"Recollection: {reason}",
                    flags=original_test.flags,
                    isReflexTest=original_test.isReflexTest,
                    triggeredBy=original_test.triggeredBy,
                    reflexRule=original_test.reflexRule,
                )
                self.db.add(new_test)
                self.db.flush()
                created_test_id = new_test.id
                original_test.retestOrderTestId = new_test.id

        self.quality.emitter.sample_created(
            new_sample.sampleId,
            rejected_sample.orderId,
            None,
            test_codes=list(new_sample.testCodes or []),
        )
        self.quality.emitter.sample_recollect_approved(
            new_sample.sampleId,
            rejected_sample.orderId,
            user_id,
            metadata={
                "rejected_sample_id": rejected_sample.sampleId,
                "created_sample_id": new_sample.sampleId,
                "created_test_id": created_test_id,
                "reason": reason,
                "stage": stage.value,
            },
        )

        return RecollectionExecuteResult(
            created_sample_id=new_sample.sampleId,
            created_test_id=created_test_id,
        )
