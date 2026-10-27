"""Pure eligibility rules for per-order lab reports."""
from collections.abc import Iterable
from typing import Protocol

from app.shared.contracts.enums import OrderStatus, TestStatus

# Align with order list aggregates (orders/service.py _INACTIVE_TEST_STATUSES).
INACTIVE_TEST_STATUSES = frozenset(
    {TestStatus.SUPERSEDED, TestStatus.REMOVED, TestStatus.CANCELLED}
)


class _OrderTestLike(Protocol):
    status: TestStatus
    testCode: str


class _OrderLike(Protocol):
    overallStatus: OrderStatus
    tests: Iterable[_OrderTestLike] | None


def is_active_test(status: TestStatus) -> bool:
    """Active tests exclude removed and superseded lines (same as order status rollup)."""
    return status not in INACTIVE_TEST_STATUSES


def active_order_tests(order: _OrderLike) -> list[_OrderTestLike]:
    """Return active tests on an order, preserving input order."""
    tests = list(order.tests or [])
    return [test for test in tests if is_active_test(test.status)]


def is_reportable_order(order: _OrderLike) -> bool:
    """Non-cancelled orders with at least one active test appear in Reports."""
    if order.overallStatus == OrderStatus.CANCELLED:
        return False
    return len(active_order_tests(order)) > 0
