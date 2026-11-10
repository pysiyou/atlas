"""Retest lineage queries for quality-issue limits and option previews."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.domains.lab.models.quality_issue import QualityIssue
from app.domains.orders.models import OrderTest
from app.shared.contracts.enums import RemedyType


def chain_root_test(db: Session, test: OrderTest) -> OrderTest:
    """Walk retestOfTestId links to the root order-test row in the chain."""
    current = test
    while current.retestOfTestId:
        parent = db.query(OrderTest).filter(OrderTest.id == current.retestOfTestId).first()
        if not parent:
            break
        current = parent
    return current


def collect_chain_test_ids(db: Session, order_test: OrderTest) -> set[int]:
    """All order-test row IDs in the retest chain (root through active successor)."""
    root = chain_root_test(db, order_test)
    chain_ids: set[int] = {root.id}
    current = root
    while current.retestOrderTestId:
        child = db.query(OrderTest).filter(OrderTest.id == current.retestOrderTestId).first()
        if not child:
            break
        chain_ids.add(child.id)
        current = child
    return chain_ids


def count_retests_in_chain(db: Session, order_test: OrderTest) -> int:
    """Count prior RETRY_SAME_SAMPLE quality issues across the retest chain."""
    chain_ids = collect_chain_test_ids(db, order_test)
    return (
        db.query(QualityIssue)
        .filter(
            QualityIssue.orderTestId.in_(chain_ids),
            QualityIssue.remedy == RemedyType.RETRY_SAME_SAMPLE,
        )
        .count()
    )
