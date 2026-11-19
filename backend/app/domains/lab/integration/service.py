from __future__ import annotations

# --- from integration/hl7_parser.py ---

"""
HL7 Message Parser

Parses HL7 v2.x messages (specifically ORU - Observation Result)
from laboratory analyzers.
"""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any


@dataclass
class Hl7ObservationRow:
    """Single OBX observation before catalog ``analyte_code`` resolution."""

    observation_code: str
    observation_name: str
    value: str
    loinc_code: str | None = None
    units: str | None = None
    reference_range: str | None = None
    abnormal_flag: str | None = None  # H, L, A, etc.
    status: str = "F"  # F=Final, P=Preliminary, C=Corrected


@dataclass
class HL7AnalyzerResult:
    """Represents parsed results from an HL7 ORU message"""

    message_id: str
    patient_id: str | None = None
    specimen_id: str | None = None
    test_code: str | None = None
    analyzer_id: str | None = None
    observation_datetime: datetime | None = None
    results: list[Hl7ObservationRow] = field(default_factory=list)
    raw_message: str = ""


class HL7ParseError(Exception):
    """Exception raised when HL7 parsing fails"""

    pass


class HL7Parser:
    """
    Parser for HL7 v2.x ORU (Observation Result) messages.

    Supports common message formats from laboratory analyzers.
    """

    # HL7 field separators
    FIELD_SEP = "|"
    COMPONENT_SEP = "^"
    REPEAT_SEP = "~"
    ESCAPE_CHAR = "\\"
    SUBCOMPONENT_SEP = "&"

    def __init__(self):
        self.segments: dict[str, list[list[str]]] = {}

    def parse(self, raw_message: str) -> HL7AnalyzerResult:
        """
        Parse an HL7 ORU message.

        Args:
            raw_message: Raw HL7 message string

        Returns:
            HL7AnalyzerResult object with parsed data

        Raises:
            HL7ParseError: If message is malformed
        """
        if not raw_message:
            raise HL7ParseError("Empty message")

        # Normalize line endings
        message = raw_message.replace("\r\n", "\r").replace("\n", "\r")
        lines = [line for line in message.split("\r") if line.strip()]

        if not lines:
            raise HL7ParseError("No segments found in message")

        # Parse MSH segment first
        msh = lines[0]
        if not msh.startswith("MSH"):
            raise HL7ParseError("Message must start with MSH segment")

        # Extract field separator from MSH
        if len(msh) > 3:
            self.FIELD_SEP = msh[3]

        # Parse all segments
        self.segments = {}
        for line in lines:
            segment_type = line[:3]
            fields = line.split(self.FIELD_SEP)
            if segment_type not in self.segments:
                self.segments[segment_type] = []
            self.segments[segment_type].append(fields)

        return self._build_result(raw_message)

    def _build_result(self, raw_message: str) -> HL7AnalyzerResult:
        """Build the result object from parsed segments"""
        result = HL7AnalyzerResult(message_id=self._get_message_id(), raw_message=raw_message)

        # Extract patient info from PID segment
        pid = self._get_segment("PID")
        if pid:
            result.patient_id = self._get_field(pid, 3, 0)  # PID-3 Patient ID

        # Extract specimen info from SPM or OBR segment
        spm = self._get_segment("SPM")
        if spm:
            result.specimen_id = self._get_field(spm, 2, 0)  # SPM-2 Specimen ID
        else:
            # Fall back to OBR segment for specimen ID
            obr = self._get_segment("OBR")
            if obr:
                result.specimen_id = self._get_field(obr, 3, 0)  # OBR-3 Filler Order Number

        # Extract test code from OBR segment
        obr = self._get_segment("OBR")
        if obr:
            result.test_code = self._get_field(obr, 4, 0)  # OBR-4 Universal Service ID
            result.analyzer_id = self._get_field(obr, 20, 0)  # OBR-20 Filler Field 1

            # Parse observation datetime
            dt_str = self._get_field(obr, 7)  # OBR-7 Observation Date/Time
            if dt_str:
                result.observation_datetime = self._parse_datetime(dt_str)

        # Extract results from OBX segments
        obx_segments = self.segments.get("OBX", [])
        for obx in obx_segments:
            result_item = self._parse_obx(obx)
            if result_item:
                result.results.append(result_item)

        return result

    def _parse_obx(self, obx: list[str]) -> Hl7ObservationRow | None:
        """Parse an OBX (observation) segment"""
        try:
            # OBX-3: Observation Identifier (code^name)
            obs_id = self._get_field(obx, 3)
            if not obs_id:
                return None

            components = obs_id.split(self.COMPONENT_SEP)
            observation_code = components[0] if len(components) > 0 else ""
            observation_name = components[1] if len(components) > 1 else observation_code
            coding_system = components[2] if len(components) > 2 else ""
            loinc_code: str | None = None
            if coding_system.upper() == "LN":
                loinc_code = observation_code
            elif len(components) > 3 and (components[3] or "").strip():
                loinc_code = components[3].strip()

            # OBX-5: Observation Value
            value = self._get_field(obx, 5) or ""

            # OBX-6: Units
            units = self._get_field(obx, 6, 0)

            # OBX-7: Reference Range
            ref_range = self._get_field(obx, 7)

            # OBX-8: Abnormal Flags
            abnormal_flag = self._get_field(obx, 8)

            # OBX-11: Observation Result Status
            status = self._get_field(obx, 11) or "F"

            return Hl7ObservationRow(
                observation_code=observation_code,
                observation_name=observation_name,
                value=value,
                loinc_code=loinc_code,
                units=units,
                reference_range=ref_range,
                abnormal_flag=abnormal_flag,
                status=status,
            )
        except Exception:
            return None

    def _get_segment(self, segment_type: str) -> list[str] | None:
        """Get the first occurrence of a segment type"""
        segments = self.segments.get(segment_type, [])
        return segments[0] if segments else None

    def _get_field(
        self, segment: list[str], index: int, component: int | None = None
    ) -> str | None:
        """Get a field from a segment, optionally extracting a component"""
        if index >= len(segment):
            return None

        field_value = segment[index]
        if component is not None:
            components = field_value.split(self.COMPONENT_SEP)
            return components[component] if component < len(components) else None

        return field_value

    def _get_message_id(self) -> str:
        """Get the message control ID from MSH-10"""
        msh = self._get_segment("MSH")
        if msh:
            return self._get_field(msh, 9) or "unknown"
        return "unknown"

    def _parse_datetime(self, dt_str: str) -> datetime | None:
        """Parse HL7 datetime format (YYYYMMDDHHMMSS)"""
        try:
            # Handle various formats
            if len(dt_str) >= 14:
                return datetime.strptime(dt_str[:14], "%Y%m%d%H%M%S")
            elif len(dt_str) >= 12:
                return datetime.strptime(dt_str[:12], "%Y%m%d%H%M")
            elif len(dt_str) >= 8:
                return datetime.strptime(dt_str[:8], "%Y%m%d")
        except ValueError:
            pass
        return None


