"""
Platform utilities: clinical identifiers, query helpers, and lab errors.

Integer primary keys stay internal. Identifier helpers allocate and validate
the MRN / filler / accession / mnemonic strings used on barcodes, search, and
HL7. Query helpers and ``LabOperationError`` are shared by domain services.
"""
from __future__ import annotations

import re
from datetime import UTC, datetime
from typing import Any, TypeVar

from app.platform.database import Base
from app.shared.contracts.rejection_reasons import is_specimen_rejection_registry_value
from fastapi import HTTPException
from sqlalchemy import Column, Integer, String
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

T = TypeVar("T")


# ---------------------------------------------------------------------------
# Sequence table + clinical identifier kit
# ---------------------------------------------------------------------------


class IdSequence(Base):
    """
    One row per ``(kind, period)``; ``last_seq`` is incremented under a row lock.

    ``period`` is empty for global sequences (MRN, employee, receipt) and a
    date key for resetting counters (``YYYYMMDD`` for orders/invoices, ``YYYY``
    for yearly accessions).
    """

    __tablename__ = "id_sequences"

    kind = Column(String, primary_key=True)
    period = Column(String, primary_key=True, default="")
    lastSeq = Column("last_seq", Integer, nullable=False, default=0)


MRN_PATTERN = r"^[0-9A-Z]{6,12}$"
FILLER_PATTERN = r"^\d{13}$"
PLACER_PATTERN = FILLER_PATTERN
ACCESSION_PATTERN = r"^\d{2}-\d{5}$"
ALIQUOT_ACCESSION_PATTERN = r"^\d{2}-\d{5}\.\d{1,2}$"
TEST_MNEMONIC_PATTERN = r"^[A-Z][A-Z0-9]{1,7}$"
NPI_PATTERN = r"^\d{10}$"
EMPLOYEE_NUMBER_PATTERN = r"^\d{6}$"
INVOICE_NUMBER_PATTERN = r"^\d{12}$"
RECEIPT_NUMBER_PATTERN = r"^\d{8}$"
MEMBER_ID_PATTERN = r"^[0-9A-Z]{6,20}$"
ANALYZER_ID_PATTERN = r"^[A-Z0-9][A-Z0-9._-]{2,31}$"

MRN_RE = re.compile(MRN_PATTERN)
FILLER_RE = re.compile(FILLER_PATTERN)
ACCESSION_RE = re.compile(ACCESSION_PATTERN)
ALIQUOT_ACCESSION_RE = re.compile(ALIQUOT_ACCESSION_PATTERN)
TEST_MNEMONIC_RE = re.compile(TEST_MNEMONIC_PATTERN)
NPI_RE = re.compile(NPI_PATTERN)
EMPLOYEE_NUMBER_RE = re.compile(EMPLOYEE_NUMBER_PATTERN)
INVOICE_NUMBER_RE = re.compile(INVOICE_NUMBER_PATTERN)
RECEIPT_NUMBER_RE = re.compile(RECEIPT_NUMBER_PATTERN)
MEMBER_ID_RE = re.compile(MEMBER_ID_PATTERN)
ANALYZER_ID_RE = re.compile(ANALYZER_ID_PATTERN)

KIND_MRN = "mrn"
KIND_ORDER = "order"
KIND_ACCESSION = "accession"
KIND_INVOICE = "invoice"
KIND_RECEIPT = "receipt"
KIND_EMPLOYEE = "employee"
KIND_MEMBER = "member"

MRN_BASE = 10_000_000
EMPLOYEE_BASE = 100_000
MEMBER_BASE = 100_000_000_000
RECEIPT_BASE = 10_000_000


class IdentifierError(ValueError):
    """Raised when a generated or supplied clinical identifier is invalid."""


def assign_next(db: Session, kind: str, period: str = "") -> int:
    """
    Allocate the next integer in ``kind``/``period`` under a row lock.

    Uses INSERT … ON CONFLICT DO NOTHING then SELECT FOR UPDATE so concurrent
    creators on a new period cannot insert duplicate counter rows.
    """
    if not kind:
        raise IdentifierError("Sequence kind is required")
    period_key = period or ""
    db.execute(
        insert(IdSequence)
        .values(kind=kind, period=period_key, lastSeq=0)
        .on_conflict_do_nothing(index_elements=["kind", "period"])
    )
    db.flush()
    counter = (
        db.query(IdSequence)
        .filter(IdSequence.kind == kind, IdSequence.period == period_key)
        .with_for_update()
        .one()
    )
    counter.lastSeq = int(counter.lastSeq or 0) + 1
    return int(counter.lastSeq)


