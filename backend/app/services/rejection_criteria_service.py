"""
Validate rejection reasons against test-catalog rejection criteria.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.models.test import Test
from app.utils.exceptions import LabOperationError
from app.utils.specimen_reasons import infer_criterion_domain


@dataclass(frozen=True)
class RejectionCriterion:
    """Catalog rejection criterion with explicit routing domain."""

    reason: str
    domain: str  # specimen | analytical


class RejectionCriteriaService:
    """Loads and validates catalog-defined rejection criteria."""

    def __init__(self, db: Session):
        self.db = db

    @staticmethod
    def _normalize_criterion(raw: Any) -> RejectionCriterion:
        if isinstance(raw, dict):
            reason = str(raw.get("reason") or raw.get("label") or "").strip()
            domain = str(raw.get("domain", "specimen")).lower()
            if domain not in {"specimen", "analytical"}:
                domain = infer_criterion_domain(reason)
            return RejectionCriterion(reason=reason, domain=domain)
        reason = str(raw).strip()
        return RejectionCriterion(reason=reason, domain=infer_criterion_domain(reason))

    def get_criteria_items_for_test(self, test_code: str) -> list[RejectionCriterion]:
        test = self.db.query(Test).filter(Test.code == test_code).first()
        if not test or not test.rejectionCriteria:
            return []
        return [self._normalize_criterion(item) for item in test.rejectionCriteria]

    def get_criteria_for_test(self, test_code: str) -> list[str]:
        return [item.reason for item in self.get_criteria_items_for_test(test_code)]

    def get_criteria_for_tests(self, test_codes: list[str]) -> list[str]:
        """Union of rejection criteria across tests (stable order, deduplicated)."""
        seen: set[str] = set()
        criteria: list[str] = []
        for code in test_codes:
            for item in self.get_criteria_items_for_test(code):
                if item.reason not in seen:
                    seen.add(item.reason)
                    criteria.append(item.reason)
        return criteria

    def get_criterion_for_reason(
        self,
        test_codes: list[str],
        rejection_reason: str,
    ) -> Optional[RejectionCriterion]:
        for code in test_codes:
            for item in self.get_criteria_items_for_test(code):
                if item.reason == rejection_reason:
                    return item
        return None

    def has_specimen_criteria(self, test_codes: list[str]) -> bool:
        for code in test_codes:
            if any(item.domain == "specimen" for item in self.get_criteria_items_for_test(code)):
                return True
        return False

    def validate_for_test(self, test_code: str, rejection_reason: str) -> None:
        self.validate_for_tests([test_code], rejection_reason)

    def validate_for_tests(self, test_codes: list[str], rejection_reason: str) -> None:
        allowed = self.get_criteria_for_tests(test_codes)
        if not allowed:
            raise LabOperationError(
                "No rejection criteria defined for this test",
                status_code=400,
            )
        if rejection_reason not in allowed:
            raise LabOperationError(
                f"Invalid rejection reason. Must be one of: {', '.join(allowed)}",
                status_code=400,
            )
