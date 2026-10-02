"""Unified audit event log search — entity display ids, numeric ids, names."""
from __future__ import annotations

import re

from app.domains.audit.kinds import ACCESS_EVENT_TYPES
from app.domains.audit.models import AuditEvent
from app.domains.patients.models import Patient
from app.domains.users.models import User
from app.platform.utils.common import parse_display_id_from_search
from sqlalchemy import String, and_, cast, or_


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


def _entity_id_clauses(term: str) -> list:
    compact = re.sub(r"[\s-]", "", term.strip())
    upper = compact.upper()
    clauses: list = []

    if upper.startswith("TST"):
        test_id = parse_display_id_from_search(term, "TST")
        if test_id is not None:
            clauses.extend(
                [
                    AuditEvent.testId == test_id,
                    and_(
                        AuditEvent.targetType == "order_test",
                        AuditEvent.targetId == test_id,
                    ),
                ]
            )
    elif upper.startswith("ORD"):
        order_id = parse_display_id_from_search(term, "ORD")
        if order_id is not None:
            clauses.extend(
                [
                    AuditEvent.orderId == order_id,
                    and_(
                        AuditEvent.targetType == "order",
                        AuditEvent.targetId == order_id,
                    ),
                ]
            )
    elif upper.startswith("SAM"):
        sample_id = parse_display_id_from_search(term, "SAM")
        if sample_id is not None:
            clauses.append(
                and_(
                    AuditEvent.targetType == "sample",
                    AuditEvent.targetId == sample_id,
                )
            )
    elif upper.startswith("PAT"):
        patient_id = parse_display_id_from_search(term, "PAT")
        if patient_id is not None:
            clauses.extend(
                [
                    AuditEvent.patientId == patient_id,
                    and_(
                        AuditEvent.targetType == "patient",
                        AuditEvent.targetId == patient_id,
                    ),
                ]
            )
    elif compact.isdigit():
        numeric = int(compact)
        clauses.extend(
            [
                AuditEvent.orderId == numeric,
                AuditEvent.patientId == numeric,
                AuditEvent.testId == numeric,
                cast(AuditEvent.targetId, String).like(f"%{compact}%"),
            ]
        )

    return clauses


def apply_unified_search(query, term: str, *, scope: str = "stream"):
    """Narrow query with OR match on entity ids, patient name, actor name, or username."""
    trimmed = term.strip()
    if not trimmed:
        return query

    entity_clauses = _entity_id_clauses(trimmed)
    if entity_clauses and scope != "system":
        return query.filter(or_(*entity_clauses))

    pattern = f"%{trimmed}%"
    text_clauses = [
        AuditEvent.actorSnapshot["name"].astext.ilike(pattern),
        User.username.ilike(pattern),
    ]
    if scope != "system":
        text_clauses.append(Patient.fullName.ilike(pattern))

    return (
        query.outerjoin(User, User.id == AuditEvent.actorId)
        .outerjoin(Patient, Patient.id == AuditEvent.patientId)
        .filter(or_(*text_clauses))
    )