def _require_match(value: str, pattern: re.Pattern[str], label: str) -> str:
    """Return ``value`` when it matches ``pattern``, otherwise raise."""
    if not pattern.fullmatch(value):
        raise IdentifierError(f"Invalid {label}: {value}")
    return value


def format_mrn(seq: int) -> str:
    """8-digit MRN starting at 10000001."""
    if seq < 1:
        raise IdentifierError("MRN sequence must be positive")
    return _require_match(f"{MRN_BASE + seq:08d}", MRN_RE, "MRN")


def format_filler_number(day: datetime, seq: int) -> str:
    """YYYYMMDD + 5-digit daily sequence (e.g. 2026111600001)."""
    if seq < 1 or seq > 99_999:
        raise IdentifierError("Order sequence must be 1–99999")
    stamp = day.astimezone(UTC).strftime("%Y%m%d")
    return _require_match(f"{stamp}{seq:05d}", FILLER_RE, "filler number")


def format_accession_number(year: int, seq: int) -> str:
    """Yearly accession ``YY-NNNNN`` (e.g. 26-04567)."""
    if seq < 1 or seq > 99_999:
        raise IdentifierError("Accession sequence must be 1–99999")
    yy = f"{year % 100:02d}"
    return _require_match(f"{yy}-{seq:05d}", ACCESSION_RE, "accession number")


def format_aliquot_accession(parent_accession: str, aliquot_index: int) -> str:
    """Child tube id ``{parent}.{n}`` preserving parent barcode lineage."""
    if aliquot_index < 1:
        raise IdentifierError("Aliquot index must be positive")
    parent = parent_accession.strip()
    if not ACCESSION_RE.fullmatch(parent):
        raise IdentifierError(f"Invalid parent accession: {parent_accession}")
    value = f"{parent}.{aliquot_index}"
    if not ALIQUOT_ACCESSION_RE.fullmatch(value):
        raise IdentifierError(f"Invalid aliquot accession: {value}")
    return value


def format_invoice_number(day: datetime, seq: int) -> str:
    """YYYYMMDD + 4-digit daily sequence."""
    if seq < 1 or seq > 9999:
        raise IdentifierError("Invoice sequence must be 1–9999")
    stamp = day.astimezone(UTC).strftime("%Y%m%d")
    return _require_match(f"{stamp}{seq:04d}", INVOICE_NUMBER_RE, "invoice number")


def format_receipt_number(seq: int) -> str:
    """8-digit receipt number starting at 10000001."""
    if seq < 1:
        raise IdentifierError("Receipt sequence must be positive")
    return _require_match(f"{RECEIPT_BASE + seq:08d}", RECEIPT_NUMBER_RE, "receipt number")


def format_employee_number(seq: int) -> str:
    """6-digit staff number starting at 100001."""
    if seq < 1:
        raise IdentifierError("Employee sequence must be positive")
    return _require_match(f"{EMPLOYEE_BASE + seq:06d}", EMPLOYEE_NUMBER_RE, "employee number")


def format_member_id(seq: int) -> str:
    """12-digit payer member ID with no prefix."""
    if seq < 1:
        raise IdentifierError("Member sequence must be positive")
    return _require_match(f"{MEMBER_BASE + seq:012d}", MEMBER_ID_RE, "member ID")


def allocate_mrn(db: Session) -> str:
    """Assign the next sequential MRN."""
    return format_mrn(assign_next(db, KIND_MRN))


def allocate_filler_number(db: Session, when: datetime | None = None) -> str:
    """Assign the next daily filler order number."""
    moment = when or datetime.now(UTC)
    day = moment.astimezone(UTC)
    return format_filler_number(day, assign_next(db, KIND_ORDER, day.strftime("%Y%m%d")))


def allocate_accession_number(db: Session, when: datetime | None = None) -> str:
    """Assign the next yearly accession ``YY-NNNNN``."""
    moment = when or datetime.now(UTC)
    year = moment.astimezone(UTC).year
    return format_accession_number(year, assign_next(db, KIND_ACCESSION, str(year)))


def allocate_invoice_number(db: Session, when: datetime | None = None) -> str:
    """Assign the next daily invoice number."""
    moment = when or datetime.now(UTC)
    day = moment.astimezone(UTC)
    return format_invoice_number(day, assign_next(db, KIND_INVOICE, day.strftime("%Y%m%d")))


