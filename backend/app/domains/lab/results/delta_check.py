"""Delta check — compare current result to patient's last validated value for same analyte."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from app.domains.orders.models import Order, OrderTest
from app.platform.utils.common import parse_numeric_result_value
from app.shared.contracts.enums import TestStatus
from sqlalchemy.orm import Session

DEFAULT_DELTA_PERCENT = 20.0


@dataclass
class DeltaCheckWarning:
    item_code: str
    current_value: float
    prior_value: float
    percent_change: float
    prior_order_test_id: int
    prior_validated_at: str


class DeltaCheckService:
    def __init__(self, db: Session):
        self.db = db

    def check_results(
        self,
        patient_id: int,
        test_code: str,
        results: dict[str, Any],
        exclude_order_test_id: int | None = None,
        delta_percent: float = DEFAULT_DELTA_PERCENT,
    ) -> list[DeltaCheckWarning]:
        warnings: list[DeltaCheckWarning] = []
        prior_tests = (
            self.db.query(OrderTest, Order)
            .join(Order, OrderTest.orderId == Order.orderId)
            .filter(
                Order.patientId == patient_id,
                OrderTest.testCode == test_code,
                OrderTest.status == TestStatus.VALIDATED,
                OrderTest.results.isnot(None),
            )
            .order_by(OrderTest.resultValidatedAt.desc())
            .limit(5)
            .all()
        )

        prior_results: dict[str, float] = {}
        prior_meta: dict[str, tuple] = {}
        for ot, _order in prior_tests:
            if exclude_order_test_id and ot.id == exclude_order_test_id:
                continue
            if not ot.results:
                continue
            for code, value in ot.results.items():
                if code in prior_results:
                    continue
                numeric = parse_numeric_result_value(value)
                if numeric is not None:
                    prior_results[code] = numeric
                    prior_meta[code] = (
                        ot.id,
                        ot.resultValidatedAt.isoformat() if ot.resultValidatedAt else "",
                    )

        for item_code, value in results.items():
            current = parse_numeric_result_value(value)
            prior = prior_results.get(item_code)
            if current is None or prior is None or prior == 0:
                continue
            pct = abs((current - prior) / prior) * 100.0
            if pct >= delta_percent:
                meta = prior_meta[item_code]
                warnings.append(
                    DeltaCheckWarning(
                        item_code=item_code,
                        current_value=current,
                        prior_value=prior,
                        percent_change=round(pct, 1),
                        prior_order_test_id=meta[0],
                        prior_validated_at=meta[1],
                    )
                )
        return warnings
