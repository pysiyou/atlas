"""Orderable catalog panel CRUD and seed-from-test-tags."""
from __future__ import annotations

import logging
import re

from app.domains.catalog.models.catalog_panel import CatalogPanel
from app.domains.catalog.models.catalog_test import CatalogTest
from app.domains.catalog.schemas.panel import CatalogPanelCreate, CatalogPanelUpdate
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


def _slug_panel_code(name: str) -> str:
    """Stable uppercase code from a panel display name."""
    slug = re.sub(r"[^A-Za-z0-9]+", "_", name.strip()).strip("_").upper()
    return slug[:50] or "PANEL"


class CatalogPanelService:
    """CRUD plus one-time invert of CatalogTest.panels taxonomy tags."""

    def __init__(self, db: Session):
        self.db = db

    def list_panels(self, *, active_only: bool = True) -> list[CatalogPanel]:
        query = self.db.query(CatalogPanel)
        if active_only:
            query = query.filter(CatalogPanel.isActive.is_(True))
        return query.order_by(CatalogPanel.name.asc()).all()

    def get_by_code(self, code: str) -> CatalogPanel:
        panel = self.db.query(CatalogPanel).filter(CatalogPanel.code == code).first()
        if not panel:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"CatalogPanel {code} not found",
            )
        return panel

    def create(self, data: CatalogPanelCreate) -> CatalogPanel:
        existing = self.db.query(CatalogPanel).filter(CatalogPanel.code == data.code).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"CatalogPanel with code {data.code} already exists",
            )
        self._assert_member_codes(data.memberTestCodes)
        panel = CatalogPanel(
            code=data.code,
            name=data.name,
            memberTestCodes=list(data.memberTestCodes),
            price=data.price,
            isActive=data.isActive,
        )
        self.db.add(panel)
        self.db.commit()
        self.db.refresh(panel)
        return panel

    def update(self, code: str, data: CatalogPanelUpdate) -> CatalogPanel:
        panel = self.get_by_code(code)
        payload = data.model_dump(exclude_unset=True)
        if "memberTestCodes" in payload and payload["memberTestCodes"] is not None:
            self._assert_member_codes(payload["memberTestCodes"])
        for key, value in payload.items():
            setattr(panel, key, value)
        self.db.commit()
        self.db.refresh(panel)
        return panel

    def seed_from_catalog_tests(self) -> int:
        """
        Invert CatalogTest.panels string tags into catalog_panels rows.

        Idempotent: existing panel codes are left unchanged. New tags get a row
        whose members are every active test listing that tag.
        """
        tests = self.db.query(CatalogTest).filter(CatalogTest.isActive.is_(True)).all()
        members_by_name: dict[str, list[str]] = {}
        for test in tests:
            tags = test.panels if isinstance(test.panels, list) else []
            for tag in tags:
                if not isinstance(tag, str) or not tag.strip():
                    continue
                name = tag.strip()
                members_by_name.setdefault(name, [])
                if test.code not in members_by_name[name]:
                    members_by_name[name].append(test.code)
        if not members_by_name:
            return 0

        existing_codes = {row.code for row in self.db.query(CatalogPanel.code).all()}
        created = 0
        for name, codes in members_by_name.items():
            code = _slug_panel_code(name)
            if code in existing_codes:
                continue
            self.db.add(
                CatalogPanel(
                    code=code,
                    name=name,
                    memberTestCodes=codes,
                    price=None,
                    isActive=True,
                )
            )
            existing_codes.add(code)
            created += 1
        if created:
            self.db.commit()
            logger.info("Seeded %s catalog panels from test taxonomy tags", created)
        return created

    def _assert_member_codes(self, codes: list[str]) -> None:
        found = {
            row.code
            for row in self.db.query(CatalogTest.code).filter(CatalogTest.code.in_(codes)).all()
        }
        missing = [code for code in codes if code not in found]
        if missing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown member test codes: {', '.join(missing)}",
            )
