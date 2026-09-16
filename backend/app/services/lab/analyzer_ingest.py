"""
HL7 Message Parser

Parses HL7 v2.x messages (specifically ORU - Observation Result)
from laboratory analyzers.
"""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from app.models.order import OrderTest
from app.models.sample import Sample
from app.models.test import Test
from app.schemas.analyzer import AnalyzerResultRequest, AnalyzerResultResponse, HL7MessageRequest
from app.schemas.enums import TestStatus
from app.services.lab.workflow import LabOperationsService
from app.utils.exceptions import LabOperationError
from fastapi import HTTPException, status
from sqlalchemy.orm import Session


@dataclass
class HL7ResultItem:
    """Represents a single result item from an OBX segment"""

    item_code: str
    item_name: str
    value: str
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
    results: list[HL7ResultItem] = field(default_factory=list)
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

    def _parse_obx(self, obx: list[str]) -> HL7ResultItem | None:
        """Parse an OBX (observation) segment"""
        try:
            # OBX-3: Observation Identifier (code^name)
            obs_id = self._get_field(obx, 3)
            if not obs_id:
                return None

            components = obs_id.split(self.COMPONENT_SEP)
            item_code = components[0] if len(components) > 0 else ""
            item_name = components[1] if len(components) > 1 else item_code

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

            return HL7ResultItem(
                item_code=item_code,
                item_name=item_name,
                value=value,
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

    Maps analyzer result items to internal test catalog items.
    """

    def to_internal_format(
        self, analyzer_result: HL7AnalyzerResult, test_result_items: list[dict[str, Any]]
    ) -> dict[str, Any]:
        """
        Convert analyzer result to internal result format.

        Args:
            analyzer_result: Parsed HL7 result
            test_result_items: Result item definitions from test catalog

        Returns:
            Dict of item_code -> value suitable for storing in OrderTest.results
        """
        results = {}

        # Create a mapping of analyzer codes to internal codes
        item_code_map = {}
        for item in test_result_items:
            item_code = item.get("item_code", "")
            # Map by exact match or common aliases
            item_code_map[item_code] = item_code
            item_code_map[item_code.upper()] = item_code
            item_code_map[item_code.lower()] = item_code

        # Process each result item
        for result_item in analyzer_result.results:
            # Find matching internal code
            internal_code = item_code_map.get(result_item.item_code)
            if not internal_code:
                internal_code = item_code_map.get(result_item.item_code.upper())
            if not internal_code:
                # Use the analyzer code as-is if no mapping found
                internal_code = result_item.item_code

            results[internal_code] = result_item.value

        return results

    def validate_against_catalog(
        self, analyzer_result: HL7AnalyzerResult, test_result_items: list[dict[str, Any]]
    ) -> list[str]:
        """
        Validate analyzer results against test catalog.

        Returns:
            List of validation error messages (empty if valid)
        """
        errors = []

        expected_codes = {item.get("item_code") for item in test_result_items}
        received_codes = {r.item_code for r in analyzer_result.results}

        # Check for missing expected results
        missing = expected_codes - received_codes
        if missing:
            errors.append(f"Missing expected result items: {', '.join(missing)}")

        # Check for unexpected results
        unexpected = received_codes - expected_codes
        if unexpected:
            # This is a warning, not necessarily an error
            pass  # Could log this

        return errors


"""Analyzer result ingestion — HL7 and JSON."""


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
