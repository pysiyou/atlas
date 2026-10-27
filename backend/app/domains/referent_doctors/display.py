"""Shared helpers for referent doctor fields on API projections."""
from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.domains.orders.models import Order


def referent_doctor_projection(order: Order | None) -> dict[str, int | str | None]:
    if order is None:
        return {
            "referentDoctorId": None,
            "referentDoctorName": None,
            "referentDoctorEmail": None,
            "referentDoctorPhone": None,
            "referentDoctorHospital": None,
            "referentDoctorUsername": None,
        }
    record = order.referentDoctor
    return {
        "referentDoctorId": order.referentDoctorId,
        "referentDoctorName": record.fullName if record else None,
        "referentDoctorEmail": record.email if record else None,
        "referentDoctorPhone": record.phone if record else None,
        "referentDoctorHospital": record.hospitalName if record else None,
        "referentDoctorUsername": record.username if record else None,
    }
