"""Reflex testing engine — add linked tests after validation based on catalog rules."""
from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any

from app.domains.catalog.models import OrderableTest
from app.domains.lab.specimen.generation import generate_samples_for_order
from app.domains.orders.models import Order, OrderTest
from app.platform.utils import parse_numeric_result_value
from app.shared.contracts.enums import TestStatus
from sqlalchemy.orm import Session

# Catalog-level reflex rules keyed by triggering test code
REFLEX_RULES: dict[str, list[dict[str, Any]]] = {}


@dataclass
class ReflexTriggerResult:
    added_test_code: str
    rule_description: str
    order_test_id: int


class ReflexEngine:
    def __init__(self, db: Session):
        self.db = db

    def _load_rules(self, test_code: str, test_def: OrderableTest | None) -> list[dict[str, Any]]:
        return list(REFLEX_RULES.get(test_code, []))

    def _evaluate_rule(self, rule: dict[str, Any], results: dict[str, Any]) -> bool:
        analyte_code = rule.get("analyte_code") or rule.get("analyte") or rule.get("item")
        if not analyte_code or analyte_code not in results:
            return False
        value = parse_numeric_result_value(results[analyte_code])
        if value is None:
            return False
        threshold = rule.get("value")
        op = rule.get("operator", "gt")
        if threshold is None:
            return False
        if op == "gt":
            return value > threshold
        if op == "gte":
            return value >= threshold
        if op == "lt":
            return value < threshold
        if op == "lte":
            return value <= threshold
        if op == "eq":
            return value == threshold
        return False

    def evaluate_after_validation(
        self,
        order_test: OrderTest,
        user_id: str,
    ) -> list[ReflexTriggerResult]:
        if not order_test.results:
            return []

        order = self.db.query(Order).filter(Order.orderId == order_test.orderId).first()
        if not order:
            return []

        test_def = (
            self.db.query(OrderableTest).filter(OrderableTest.code == order_test.testCode).first()
        )
        rules = self._load_rules(order_test.testCode, test_def)
        if not rules:
            return []

        added: list[ReflexTriggerResult] = []
        existing_codes = {
            t.testCode
            for t in self.db.query(OrderTest).filter(OrderTest.orderId == order.orderId).all()
            if t.status not in (TestStatus.CANCELLED, TestStatus.REMOVED, TestStatus.SUPERSEDED)
        }

        for rule in rules:
            add_code = rule.get("addTest")
            if not add_code or add_code in existing_codes:
                continue
            if not self._evaluate_rule(rule, order_test.results):
                continue

            reflex_test_def = (
                self.db.query(OrderableTest)
                .filter(OrderableTest.code == add_code, OrderableTest.isActive.is_(True))
                .first()
            )
            if not reflex_test_def:
                continue

            new_ot = OrderTest(
                orderId=order.orderId,
                testCode=add_code,
                status=TestStatus.PENDING,
                priceAtOrder=reflex_test_def.price,
                isReflexTest=True,
                triggeredBy=order_test.testCode,
                reflexRule=rule.get("rule") or f"Reflex from {order_test.testCode}",
            )
            self.db.add(new_ot)
            self.db.flush()

            generate_samples_for_order(order.orderId, self.db, user_id)

            added.append(
                ReflexTriggerResult(
                    added_test_code=add_code,
                    rule_description=new_ot.reflexRule or "",
                    order_test_id=new_ot.id,
                )
            )
            existing_codes.add(add_code)

        return added
