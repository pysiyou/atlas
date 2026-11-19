"""
Clinical identifier patterns, formatting, matching, and DB-backed allocation.

Mirrored in ``contracts/entity-ids.json``. Integer primary keys stay internal.
"""
from __future__ import annotations

import re
from datetime import UTC, datetime

from app.platform.database import Base
from sqlalchemy import Column, Integer, String
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session


class IdentifierError(ValueError):
    """Raised when a generated or supplied clinical identifier is invalid."""


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


MRN_PATTERN = r"^3\d{7}$"
FILLER_PATTERN = r"^\d{13}$"
ACCESSION_PATTERN = r"^\d{2}-\d{5}$"
ALIQUOT_ACCESSION_PATTERN = r"^\d{2}-\d{5}\.\d{1,2}$"
TEST_MNEMONIC_PATTERN = r"^[A-Z][A-Z0-9]{1,7}$"
REFERENT_DOCTOR_ID_PATTERN = r"^2\d{7}$"
EMPLOYEE_NUMBER_PATTERN = r"^1\d{7}$"
INVOICE_NUMBER_PATTERN = r"^\d{12}$"
RECEIPT_NUMBER_PATTERN = r"^\d{8}$"
MEMBER_ID_PATTERN = r"^[0-9A-Z]{6,20}$"
ANALYZER_ID_PATTERN = r"^[A-Z0-9][A-Z0-9._-]{2,31}$"
SAMPLE_ID_PATTERN = r"^\d{2}-\d{5}(\.\d{1,2})?$"
LAB_ACTOR_USER_ID_PATTERN = r"^(?:100000|1\d{7})$"
SPECIMEN_INGEST_PATTERN = r"^(?:\d{13}|\d{2}-\d{5}(?:\.\d{1,2})?)$"

MRN_RE = re.compile(MRN_PATTERN)
FILLER_RE = re.compile(FILLER_PATTERN)
ACCESSION_RE = re.compile(ACCESSION_PATTERN)
ALIQUOT_ACCESSION_RE = re.compile(ALIQUOT_ACCESSION_PATTERN)
TEST_MNEMONIC_RE = re.compile(TEST_MNEMONIC_PATTERN)
REFERENT_DOCTOR_ID_RE = re.compile(REFERENT_DOCTOR_ID_PATTERN)
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
KIND_REFERENT_DOCTOR = "referent_doctor"

PATIENT_ID_BASE = 30_000_000
USER_ID_BASE = 10_000_000
REFERENT_DOCTOR_ID_BASE = 20_000_000
RECEIPT_BASE = 10_000_000


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
    if not pattern.fullmatch(value):
        raise IdentifierError(f"Invalid {label}: {value}")
    return value


def format_mrn(seq: int) -> str:
    if seq < 1:
        raise IdentifierError("MRN sequence must be positive")
    return _require_match(f"{PATIENT_ID_BASE + seq:08d}", MRN_RE, "MRN")


def format_filler_number(day: datetime, seq: int) -> str:
    if seq < 1 or seq > 99_999:
        raise IdentifierError("Order sequence must be 1–99999")
    stamp = day.astimezone(UTC).strftime("%Y%m%d")
    return _require_match(f"{stamp}{seq:05d}", FILLER_RE, "filler number")


def format_accession_number(year: int, seq: int) -> str:
    if seq < 1 or seq > 99_999:
        raise IdentifierError("Accession sequence must be 1–99999")
    yy = f"{year % 100:02d}"
    return _require_match(f"{yy}-{seq:05d}", ACCESSION_RE, "accession number")


def format_aliquot_accession(parent_accession: str, aliquot_index: int) -> str:
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
    if seq < 1 or seq > 9999:
        raise IdentifierError("Invoice sequence must be 1–9999")
    stamp = day.astimezone(UTC).strftime("%Y%m%d")
    return _require_match(f"{stamp}{seq:04d}", INVOICE_NUMBER_RE, "invoice number")


def format_receipt_number(seq: int) -> str:
    if seq < 1:
        raise IdentifierError("Receipt sequence must be positive")
    return _require_match(f"{RECEIPT_BASE + seq:08d}", RECEIPT_NUMBER_RE, "receipt number")


def format_employee_number(seq: int) -> str:
    if seq < 1:
        raise IdentifierError("Employee sequence must be positive")
    return _require_match(f"{USER_ID_BASE + seq:08d}", EMPLOYEE_NUMBER_RE, "employee number")


def format_referent_doctor_id(seq: int) -> str:
    if seq < 1:
        raise IdentifierError("Referent-doctor sequence must be positive")
    return _require_match(
        f"{REFERENT_DOCTOR_ID_BASE + seq:08d}", REFERENT_DOCTOR_ID_RE, "referent doctor id"
    )


def allocate_mrn(db: Session) -> str:
    return format_mrn(assign_next(db, KIND_MRN))


def allocate_filler_number(db: Session, when: datetime | None = None) -> str:
    moment = when or datetime.now(UTC)
    day = moment.astimezone(UTC)
    return format_filler_number(day, assign_next(db, KIND_ORDER, day.strftime("%Y%m%d")))


def allocate_accession_number(db: Session, when: datetime | None = None) -> str:
    moment = when or datetime.now(UTC)
    year = moment.astimezone(UTC).year
    return format_accession_number(year, assign_next(db, KIND_ACCESSION, str(year)))


def allocate_invoice_number(db: Session, when: datetime | None = None) -> str:
    moment = when or datetime.now(UTC)
    day = moment.astimezone(UTC)
    return format_invoice_number(day, assign_next(db, KIND_INVOICE, day.strftime("%Y%m%d")))


def allocate_receipt_number(db: Session) -> str:
    return format_receipt_number(assign_next(db, KIND_RECEIPT))


def allocate_employee_number(db: Session) -> str:
    return format_employee_number(assign_next(db, KIND_EMPLOYEE))


def allocate_referent_doctor_id(db: Session) -> str:
    return format_referent_doctor_id(assign_next(db, KIND_REFERENT_DOCTOR))


def compact_identifier(term: str) -> str:
    """Uppercase with spaces/dashes removed for prefix-free numeric matching."""
    return re.sub(r"[\s-]", "", term.strip()).upper()


def looks_like_mrn(term: str) -> bool:
    return bool(MRN_RE.fullmatch(compact_identifier(term)))


def looks_like_filler(term: str) -> bool:
    return bool(FILLER_RE.fullmatch(compact_identifier(term)))


def looks_like_accession(term: str) -> bool:
    trimmed = term.strip()
    return bool(ACCESSION_RE.fullmatch(trimmed) or ALIQUOT_ACCESSION_RE.fullmatch(trimmed))


def looks_like_mnemonic(term: str) -> bool:
    return bool(TEST_MNEMONIC_RE.fullmatch(term.strip().upper()))