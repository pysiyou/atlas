"""Smoke tests for newly extracted domain services."""
import unittest
from unittest.mock import MagicMock, patch

from app.services.audit.logger import AuditService
from app.services.audit.query import AuditQueryService
from app.services.catalog.affiliation import AffiliationService
from app.services.catalog.test import TestService
from app.services.lab.critical_values import CriticalNotificationService
from app.services.orders.payment import PaymentService, enrich_payment
from app.services.timeline.formatter import TimelineFormatter
from app.services.users.user import UserService


class TestExtractedServices(unittest.TestCase):
    def test_payment_enrich_without_order(self):
        payment = MagicMock()
        payment.paymentId = 1
        payment.orderId = 10
        payment.invoiceId = None
        payment.amount = 50.0
        payment.paymentMethod = "cash"
        payment.paidAt = None
        payment.receivedBy = "1"
        payment.receiptGenerated = False
        payment.notes = ""
        result = enrich_payment(payment, None)
        self.assertEqual(result["paymentId"], 1)
        self.assertIsNone(result["orderTotalPrice"])

    def test_audit_service_has_log_operation(self):
        db = MagicMock()
        svc = AuditService(db)
        self.assertTrue(hasattr(svc, "log_operation"))
        self.assertTrue(hasattr(svc, "log_sample_collection"))

    def test_audit_query_service_instantiates(self):
        db = MagicMock()
        svc = AuditQueryService(db)
        self.assertIsNotNone(svc)

    def test_timeline_formatter_performer_name_system(self):
        db = MagicMock()
        formatter = TimelineFormatter(db)
        log = MagicMock(performedBy="system")
        self.assertEqual(formatter.performer_name(log, {}), "System")

    def test_user_service_instantiates(self):
        db = MagicMock()
        self.assertIsNotNone(UserService(db))

    def test_test_service_instantiates(self):
        db = MagicMock()
        self.assertIsNotNone(TestService(db))

    def test_affiliation_service_instantiates(self):
        db = MagicMock()
        self.assertIsNotNone(AffiliationService(db))

    def test_critical_notification_list_pending_empty(self):
        db = MagicMock()
        db.query.return_value.filter.return_value.all.return_value = []
        svc = CriticalNotificationService(db)
        self.assertEqual(svc.list_pending(), [])

    def test_payment_service_list_payments_empty(self):
        db = MagicMock()
        chain = db.query.return_value.options.return_value
        chain.order_by.return_value.offset.return_value.limit.return_value.all.return_value = []
        svc = PaymentService(db)
        self.assertEqual(svc.list_payments(0, 10), [])


if __name__ == "__main__":
    unittest.main()