def allocate_receipt_number(db: Session) -> str:
    """Assign the next sequential receipt number."""
    return format_receipt_number(assign_next(db, KIND_RECEIPT))


def allocate_employee_number(db: Session) -> str:
    """Assign the next sequential employee number."""
    return format_employee_number(assign_next(db, KIND_EMPLOYEE))


def allocate_member_id(db: Session) -> str:
    """Assign the next sequential payer member ID."""
    return format_member_id(assign_next(db, KIND_MEMBER))


def normalize_identifier(term: str) -> str:
    """Strip surrounding whitespace; keep internal dashes (accessions need them)."""
    return term.strip().upper()


def compact_identifier(term: str) -> str:
    """Uppercase with spaces/dashes removed for prefix-free numeric matching."""
    return re.sub(r"[\s-]", "", term.strip()).upper()


def looks_like_mrn(term: str) -> bool:
    """True when ``term`` matches the accepted MRN pattern."""
    compact = compact_identifier(term)
    return bool(MRN_RE.fullmatch(compact))


def looks_like_filler(term: str) -> bool:
    """True when ``term`` is a 13-digit filler number."""
    compact = compact_identifier(term)
    return bool(FILLER_RE.fullmatch(compact))


def looks_like_accession(term: str) -> bool:
    """True for yearly ``YY-NNNNN`` or aliquot ``YY-NNNNN.n`` accessions."""
    trimmed = term.strip()
    return bool(ACCESSION_RE.fullmatch(trimmed) or ALIQUOT_ACCESSION_RE.fullmatch(trimmed))


def looks_like_mnemonic(term: str) -> bool:
    """True when ``term`` is a 2–8 character catalog mnemonic."""
    return bool(TEST_MNEMONIC_RE.fullmatch(term.strip().upper()))


def looks_like_npi(term: str) -> bool:
    """True when ``term`` is a 10-digit NPI."""
    return bool(NPI_RE.fullmatch(compact_identifier(term)))


def format_order_test_display(accession: str | None, test_code: str | None) -> str:
    """Order-line display: accession/mnemonic, falling back to whichever is present."""
    acc = (accession or "").strip()
    code = (test_code or "").strip().upper()
    if acc and code:
        return f"{acc}/{code}"
    return acc or code or "-"


# ---------------------------------------------------------------------------
# Query / result helpers
# ---------------------------------------------------------------------------


def get_or_404(
    db: Session,
    model: type[T],
    id_value: int | str,
    id_field: str = "id",
    detail: str | None = None,
) -> T:
    """Fetch an entity by id or raise 404."""
    entity = db.query(model).filter(getattr(model, id_field) == id_value).first()
    if not entity:
        raise HTTPException(
            status_code=404,
            detail=detail or f"{model.__name__} not found",
        )
    return entity


def parse_csv_values(raw: str | None) -> list[str]:
    """Split a comma-separated query param into trimmed non-empty tokens."""
    if not raw:
        return []
    return [token.strip() for token in raw.split(",") if token.strip()]


def parse_numeric_result_value(value: Any) -> float | None:
    """
    Extract a numeric value from a result entry.

    Supports scalars (7.2), strings ("7.2", "<5"), structured objects
    ({"value": 7.2, ...}), and Pydantic result models.
    """
    if value is None:
        return None

    if isinstance(value, dict):
        if "value" in value:
            return parse_numeric_result_value(value["value"])
        return None

    if hasattr(value, "model_dump"):
        dumped = value.model_dump()
        if isinstance(dumped, dict):
            return parse_numeric_result_value(dumped.get("value"))

    value_attr = getattr(value, "value", None)
    if value_attr is not None and not isinstance(value, str | int | float | bool):
        parsed = parse_numeric_result_value(value_attr)
        if parsed is not None:
            return parsed

    if isinstance(value, int | float):
        return float(value)

    if isinstance(value, str):
        stripped = value.strip()
        if not stripped:
            return None
        if stripped[0] in "<>":
            stripped = stripped[1:].strip()
        try:
            return float(stripped)
        except ValueError:
            return None

    return None


def is_specimen_rejection_reason(reason: str) -> bool:
    """True when the value is a specimen-problem code in the rejection registry."""
    return is_specimen_rejection_registry_value(reason)


# ---------------------------------------------------------------------------
# Errors
# ---------------------------------------------------------------------------


class LabOperationError(Exception):
    """Raised when a lab operation fails (invalid transition, validation, etc.)."""

    def __init__(
        self, message: str, status_code: int = 400, error_code: str = "LAB_OPERATION_ERROR"
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        super().__init__(self.message)
