"""Analyzer result ingestion — HL7 and JSON."""
from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from app.domains.catalog.models.catalog_test import CatalogTest
from app.domains.lab.integration.hl7_parser import (
    AnalyzerResultAdapter,
    HL7AnalyzerResult,
    HL7ParseError,
    HL7Parser,
    HL7ResultItem,
)
from app.domains.lab.models.analyzer_ingest_dedup import AnalyzerIngestDedup
from app.domains.lab.models.sample import Sample
from app.domains.lab.schemas.analyzer import (
    AnalyzerResultRequest,
    AnalyzerResultResponse,
    HL7MessageRequest,
)
from app.domains.lab.workflow.service import LabOperationsService
from app.domains.orders.models import OrderTest
from app.platform.config import settings
from app.platform.utils.exceptions import LabOperationError
from app.shared.contracts.enums import TestStatus
from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

ANALYZER_USER_ID = 0


class AnalyzerIngestService:
    def __init__(self, db: Session):
        self.db = db

    def _claim_idempotency_key(self, key: str, order_test_id: int) -> None:
        normalized = key.strip()
        if not normalized:
            return
        existing = (
            self.db.query(AnalyzerIngestDedup)
            .filter(AnalyzerIngestDedup.idempotency_key == normalized)
            .first()
        )
        if existing:
            raise LabOperationError(
                f"Duplicate analyzer ingest for key {normalized}",
                status_code=409,
                error_code="DUPLICATE_INGEST",
            )
        row = AnalyzerIngestDedup(
            idempotency_key=normalized,
            order_test_id=order_test_id,
            created_at=datetime.now(UTC),
        )
        self.db.add(row)
        try:
            self.db.flush()
        except IntegrityError as exc:
            raise LabOperationError(
                f"Duplicate analyzer ingest for key {normalized}",
                status_code=409,
                error_code="DUPLICATE_INGEST",
            ) from exc

    @staticmethod
    def _validation_blocks_ingest(validation_errors: list[str]) -> None:
        if validation_errors and settings.ANALYZER_STRICT_VALIDATION:
            raise LabOperationError(
                "; ".join(validation_errors),
                status_code=400,
                error_code="VALIDATION_ERROR",
            )

    def _find_pending_test(self, sample: Sample, test_code: str) -> OrderTest:
        order_test = (
            self.db.query(OrderTest)
            .filter(
                OrderTest.orderId == sample.orderId,
                OrderTest.testCode == test_code,
                OrderTest.status == TestStatus.SAMPLE_COLLECTED,
            )
            .first()
        )
        if order_test:
            return order_test
        existing = (
            self.db.query(OrderTest)
            .filter(OrderTest.orderId == sample.orderId, OrderTest.testCode == test_code)
            .first()
        )
        if existing and existing.status in [TestStatus.RESULTED, TestStatus.VALIDATED]:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"CatalogTest {test_code} already has results",
            )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No pending test {test_code} found for sample {sample.sampleId}",
        )

    def _enter_results(
        self,
        order_test: OrderTest,
        results: dict,
        technician_notes: str,
        sample: Sample,
        test_code: str,
        warnings: list[str],
        *,
        idempotency_key: str | None = None,
    ) -> AnalyzerResultResponse:
        service = LabOperationsService(self.db)

        def _mutate():
            if idempotency_key:
                self._claim_idempotency_key(idempotency_key, order_test.id)
            return service._results.enter_results(
                order_test_id=order_test.id,
                user_id=ANALYZER_USER_ID,
                results=results,
                technician_notes=technician_notes,
            )

        try:
            updated_test = service.run_lab_mutation(_mutate, order_id=sample.orderId)
        except LabOperationError as e:
            raise HTTPException(status_code=e.status_code, detail=e.message)
        return AnalyzerResultResponse(
            success=True,
            message=f"Results entered for test {test_code}",
            order_id=sample.orderId,
            test_id=updated_test.id,
            status=updated_test.status.value,
            warnings=warnings,
        )

    def ingest_hl7(self, request: HL7MessageRequest) -> AnalyzerResultResponse:
        warnings: list[str] = []
        parser = HL7Parser()
        try:
            analyzer_result = parser.parse(request.message)
        except HL7ParseError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to parse HL7 message: {str(e)}",
            )
        specimen_id = analyzer_result.specimen_id
        if not specimen_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No specimen ID found in HL7 message",
            )
        sample = self.db.query(Sample).filter(Sample.sampleId == int(specimen_id)).first()
        if not sample:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Sample {specimen_id} not found",
            )
        test_code = analyzer_result.test_code
        if not test_code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No test code found in HL7 message",
            )
        order_test = self._find_pending_test(sample, test_code)
        test_def = self.db.query(CatalogTest).filter(CatalogTest.code == test_code).first()
        result_items = test_def.resultItems if test_def else []
        adapter = AnalyzerResultAdapter()
        validation_errors = adapter.validate_against_catalog(analyzer_result, result_items)
        self._validation_blocks_ingest(validation_errors)
        if validation_errors:
            warnings.extend(validation_errors)
        internal_results = adapter.to_internal_format(analyzer_result, result_items)
        notes = (
            f"Auto-entered from analyzer "
            f"{request.analyzer_id or analyzer_result.analyzer_id or 'unknown'}"
        )
        return self._enter_results(
            order_test,
            internal_results,
            notes,
            sample,
            test_code,
            warnings,
            idempotency_key=analyzer_result.message_id or None,
        )

    def ingest_json(self, request: AnalyzerResultRequest) -> AnalyzerResultResponse:
        sample = self.db.query(Sample).filter(Sample.sampleId == int(request.specimen_id)).first()
        if not sample:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Sample {request.specimen_id} not found",
            )
        order_test = self._find_pending_test(sample, request.test_code)
        idempotency_key = (request.correlation_id or "").strip()
        if not idempotency_key:
            idempotency_key = (
                f"json:{request.specimen_id}:{request.test_code}:"
                f"{request.analyzer_id or 'unknown'}"
            )
        test_def = self.db.query(CatalogTest).filter(CatalogTest.code == request.test_code).first()
        result_items = test_def.resultItems if test_def else []
        if result_items:
            adapter = AnalyzerResultAdapter()
            pseudo = HL7AnalyzerResult(
                message_id=idempotency_key,
                test_code=request.test_code,
                results=[
                    HL7ResultItem(item_code=k, item_name=k, value=str(v))
                    for k, v in request.results.items()
                ],
            )
            validation_errors = adapter.validate_against_catalog(pseudo, result_items)
            self._validation_blocks_ingest(validation_errors)
        notes = f"Auto-entered from analyzer {request.analyzer_id or 'unknown'}"
        return self._enter_results(
            order_test,
            request.results,
            notes,
            sample,
            request.test_code,
            [],
            idempotency_key=idempotency_key,
        )

    def list_pending(self, analyzer_id: str) -> dict[str, Any]:
        pending_tests = (
            self.db.query(OrderTest)
            .filter(OrderTest.status == TestStatus.SAMPLE_COLLECTED)
            .limit(10000)
            .all()
        )
        results = []
        for test in pending_tests:
            sample = self.db.query(Sample).filter(Sample.sampleId == test.sampleId).first()
            if sample:
                results.append(
                    {
                        "specimen_id": sample.sampleId,
                        "order_id": test.orderId,
                        "test_code": test.testCode,
                        "sample_type": sample.sampleType.value if sample.sampleType else None,
                        "collected_at": sample.collectedAt.isoformat()
                        if sample.collectedAt
                        else None,
                    }
                )
        return {"pending_samples": results, "count": len(results)}
