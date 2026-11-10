"""Batch queries for escalation tickets."""

from __future__ import annotations

from collections.abc import Iterable

from app.domains.lab.models.escalation import EscalationTicket
from app.shared.contracts.enums import EscalationTicketStatus
from sqlalchemy.orm import Session


def load_open_tickets_by_order_test_id(
    db: Session,
    order_test_ids: Iterable[int],
) -> dict[int, EscalationTicket]:
    """Return open escalation tickets keyed by order test id.

    When multiple open tickets exist for one test (unexpected), the last row wins.
    """
    ids = list(order_test_ids)
    if not ids:
        return {}
    tickets_by_test: dict[int, EscalationTicket] = {}
    for ticket in (
        db.query(EscalationTicket)
        .filter(
            EscalationTicket.orderTestId.in_(ids),
            EscalationTicket.status == EscalationTicketStatus.OPEN,
        )
        .all()
    ):
        tickets_by_test[ticket.orderTestId] = ticket
    return tickets_by_test


def open_escalation_reason_codes_by_order_test_id(
    db: Session,
    order_test_ids: Iterable[int],
) -> dict[int, str | None]:
    """Map order test ids to open ticket reason codes (enum value strings)."""
    tickets = load_open_tickets_by_order_test_id(db, order_test_ids)
    out: dict[int, str | None] = {}
    for order_test_id, ticket in tickets.items():
        code = ticket.reasonCode
        out[order_test_id] = code.value if code is not None and hasattr(code, "value") else None
    return out
