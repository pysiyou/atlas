from __future__ import annotations

"""Cross-domain lab API. Other domains import from here, not lab internals.

ORM models stay on each area’s `models.py`. HTTP routes on `app.domains.lab.api`.
HTTP routers stay on `app.domains.lab.api`.
"""
from app.domains.lab.rules.service import (
    LabWorkItemProjection,
    lab_projections_for_order,
    lab_projections_for_orders,
    resolve_order_presentation,
)
from app.domains.lab.specimen.service import generate_samples_for_order

__all__ = [
    "generate_samples_for_order",
    "lab_projections_for_order",
    "lab_projections_for_orders",
    "resolve_order_presentation",
    "LabWorkItemProjection",
]
