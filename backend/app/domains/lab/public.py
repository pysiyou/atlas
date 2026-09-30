"""Narrow public API for other domains (e.g. order creation)."""
from app.domains.lab.specimen import generate_samples_for_order

__all__ = ["generate_samples_for_order"]
