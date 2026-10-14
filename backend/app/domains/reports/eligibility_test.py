"""Unit tests for per-order report eligibility (stdlib unittest)."""
import unittest
from types import SimpleNamespace

from app.domains.reports.eligibility import active_order_tests, is_reportable_order
from app.shared.contracts.enums import OrderStatus, TestStatus


def _test(status: TestStatus, test_id: int = 1) -> SimpleNamespace:
    return SimpleNamespace(status=status, id=test_id, testCode=f"T{test_id}")


def _order(status: OrderStatus, tests: list[SimpleNamespace]) -> SimpleNamespace:
    return SimpleNamespace(overallStatus=status, tests=tests)


class ReportEligibilityTest(unittest.TestCase):
    def test_cancelled_order_excluded(self) -> None:
        order = _order(OrderStatus.CANCELLED, [_test(TestStatus.VALIDATED)])
        self.assertFalse(is_reportable_order(order))

    def test_only_removed_tests_excluded(self) -> None:
        order = _order(
            OrderStatus.ORDERED,
            [_test(TestStatus.REMOVED), _test(TestStatus.SUPERSEDED, test_id=2)],
        )
        self.assertFalse(is_reportable_order(order))
        self.assertEqual(active_order_tests(order), [])

    def test_pending_active_tests_included(self) -> None:
        order = _order(OrderStatus.ORDERED, [_test(TestStatus.PENDING)])
        self.assertTrue(is_reportable_order(order))

    def test_multiple_validated_tests_single_order(self) -> None:
        order = _order(
            OrderStatus.COMPLETED,
            [
                _test(TestStatus.VALIDATED, test_id=1),
                _test(TestStatus.VALIDATED, test_id=2),
                _test(TestStatus.REMOVED, test_id=3),
            ],
        )
        self.assertTrue(is_reportable_order(order))
        active = active_order_tests(order)
        self.assertEqual(len(active), 2)
        self.assertEqual([t.id for t in active], [1, 2])

    def test_mixed_pending_and_validated_included(self) -> None:
        order = _order(
            OrderStatus.RUNNING,
            [_test(TestStatus.PENDING), _test(TestStatus.VALIDATED, test_id=2)],
        )
        self.assertTrue(is_reportable_order(order))
        self.assertEqual(len(active_order_tests(order)), 2)


if __name__ == "__main__":
    unittest.main()
