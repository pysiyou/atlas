"""
Import all ORM models so SQLAlchemy metadata is complete for create_all / bootstrap.
"""
from app.domains.audit.models import AuditEvent
from app.domains.billing.models import Invoice, Payment
from app.domains.catalog.models import (
    AffiliationPricing,
    CatalogAnalyte,
    Workup,
    WorkupTest,
    OrderableTest,
    OrderableTestAnalyte,
)
from app.shared.identifiers import IdSequence
from app.domains.lab.models.analyzer_ingest_dedup import AnalyzerIngestDedup
from app.domains.lab.models.escalation import EscalationTicket
from app.domains.lab.models.quality_issue import QualityIssue
from app.domains.lab.models.sample import Sample
from app.domains.orders.models import Order, OrderTest
from app.domains.patients.models import Patient
from app.domains.referent_doctors.models import ReferentDoctor
from app.domains.reports.models import ReportDocument
from app.domains.users.models import User

__all__ = [
    "User",
    "Patient",
    "OrderableTest",
    "CatalogAnalyte",
    "OrderableTestAnalyte",
    "Workup",
    "WorkupTest",
    "IdSequence",
    "ReportDocument",
    "Order",
    "OrderTest",
    "Sample",
    "Invoice",
    "Payment",
    "AuditEvent",
    "EscalationTicket",
    "QualityIssue",
    "AffiliationPricing",
    "AnalyzerIngestDedup",
    "ReferentDoctor",
]