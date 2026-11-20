"""Analyzer result ingestion — HL7 and JSON."""
from datetime import UTC, datetime
from typing import Any

from app.domains.audit.emitter import AuditEmitter
from app.domains.lab.integration.hl7 import (
    AnalyzerResultAdapter,
    HL7AnalyzerResult,
    Hl7ObservationRow,
    HL7ParseError,
    HL7Parser,
)
from app.domains.lab.integration.models import AnalyzerIngestDedup
from app.domains.lab.integration.schemas import (
    AnalyzerResultRequest,
    AnalyzerResultResponse,
    HL7MessageRequest,
)
from app.domains.lab.specimen.lookup import (
    find_enterable_order_test,
    find_enterable_order_test_on_order,
    latest_order_test_on_sample_chain,
)
from app.domains.lab.specimen.models import Sample
from app.domains.lab.workflow.constants import ANALYZER_USER_ID
from app.domains.lab.workflow.operations import LabOperationsService
from app.domains.orders.models import Order, OrderTest
from app.platform.config import settings
from app.platform.debug_log import workflow_fail, workflow_ok, workflow_start
from app.shared.clinical import looks_like_accession, looks_like_filler
from app.shared.errors import LabOperationError
from app.shared.generated.enums import SampleStatus, TestStatus
from fastapi import status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session


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

    def _http_reject_ingest(
        self,
        status_code: int,
        detail: str,
        *,
        phase: str,
        order_id: str | None = None,
        order_test_id: int | None = None,
        test_code: str | None = None,
        analyzer_id: str | None = None,
        extra_metadata: dict[str, Any] | None = None,
    ) -> None:
        """Record reject audit on its own commit, then fail the request."""
        metadata: dict[str, Any] = {"reason": detail, "phase": phase, **(extra_metadata or {})}
        if analyzer_id:
            metadata["analyzer_id"] = analyzer_id
        AuditEmitter(self.db).analyzer_ingest_rejected(
            order_id,
            order_test_id,
            test_code,
            metadata=metadata,
        )
        self.db.commit()
        workflow_fail(
            "lab.integration",
            detail,
            phase=phase,
            status=status_code,
            order_id=order_id,
            test_code=test_code,
            analyzer_id=analyzer_id,
        )
        raise LabOperationError(detail, status_code=status_code, error_code="INGEST_REJECTED")

    @staticmethod
    def _validation_blocks_ingest(validation_errors: list[str]) -> None:
        if validation_errors and settings.ANALYZER_STRICT_VALIDATION:
            raise LabOperationError(
                "; ".join(validation_errors),
                status_code=400,
                error_code="VALIDATION_ERROR",
            )

    def _resolve_sample(self, specimen_id: str, test_code: str | None = None) -> Sample | None:
        """Match SPM-2 / specimen_id to accession, then filler + test to the live tube."""
        token = specimen_id.strip()
        if not token:
            return None
        sample = self.db.query(Sample).filter(Sample.sampleId == token).first()
        if sample:
            return sample
        if looks_like_accession(token):
            return None
        if looks_like_filler(token):
            order = self.db.query(Order).filter(Order.orderId == token).first()
            if not order:
                return None
            if test_code:
                enterable = find_enterable_order_test_on_order(
                    self.db, order.orderId, test_code
                )
                if enterable and enterable.sampleId:
                    return (
                        self.db.query(Sample)
                        .filter(Sample.sampleId == enterable.sampleId)
                        .first()
                    )
            return (
                self.db.query(Sample)
                .filter(
                    Sample.orderId == order.orderId,
                    Sample.status == SampleStatus.COLLECTED,
                )
                .order_by(Sample.sampleId.desc())
                .first()
            )
        return None

    def _find_pending_test(self, sample: Sample, test_code: str) -> OrderTest:
        """Resolve the SAMPLE_COLLECTED line on a collected tube, including recollection."""
        order_test = find_enterable_order_test(self.db, sample, test_code)
        if order_test:
            return order_test
        order_test = find_enterable_order_test_on_order(self.db, sample.orderId, test_code)
        if order_test:
            return order_test
        existing = latest_order_test_on_sample_chain(self.db, sample, test_code)
        if existing is None:
            existing = (
                self.db.query(OrderTest)
                .filter(OrderTest.orderId == sample.orderId, OrderTest.testCode == test_code)
                .order_by(OrderTest.id.desc())
                .first()
            )
        if existing and existing.status in [TestStatus.RESULTED, TestStatus.VALIDATED]:
            raise LabOperationError(
                f"OrderableTest {test_code} already has results",
                status_code=409,
                error_code="TEST_ALREADY_RESULTED",
            )
        raise LabOperationError(
            f"No pending test {test_code} found for sample {sample.sampleId}",
            status_code=404,
            error_code="PENDING_TEST_NOT_FOUND",
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
        analyzer_id: str | None = None,
    ) -> AnalyzerResultResponse:
        service = LabOperationsService(self.db)
        extra_metadata: dict[str, Any] = {"source": "analyzer"}
        if analyzer_id:
            extra_metadata["analyzer_id"] = analyzer_id

        def _mutate():
            if idempotency_key:
                self._claim_idempotency_key(idempotency_key, order_test.id)
            return service._results.enter_results(
                order_test_id=order_test.id,
                user_id=ANALYZER_USER_ID,
                results=results,
                technician_notes=technician_notes,
                extra_metadata=extra_metadata or None,
            )

        try:
            updated_test = service.run_lab_mutation(
                _mutate,
                order_id=sample.orderId,
                action="analyzer_enter_results",
            )
        except LabOperationError as e:
            emitter = AuditEmitter(self.db)
            if e.error_code == "DUPLICATE_INGEST":
                emitter.analyzer_duplicate_ingest(
                    sample.orderId,
                    order_test.id,
                    test_code,
                    metadata={
                        "idempotency_key": idempotency_key,
                        **extra_metadata,
                    },
                )
                self.db.commit()
            elif e.error_code == "VALIDATION_ERROR":
                emitter.analyzer_ingest_rejected(
                    sample.orderId,
                    order_test.id,
                    test_code,
                    metadata={
                        "reason": e.message,
                        "idempotency_key": idempotency_key,
                        **extra_metadata,
                    },
                )
                self.db.commit()
            raise
        return AnalyzerResultResponse(
            success=True,
            message=f"Results entered for test {test_code}",
            order_id=sample.orderId,
            test_id=updated_test.id,
            status=updated_test.status.value,
            warnings=warnings,
        )

    def ingest_hl7(self, request: HL7MessageRequest) -> AnalyzerResultResponse:
        workflow_start(
            "lab.integration",
            action="ingest_hl7",
            analyzer_id=request.analyzer_id,
        )
        warnings: list[str] = []
        analyzer_id = request.analyzer_id
        parser = HL7Parser()
        try:
            analyzer_result = parser.parse(request.message)
        except HL7ParseError as e:
            detail = f"Failed to parse HL7 message: {str(e)}"
            self._http_reject_ingest(
                status.HTTP_400_BAD_REQUEST,
                detail,
                phase="hl7_parse",
                analyzer_id=analyzer_id,
            )
        specimen_id = analyzer_result.specimen_id
        if not specimen_id:
            self._http_reject_ingest(
                status.HTTP_400_BAD_REQUEST,
                "No specimen ID found in HL7 message",
                phase="hl7_missing_specimen",
                analyzer_id=analyzer_id,
            )
        test_code = analyzer_result.test_code
        if not test_code:
            self._http_reject_ingest(
                status.HTTP_400_BAD_REQUEST,
                "No test code found in HL7 message",
                phase="hl7_missing_test_code",
                analyzer_id=analyzer_id,
                extra_metadata={"specimen_id": specimen_id},
            )
        sample = self._resolve_sample(str(specimen_id), test_code)
        if not sample:
            self._http_reject_ingest(
                status.HTTP_404_NOT_FOUND,
                f"Sample {specimen_id} not found",
                phase="specimen_not_found",
                analyzer_id=analyzer_id,
                extra_metadata={"specimen_id": specimen_id},
            )
        order_test = self._find_pending_test(sample, test_code)
        from app.domains.catalog.service import CatalogAnalyteService, analyte_definitions_for_test

        analyte_defs = analyte_definitions_for_test(self.db, test_code)
        catalog = CatalogAnalyteService(self.db)
        adapter = AnalyzerResultAdapter(catalog, test_code=test_code)
        validation_errors = adapter.validate_against_catalog(analyzer_result, analyte_defs)
        self._validation_blocks_ingest(validation_errors)
        if validation_errors:
            warnings.extend(validation_errors)
        internal_results = adapter.to_internal_format(analyzer_result, analyte_defs)
        if not internal_results:
            self._http_reject_ingest(
                status.HTTP_400_BAD_REQUEST,
                "No final observations mapped for this test",
                phase="hl7_empty_results",
                order_id=sample.orderId,
                order_test_id=order_test.id,
                test_code=test_code,
                analyzer_id=analyzer_id,
            )
        notes = (
            f"Auto-entered from analyzer "
            f"{request.analyzer_id or analyzer_result.analyzer_id or 'unknown'}"
        )
        resolved_analyzer_id = analyzer_id or analyzer_result.analyzer_id or None
        result = self._enter_results(
            order_test,
            internal_results,
            notes,
            sample,
            test_code,
            warnings,
            idempotency_key=analyzer_result.message_id or None,
            analyzer_id=resolved_analyzer_id,
        )
        workflow_ok(
            "lab.integration",
            action="ingest_hl7",
            order_id=sample.orderId,
            test_id=order_test.id,
            test_code=test_code,
        )
        return result

    def ingest_json(self, request: AnalyzerResultRequest) -> AnalyzerResultResponse:
        workflow_start(
            "lab.integration",
            action="ingest_json",
            analyzer_id=request.analyzer_id,
            specimen_id=request.specimen_id,
            test_code=request.test_code,
        )
        sample = self._resolve_sample(str(request.specimen_id), request.test_code)
        if not sample:
            raise LabOperationError(
                f"Sample {request.specimen_id} not found",
                status_code=404,
                error_code="SPECIMEN_NOT_FOUND",
            )
        order_test = self._find_pending_test(sample, request.test_code)
        idempotency_key = (request.correlation_id or "").strip()
        if not idempotency_key:
            idempotency_key = (
                f"json:{request.specimen_id}:{request.test_code}:"
                f"{request.analyzer_id or 'unknown'}:{order_test.id}"
            )
        from app.domains.catalog.service import CatalogAnalyteService, analyte_definitions_for_test

        analyte_defs = analyte_definitions_for_test(self.db, request.test_code)
        catalog = CatalogAnalyteService(self.db)
        adapter = AnalyzerResultAdapter(catalog, test_code=request.test_code)
        internal_results = request.results
        if analyte_defs:
            pseudo = HL7AnalyzerResult(
                message_id=idempotency_key,
                test_code=request.test_code,
                results=[
                    Hl7ObservationRow(observation_code=k, observation_name=k, value=str(v))
                    for k, v in request.results.items()
                ],
            )
            validation_errors = adapter.validate_against_catalog(pseudo, analyte_defs)
            self._validation_blocks_ingest(validation_errors)
            internal_results = adapter.to_internal_format(pseudo, analyte_defs)
        if not internal_results:
            raise LabOperationError(
                "No results to enter",
                status_code=400,
                error_code="VALIDATION_ERROR",
            )
        notes = f"Auto-entered from analyzer {request.analyzer_id or 'unknown'}"
        result = self._enter_results(
            order_test,
            internal_results,
            notes,
            sample,
            request.test_code,
            [],
            idempotency_key=idempotency_key,
            analyzer_id=request.analyzer_id,
        )
        workflow_ok(
            "lab.integration",
            action="ingest_json",
            order_id=sample.orderId,
            test_id=order_test.id,
            test_code=request.test_code,
        )
        return result

    def list_pending(self, analyzer_id: str) -> dict[str, Any]:
        del analyzer_id
        pending_rows = (
            self.db.query(OrderTest, Sample)
            .join(Sample, Sample.sampleId == OrderTest.sampleId)
            .filter(
                OrderTest.status == TestStatus.SAMPLE_COLLECTED,
                Sample.status == SampleStatus.COLLECTED,
            )
            .limit(10000)
            .all()
        )
        results = []
        for test, sample in pending_rows:
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
