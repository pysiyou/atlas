"""Unit tests for reportable-order list search SQL (stdlib unittest)."""
import unittest

from app.domains.orders.search import order_search_filter, reportable_order_search_filter


def _compiled(clause) -> str:
    return str(clause.compile(compile_kwargs={"literal_binds": True})).lower()


class ReportableOrderSearchTest(unittest.TestCase):
    def test_order_search_matches_patient_name_and_ids(self) -> None:
        sql = _compiled(order_search_filter("Ada"))
        self.assertIn("full_name", sql)
        digit_sql = _compiled(order_search_filter("12"))
        self.assertIn("order_id", digit_sql)
        self.assertIn("patient_id", digit_sql)

    def test_reportable_search_includes_test_code_and_catalog_name(self) -> None:
        sql = _compiled(reportable_order_search_filter("CBC"))
        self.assertIn("test_code", sql)
        self.assertIn("display_name", sql)
        self.assertIn("full_name", sql)

    def test_display_id_ord_predicate(self) -> None:
        sql = _compiled(order_search_filter("ORD42"))
        self.assertIn("order_id", sql)


if __name__ == "__main__":
    unittest.main()
