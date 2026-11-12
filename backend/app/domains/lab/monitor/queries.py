"""Shared SQL join skeletons for lab board snapshots and worklists."""

from app.domains.catalog.models.catalog_test import CatalogTest
from app.domains.lab.models.sample import Sample
from app.domains.orders.models import Order, OrderTest
from app.domains.patients.models import Patient
from sqlalchemy.orm import Session


def collection_base_query(db: Session):
    """Sample + order + patient join used by collection board rows and worklists."""
    return (
        db.query(Sample, Order, Patient)
        .join(Order, Sample.orderId == Order.orderId)
        .join(Patient, Order.patientId == Patient.id)
    )


def order_test_stage_query(db: Session, *, include_sample: bool = True):
    """OrderTest + order + patient + catalog [+ sample] join used by stage lists.

    Entity order is part of the public contract for row unpacking:
    ``(OrderTest, Order, Patient, CatalogTest[, Sample])``.
    """
    if include_sample:
        return (
            db.query(OrderTest, Order, Patient, CatalogTest, Sample)
            .join(Order, OrderTest.orderId == Order.orderId)
            .join(Patient, Order.patientId == Patient.id)
            .join(CatalogTest, OrderTest.testCode == CatalogTest.code)
            .outerjoin(Sample, Sample.sampleId == OrderTest.sampleId)
        )
    return (
        db.query(OrderTest, Order, Patient, CatalogTest)
        .join(Order, OrderTest.orderId == Order.orderId)
        .join(Patient, Order.patientId == Patient.id)
        .join(CatalogTest, OrderTest.testCode == CatalogTest.code)
    )
