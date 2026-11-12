"""Cross-domain lab API. Other domains import from here, not lab internals.

ORM models stay on `app.domains.lab.models.*` (registry / SQLAlchemy).
HTTP routers stay on `app.domains.lab.api`.
"""
from app.domains.lab.rules.order_test_lab_loader import (
    lab_projections_for_order,
    lab_projections_for_orders,
)
from app.domains.lab.rules.status_presentation import resolve_order_presentation
from app.domains.lab.rules.work_item_projection import LabWorkItemProjection
from app.domains.lab.specimen import generate_samples_for_order

__all__ = [
    "generate_samples_for_order",
    "lab_projections_for_order",
    "lab_projections_for_orders",
    "resolve_order_presentation",
    "LabWorkItemProjection",
]
