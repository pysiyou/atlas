"""
Validate rejection reasons against test-catalog rejection criteria.
"""
from sqlalchemy.orm import Session

from app.models.test import Test
from app.utils.exceptions import LabOperationError


class RejectionCriteriaService:
    """Loads and validates catalog-defined rejection criteria."""

    def __init__(self, db: Session):
        self.db = db

    def get_criteria_for_test(self, test_code: str) -> list[str]:
        test = self.db.query(Test).filter(Test.code == test_code).first()
        if not test or not test.rejectionCriteria:
            return []
        return list(test.rejectionCriteria)

    def get_criteria_for_tests(self, test_codes: list[str]) -> list[str]:
        """Union of rejection criteria across tests (stable order, deduplicated)."""
        seen: set[str] = set()
        criteria: list[str] = []
        for code in test_codes:
            for item in self.get_criteria_for_test(code):
                if item not in seen:
                    seen.add(item)
                    criteria.append(item)
        return criteria

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
