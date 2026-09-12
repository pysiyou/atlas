"""Analyzer result ingestion — HL7 and JSON."""
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.middleware.hl7_parser import AnalyzerResultAdapter, HL7ParseError, HL7Parser
from app.models.order import OrderTest
from app.models.sample import Sample
from app.models.test import Test
from app.schemas.analyzer import AnalyzerResultRequest, AnalyzerResultResponse, HL7MessageRequest
from app.schemas.enums import TestStatus
from app.services.lab.workflow import LabOperationsService
from app.utils.exceptions import LabOperationError

ANALYZER_USER_ID = 0


class AnalyzerIngestService:
    def __init__(self, db: Session):
        self.db = db

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
                detail=f"Test {test_code} already has results",
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
    ) -> AnalyzerResultResponse:
        service = LabOperationsService(self.db)
        try:
            updated_test = service.enter_results(
                order_test_id=order_test.id,
                user_id=ANALYZER_USER_ID,
                results=results,
                technician_notes=technician_notes,
            )
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
        test_def = self.db.query(Test).filter(Test.code == test_code).first()
        result_items = test_def.resultItems if test_def else []
        adapter = AnalyzerResultAdapter()
        validation_errors = adapter.validate_against_catalog(analyzer_result, result_items)
        if validation_errors:
            warnings.extend(validation_errors)
        internal_results = adapter.to_internal_format(analyzer_result, result_items)
        notes = (
            f"Auto-entered from analyzer "
            f"{request.analyzer_id or analyzer_result.analyzer_id or 'unknown'}"
        )
        return self._enter_results(order_test, internal_results, notes, sample, test_code, warnings)

    def ingest_json(self, request: AnalyzerResultRequest) -> AnalyzerResultResponse:
        sample = self.db.query(Sample).filter(Sample.sampleId == int(request.specimen_id)).first()
        if not sample:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Sample {request.specimen_id} not found",
            )
        order_test = self._find_pending_test(sample, request.test_code)
        notes = f"Auto-entered from analyzer {request.analyzer_id or 'unknown'}"
        return self._enter_results(
            order_test, request.results, notes, sample, request.test_code, []
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
                results.append({
                    "specimen_id": sample.sampleId,
                    "order_id": test.orderId,
                    "test_code": test.testCode,
                    "sample_type": sample.sampleType.value if sample.sampleType else None,
                    "collected_at": sample.collectedAt.isoformat() if sample.collectedAt else None,
                })
        return {"pending_samples": results, "count": len(results)}
