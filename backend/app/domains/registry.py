"""
Import all ORM models so SQLAlchemy metadata is complete for create_all / bootstrap.
"""
from app.domains.audit.models import AuditEvent
from app.domains.billing.models import InsuranceClaim, Invoice, Payment
from app.domains.catalog.models.affiliation_pricing import AffiliationPricing
from app.domains.catalog.models.catalog_test import CatalogTest
from app.domains.lab.models.analyzer_ingest_dedup import AnalyzerIngestDedup
from app.domains.lab.models.escalation import EscalationTicket
from app.domains.lab.models.quality_issue import QualityIssue
from app.domains.lab.models.recollection_request import RecollectionRequest
from app.domains.lab.models.sample import Sample
from app.domains.orders.models import Order, OrderTest
from app.domains.patients.models import Patient
from app.domains.users.models import User

__all__ = [
    "User",
    "Patient",
    "CatalogTest",
    "Order",
    "OrderTest",
    "Sample",
    "Invoice",
    "Payment",
    "InsuranceClaim",
    "AuditEvent",
    "EscalationTicket",
    "QualityIssue",
    "RecollectionRequest",
    "AffiliationPricing",
    "AnalyzerIngestDedup",
]
