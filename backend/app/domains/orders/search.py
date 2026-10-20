"""Shared SQL search predicates for orders and reportable-order lists."""
from app.domains.catalog.models.catalog_test import CatalogTest
from app.domains.orders.models import Order, OrderTest
from app.domains.patients.models import Patient
from app.platform.utils.common import parse_display_id_from_search
from sqlalchemy import String, and_, cast, exists, or_


def order_search_filter(search_term: str):
    """Match order id, patient id, display ids, or patient name."""
    term = search_term.strip()
    compact = term.replace(" ", "").replace("-", "")
    predicates = [Patient.fullName.ilike(f"%{term}%")]
    order_id = parse_display_id_from_search(term, "ORD")
    patient_id = parse_display_id_from_search(term, "PAT")
    if order_id is not None:
        predicates.append(Order.orderId == order_id)
    if patient_id is not None:
        predicates.append(Order.patientId == patient_id)
    if compact.isdigit():
        predicates.append(cast(Order.orderId, String).ilike(f"%{compact}%"))
        predicates.append(cast(Order.patientId, String).ilike(f"%{compact}%"))
    return or_(*predicates)


def reportable_order_search_filter(search_term: str):
    """Order/patient search plus test code and catalog names (EXISTS, no relationship load)."""
    term = search_term.strip()
    catalog_name_match = exists().where(
        and_(
            CatalogTest.code == OrderTest.testCode,
            or_(
                CatalogTest.displayName.ilike(f"%{term}%"),
                CatalogTest.name.ilike(f"%{term}%"),
            ),
        )
    )
    test_match = exists().where(
        and_(
            OrderTest.orderId == Order.orderId,
            or_(OrderTest.testCode.ilike(f"%{term}%"), catalog_name_match),
        )
    )
    return or_(order_search_filter(term), test_match)
