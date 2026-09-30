"""Aggregates all v1 domain API routers."""
from app.domains.audit.api import router as audit_router
from app.domains.auth.api import router as auth_router
from app.domains.billing.api import router as billing_router
from app.domains.catalog.api.affiliations import router as affiliations_router
from app.domains.catalog.api.tests import router as tests_router
from app.domains.dashboard.api import router as dashboard_router
from app.domains.lab.api.router import router as lab_router
from app.domains.orders.api import router as orders_router
from app.domains.patients.api import router as patients_router
from app.domains.payments.api import router as payments_router
from app.domains.reports.api import router as reports_router
from app.domains.users.api import router as users_router
from fastapi import APIRouter


def build_v1_router() -> APIRouter:
    root = APIRouter()
    root.include_router(auth_router)
    root.include_router(audit_router)
    root.include_router(patients_router, tags=["patients"])
    root.include_router(tests_router, tags=["tests"])
    root.include_router(orders_router, tags=["orders"])
    root.include_router(users_router, tags=["users"])
    root.include_router(payments_router, tags=["payments"])
    root.include_router(affiliations_router, tags=["affiliations"])
    root.include_router(lab_router)
    root.include_router(billing_router)
    root.include_router(dashboard_router)
    root.include_router(reports_router)
    return root
