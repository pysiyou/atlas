"""Shared SQL search predicates for orders and reportable-order lists."""
from app.domains.catalog.models.catalog_test import CatalogTest
from app.domains.orders.models import Order, OrderTest
from app.domains.patients.models import Patient
from app.platform.utils import compact_identifier, looks_like_filler, looks_like_mrn
from sqlalchemy import and_, exists, or_


def order_search_filter(search_term: str):
    """Match filler/placer numbers, MRN, or patient name."""
    term = search_term.strip()
    compact = compact_identifier(term)
    predicates = [
        Patient.fullName.ilike(f"%{term}%"),
        Order.orderId.ilike(f"%{term}%"),
        Order.placerNumber.ilike(f"%{term}%"),
        Patient.id.ilike(f"%{term}%"),
    ]
    if looks_like_filler(term):
        predicates.append(Order.orderId == compact)
        predicates.append(Order.placerNumber == compact)
    if looks_like_mrn(term):
        predicates.append(Patient.id == compact)
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