class AnalyzerResultAdapter:
    """
    Adapter to convert HL7 parsed results to internal format.

    Maps analyzer observations to canonical ``analyte_code`` keys via ``CatalogAnalyteService``.
    """

    def __init__(self, catalog_resolver: Any | None = None, *, test_code: str | None = None) -> None:
        self._resolver = catalog_resolver
        self._test_code = test_code

    def to_internal_format(
        self, analyzer_result: HL7AnalyzerResult, analyte_definitions: list[dict[str, Any]]
    ) -> dict[str, Any]:
        """
        Convert analyzer result to internal result format.

        Returns:
            Dict of ``analyte_code`` -> value suitable for storing in ``OrderTest.results``.
        """
        results: dict[str, Any] = {}
        test_code = self._test_code or analyzer_result.test_code

        for result_item in analyzer_result.results:
            analyte_code: str | None = None
            if self._resolver is not None and test_code:
                analyte_code = self._resolver.resolve_to_analyte_code(
                    test_code,
                    result_item.observation_code,
                    loinc_code=result_item.loinc_code,
                )
            if not analyte_code:
                analyte_code = self._resolve_from_definitions(
                    result_item.observation_code, result_item.loinc_code, analyte_definitions
                )
            if analyte_code:
                results[analyte_code] = result_item.value

        return results

    @staticmethod
    def _resolve_from_definitions(
        observation_code: str,
        loinc_code: str | None,
        analyte_definitions: list[dict[str, Any]],
    ) -> str | None:
        index: dict[str, str] = {}
        for item in analyte_definitions:
            code = item.get("analyte_code")
            if not code:
                continue
            for key in (code, str(code).upper(), str(code).lower()):
                index[key] = code
            loinc = (item.get("loinc_code") or "").strip()
            if loinc:
                for key in (loinc, loinc.upper(), loinc.lower()):
                    index[key] = code
        if loinc_code and loinc_code.strip() in index:
            return index[loinc_code.strip()]
        obs = observation_code.strip()
        if obs in index:
            return index[obs]
        return index.get(obs.upper()) or index.get(obs.lower())

    def validate_against_catalog(
        self, analyzer_result: HL7AnalyzerResult, analyte_definitions: list[dict[str, Any]]
    ) -> list[str]:
        """
        Validate analyzer results against test catalog (by resolved ``analyte_code``).

        Returns:
            List of validation error messages (empty if valid)
        """
        errors: list[str] = []
        expected_codes = {
            item.get("analyte_code") for item in analyte_definitions if item.get("analyte_code")
        }
        if not expected_codes:
            return errors

        resolved = set(self.to_internal_format(analyzer_result, analyte_definitions).keys())
        missing = expected_codes - resolved
        if missing:
            errors.append(f"Missing expected analytes: {', '.join(sorted(missing))}")
        return errors


