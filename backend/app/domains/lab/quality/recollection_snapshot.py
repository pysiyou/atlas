"""Shared recollection-approval blocking snapshot for board and dashboard-today."""
from __future__ import annotations

from app.domains.lab.models.recollection_request import RecollectionRequest
from app.shared.contracts.enums import RecollectionRequestStatus
from sqlalchemy.orm import Session


def recollection_blocked_order_test_ids(db: Session) -> set[int]:
    """Order test IDs blocked while a recollection request awaits supervisor approval."""
    requests = (
        db.query(RecollectionRequest)
        .filter(RecollectionRequest.status == RecollectionRequestStatus.PENDING_APPROVAL)
        .all()
    )
    blocked: set[int] = set()
    for request in requests:
        for test_id in request.affectedOrderTestIds or []:
            if isinstance(test_id, int):
                blocked.add(test_id)
        if request.orderTestId is not None:
            blocked.add(int(request.orderTestId))
    return blocked
