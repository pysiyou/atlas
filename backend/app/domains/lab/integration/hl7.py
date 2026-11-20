"""
HL7 Message Parser

Parses HL7 v2.x messages (specifically ORU - Observation Result)
from laboratory analyzers.
"""
import logging
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

logger = logging.getLogger(__name__)


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
            logger.warning("Failed to parse OBX segment", exc_info=True)
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
