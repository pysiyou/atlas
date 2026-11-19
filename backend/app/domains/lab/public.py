"""Cross-domain lab API. Other domains import from here, not lab internals.

ORM models stay on each area’s `models.py`. HTTP routes on `app.domains.lab.api`.
"""
from __future__ import annotations

from app.domains.lab.rules.loader import lab_projections_for_order, lab_projections_for_orders
from app.domains.lab.rules.presentation import resolve_order_presentation
from app.domains.lab.rules.schemas import LabWorkItemProjection, LabWorklistAllowedActions
from app.domains.lab.specimen.generation import generate_samples_for_order

__all__ = [
    "generate_samples_for_order",
    "lab_projections_for_order",
    "lab_projections_for_orders",
    "resolve_order_presentation",
    "LabWorkItemProjection",
    "LabWorklistAllowedActions",
]