# --- from integration/analyzer_ingest_service.py ---

"""Analyzer result ingestion — HL7 and JSON."""
from datetime import UTC, datetime
from typing import Any

from app.domains.audit.service import AuditEmitter
from app.domains.catalog.models import OrderableTest
from app.domains.lab.integration.models import AnalyzerIngestDedup
from app.domains.lab.specimen.models import Sample
from app.domains.orders.models import Order, OrderTest
from app.domains.lab.integration.schemas import (
    AnalyzerResultRequest,
    AnalyzerResultResponse,
    HL7MessageRequest,
)
from app.domains.lab.workflow.service import ANALYZER_USER_ID
from app.domains.lab.workflow.service import LabOperationsService
from app.platform.config import settings
from app.shared.identifiers import looks_like_accession, looks_like_filler
from app.shared.exceptions import LabOperationError
from app.shared.enums import TestStatus
from fastapi import HTTPException, status
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

    @staticmethod
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
        raise HTTPException(status_code=status_code, detail=detail)

    @staticmethod
    def _validation_blocks_ingest(validation_errors: list[str]) -> None:
        if validation_errors and settings.ANALYZER_STRICT_VALIDATION:
            raise LabOperationError(
                "; ".join(validation_errors),
                status_code=400,
                error_code="VALIDATION_ERROR",
            )

    def _resolve_sample(self, specimen_id: str) -> Sample | None:
        """Match SPM-2 / specimen_id to accession, then filler order number."""
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
            if order:
                return (
                    self.db.query(Sample)
                    .filter(Sample.orderId == order.orderId)
                    .order_by(Sample.sampleId.asc())
                    .first()
                )
        return None

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
                detail=f"OrderableTest {test_code} already has results",
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
            updated_test = service.run_lab_mutation(_mutate, order_id=sample.orderId)
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
        sample = self._resolve_sample(str(specimen_id))
        if not sample:
            self._http_reject_ingest(
                status.HTTP_404_NOT_FOUND,
                f"Sample {specimen_id} not found",
                phase="specimen_not_found",
                analyzer_id=analyzer_id,
                extra_metadata={"specimen_id": specimen_id},
            )
        test_code = analyzer_result.test_code
        if not test_code:
            self._http_reject_ingest(
                status.HTTP_400_BAD_REQUEST,
                "No test code found in HL7 message",
                phase="hl7_missing_test_code",
                order_id=sample.orderId,
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
        notes = (
            f"Auto-entered from analyzer "
            f"{request.analyzer_id or analyzer_result.analyzer_id or 'unknown'}"
        )
        resolved_analyzer_id = analyzer_id or analyzer_result.analyzer_id or None
        return self._enter_results(
            order_test,
            internal_results,
            notes,
            sample,
            test_code,
            warnings,
            idempotency_key=analyzer_result.message_id or None,
            analyzer_id=resolved_analyzer_id,
        )

    def ingest_json(self, request: AnalyzerResultRequest) -> AnalyzerResultResponse:
        sample = self._resolve_sample(str(request.specimen_id))
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
        notes = f"Auto-entered from analyzer {request.analyzer_id or 'unknown'}"
        return self._enter_results(
            order_test,
            internal_results,
            notes,
            sample,
            request.test_code,
            [],
            idempotency_key=idempotency_key,
            analyzer_id=request.analyzer_id,
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
