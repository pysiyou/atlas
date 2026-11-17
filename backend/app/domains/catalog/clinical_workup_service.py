"""Clinical workup catalog API logic."""
from __future__ import annotations

from app.domains.catalog.models.clinical_workup import ClinicalWorkup
from app.domains.catalog.models.clinical_workup_test import ClinicalWorkupTest
from app.domains.catalog.schemas.clinical_workup import ClinicalWorkupResponse
from sqlalchemy.orm import Session, selectinload


class ClinicalWorkupService:
    def __init__(self, db: Session):
        self.db = db

    def list_workups(self, *, active_only: bool = True) -> list[dict]:
        query = self.db.query(ClinicalWorkup).options(selectinload(ClinicalWorkup.testLinks))
        if active_only:
            query = query.filter(ClinicalWorkup.isActive.is_(True))
        rows = query.order_by(ClinicalWorkup.name.asc()).all()
        return [self._serialize(row) for row in rows]

    def _serialize(self, row: ClinicalWorkup) -> dict:
        test_codes = [
            link.testCode
            for link in sorted(row.testLinks or [], key=lambda link: link.testCode)
        ]
        payload = ClinicalWorkupResponse.model_validate(row).model_dump(mode="json")
        payload["testCodes"] = test_codes
        return payload