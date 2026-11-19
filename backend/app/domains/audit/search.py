"""Unified audit event log search — clinical ids and names."""
from __future__ import annotations

from typing import Any, Literal

from app.domains.audit.kinds import ACCESS_EVENT_TYPES
from app.domains.audit.models import AuditEvent
from app.domains.lab.models.sample import Sample
from app.domains.orders.models import Order, OrderTest
from app.domains.patients.models import Patient
from app.domains.users.models import User
from app.shared.identifiers import (
    compact_identifier,
    looks_like_accession,
    looks_like_filler,
    looks_like_mnemonic,
    looks_like_mrn,
)
from sqlalchemy import and_, exists, or_

SearchIntentMode = Literal[
    "empty",
    "record_order",
    "record_test",
    "record_sample",
    "record_patient",
    "text",
]

TEXT_SEARCH_DIMENSIONS = ("patientName", "actorName", "username")


def classify_search_term(term: str) -> dict[str, Any]:
    """Describe how unified audit search interprets a query string."""
    trimmed = term.strip()
    if not trimmed:
        return {"mode": "empty", "textTerm": None, "dimensions": [], "parsedIds": None}

    compact = compact_identifier(trimmed)

    if looks_like_mnemonic(trimmed):
        return {
            "mode": "record_test",
            "textTerm": None,
            "dimensions": [],
            "parsedIds": None,
            "displayToken": trimmed.strip().upper(),
        }
    if looks_like_filler(trimmed):
        return {
            "mode": "record_order",
            "textTerm": None,
            "dimensions": [],
            "parsedIds": None,
            "displayToken": compact,
        }
    if looks_like_accession(trimmed):
        return {
            "mode": "record_sample",
            "textTerm": None,
            "dimensions": [],
            "parsedIds": None,
            "displayToken": trimmed.strip(),
        }
    if looks_like_mrn(trimmed):
        return {
            "mode": "record_patient",
            "textTerm": None,
            "dimensions": [],
            "parsedIds": None,
            "displayToken": compact,
        }

    return {
        "mode": "text",
        "textTerm": trimmed,
        "dimensions": list(TEXT_SEARCH_DIMENSIONS),
        "parsedIds": None,
    }


def access_event_types_to_hide(
    *,
    scope: str,
    kinds: list[str] | None,
    include_access: bool,
) -> frozenset[str]:
    """Access/read events hidden on stream unless include_access or matching domain kind."""
    if include_access:
        return frozenset()
    if scope not in ("stream", "patient"):
        return frozenset()

    hidden = set(ACCESS_EVENT_TYPES)
    if scope == "patient":
        hidden.discard("patient.view")

    if kinds:
        roots = {key.split(":")[0] for key in kinds}
        if "patient" in roots:
            hidden.discard("patient.view")
        if "reporting" in roots:
            hidden.discard("reporting.download")

    return frozenset(hidden)


def _record_id_clauses(term: str) -> list:
    trimmed = term.strip()
    compact = compact_identifier(trimmed)
    clauses: list = []

    if looks_like_mnemonic(trimmed):
        code = trimmed.upper()
        clauses.append(
            exists().where(
                and_(OrderTest.testCode == code, AuditEvent.testId == OrderTest.id)
            )
        )
    elif looks_like_filler(trimmed):
        clauses.extend(
            [
                exists().where(
                    and_(Order.orderId == compact, AuditEvent.orderId == Order.orderId)
                ),
                exists().where(
                    and_(
                        Order.placerNumber == compact,
                        AuditEvent.orderId == Order.orderId,
                    )
                ),
            ]
        )
    elif looks_like_accession(trimmed):
        clauses.append(
            exists().where(
                and_(
                    Sample.sampleId == trimmed,
                    AuditEvent.targetType == "sample",
                    AuditEvent.targetId == Sample.sampleId,
                )
            )
        )
    elif looks_like_mrn(trimmed):
        clauses.extend(
            [
                exists().where(and_(Patient.id == compact, AuditEvent.patientId == Patient.id)),
                exists().where(
                    and_(
                        Patient.id == compact,
                        AuditEvent.targetType == "patient",
                        AuditEvent.targetId == Patient.id,
                    )
                ),
            ]
        )

    return clauses


def apply_unified_search(query, term: str, *, scope: str = "stream"):
    """Narrow query with OR match on clinical ids, patient name, actor name, or username."""
    trimmed = term.strip()
    if not trimmed:
        return query

    record_clauses = _record_id_clauses(trimmed)
    if record_clauses and scope != "system":
        return query.filter(or_(*record_clauses))

    pattern = f"%{trimmed}%"
    text_clauses = [
        AuditEvent.actorSnapshot["name"].astext.ilike(pattern),
        User.username.ilike(pattern),
        Patient.id.ilike(pattern),
        Order.orderId.ilike(pattern),
        Sample.sampleId.ilike(pattern),
    ]
    if scope != "system":
        text_clauses.append(Patient.fullName.ilike(pattern))

    return (
        query.outerjoin(User, User.id == AuditEvent.actorId)
        .outerjoin(Patient, Patient.id == AuditEvent.patientId)
        .outerjoin(Order, Order.orderId == AuditEvent.orderId)
        .outerjoin(Sample, Sample.sampleId == AuditEvent.targetId)
        .filter(or_(*text_clauses))
    )
