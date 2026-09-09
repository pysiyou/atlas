"""
Validate rejection reasons against test-catalog rejection criteria.

Collection (sample) and validation (result review) use separate criterion lists.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal, Optional

from sqlalchemy.orm import Session

from app.models.test import Test
from app.utils.exceptions import LabOperationError
from app.utils.specimen_reasons import infer_criterion_domain

QualityContext = Literal["sample", "validation"]


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
            domain = str(raw.get("domain") or infer_criterion_domain(reason)).lower()
            if domain not in {"specimen", "analytical"}:
                domain = infer_criterion_domain(reason)
            return RejectionCriterion(reason=reason, domain=domain)
        reason = str(raw).strip()
        return RejectionCriterion(reason=reason, domain=infer_criterion_domain(reason))

    def _get_test(self, test_code: str) -> Optional[Test]:
        return self.db.query(Test).filter(Test.code == test_code).first()

    def get_specimen_criteria_items_for_test(self, test_code: str) -> list[RejectionCriterion]:
        test = self._get_test(test_code)
        if not test or not test.rejectionCriteria:
            return []
        return [self._normalize_criterion(item) for item in test.rejectionCriteria]

    def get_validation_criteria_items_for_test(self, test_code: str) -> list[RejectionCriterion]:
        test = self._get_test(test_code)
        if not test:
            return []
        raw = test.validationRejectionCriteria
        if not raw:
            # Legacy fallback: merged list stored only in rejectionCriteria
            raw = test.rejectionCriteria or []
        return [self._normalize_criterion(item) for item in raw]

    def _items_for_context(self, test_code: str, context: QualityContext) -> list[RejectionCriterion]:
        if context == "sample":
            return self.get_specimen_criteria_items_for_test(test_code)
        return self.get_validation_criteria_items_for_test(test_code)

    def get_specimen_criteria_for_test(self, test_code: str) -> list[str]:
        return [item.reason for item in self.get_specimen_criteria_items_for_test(test_code)]

    def get_validation_criteria_for_test(self, test_code: str) -> list[str]:
        return [item.reason for item in self.get_validation_criteria_items_for_test(test_code)]

    def get_specimen_criteria_for_tests(self, test_codes: list[str]) -> list[str]:
        seen: set[str] = set()
        criteria: list[str] = []
        for code in test_codes:
            for item in self.get_specimen_criteria_items_for_test(code):
                if item.reason not in seen:
                    seen.add(item.reason)
                    criteria.append(item.reason)
        return criteria

    def get_criteria_for_test(self, test_code: str) -> list[str]:
        """Backward-compatible alias — returns validation criteria."""
        return self.get_validation_criteria_for_test(test_code)

    def get_criteria_for_tests(self, test_codes: list[str]) -> list[str]:
        """Backward-compatible alias — returns specimen criteria union."""
        return self.get_specimen_criteria_for_tests(test_codes)

    def get_criterion_for_reason(
        self,
        test_codes: list[str],
        rejection_reason: str,
        *,
        context: QualityContext = "validation",
    ) -> Optional[RejectionCriterion]:
        for code in test_codes:
            for item in self._items_for_context(code, context):
                if item.reason == rejection_reason:
                    return item
        return None

    def has_specimen_criteria(self, test_codes: list[str], *, context: QualityContext = "validation") -> bool:
        for code in test_codes:
            if any(item.domain == "specimen" for item in self._items_for_context(code, context)):
                return True
        return False

    def validate_for_test(
        self,
        test_code: str,
        rejection_reason: str,
        *,
        context: QualityContext = "validation",
    ) -> None:
        self.validate_for_tests([test_code], rejection_reason, context=context)

    def validate_for_tests(
        self,
        test_codes: list[str],
        rejection_reason: str,
        *,
        context: QualityContext = "validation",
    ) -> None:
        if context == "sample":
            allowed = self.get_specimen_criteria_for_tests(test_codes)
        else:
            seen: set[str] = set()
            allowed = []
            for code in test_codes:
                for reason in self.get_validation_criteria_for_test(code):
                    if reason not in seen:
                        seen.add(reason)
                        allowed.append(reason)

        if not allowed:
            label = "collection" if context == "sample" else "result review"
            raise LabOperationError(
                f"No rejection criteria defined for {label}",
                status_code=400,
            )
        if rejection_reason not in allowed:
            raise LabOperationError(
                f"Invalid rejection reason. Must be one of: {', '.join(allowed)}",
                status_code=400,
            )
