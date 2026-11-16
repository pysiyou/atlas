"""Orderable catalog panels — contract registry plus membership from test catalog."""
from __future__ import annotations

import json
import logging
from pathlib import Path

from app.domains.catalog.models.catalog_panel import CatalogPanel
from app.domains.catalog.models.catalog_test import CatalogTest
from app.shared.contracts.orderable_panels import ORDERABLE_PANEL_BY_ID, ORDERABLE_PANEL_IDS
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


def _repo_root() -> Path:
    """Atlas repo root (parent of backend/)."""
    return Path(__file__).resolve().parents[4]


def _load_panel_membership_from_contract() -> dict[str, list[str]]:
    """
    Build panel id → member test codes from contracts/catalog/test-catalog.json.

    Tests reference panels by registry id only; typos fail validation in CI.
    """
    catalog_path = _repo_root() / "contracts" / "catalog" / "test-catalog.json"
    if not catalog_path.is_file():
        logger.warning("test-catalog.json not found; skipping panel membership load")
        return {}

    payload = json.loads(catalog_path.read_text(encoding="utf-8"))
    members_by_id: dict[str, list[str]] = {}
    for entry in payload.get("tests") or []:
        if not isinstance(entry, dict):
            continue
        test_code = entry.get("test_code")
        if not isinstance(test_code, str) or not test_code.strip():
            continue
        panel_ids = entry.get("panels") or []
        if not isinstance(panel_ids, list):
            continue
        for raw in panel_ids:
            if not isinstance(raw, str) or not raw.strip():
                continue
            panel_id = raw.strip()
            if panel_id not in ORDERABLE_PANEL_IDS:
                logger.warning("test %s references unknown panel id %s", test_code, panel_id)
                continue
            members_by_id.setdefault(panel_id, [])
            if test_code not in members_by_id[panel_id]:
                members_by_id[panel_id].append(test_code)
    return members_by_id


class CatalogPanelService:
    """List orderable panels and sync DB rows from the contract registry."""

    def __init__(self, db: Session):
        self.db = db

    def list_panels(self, *, active_only: bool = True) -> list[CatalogPanel]:
        query = self.db.query(CatalogPanel)
        if active_only:
            query = query.filter(CatalogPanel.isActive.is_(True))
        return query.order_by(CatalogPanel.name.asc()).all()

    def sync_test_panel_ids_from_contract(self) -> int:
        """Copy panel id arrays from test-catalog.json onto matching catalog test rows."""
        catalog_path = _repo_root() / "contracts" / "catalog" / "test-catalog.json"
        if not catalog_path.is_file():
            return 0

        payload = json.loads(catalog_path.read_text(encoding="utf-8"))
        panel_ids_by_test: dict[str, list[str]] = {}
        for entry in payload.get("tests") or []:
            if not isinstance(entry, dict):
                continue
            test_code = entry.get("test_code")
            panels = entry.get("panels")
            if not isinstance(test_code, str) or not isinstance(panels, list):
                continue
            panel_ids_by_test[test_code] = [p for p in panels if isinstance(p, str) and p.strip()]

        updated = 0
        for row in self.db.query(CatalogTest).filter(CatalogTest.code.in_(panel_ids_by_test.keys())).all():
            desired = panel_ids_by_test.get(row.code, [])
            if row.panels != desired:
                row.panels = desired
                updated += 1
        if updated:
            self.db.commit()
            logger.info("Synced panel ids onto %s catalog tests from contract", updated)
        return updated

    def seed_from_catalog_tests(self) -> int:
        """
        Upsert catalog_panels from the registry and test-catalog membership.

        Panel ``code`` is the registry mnemonic (e.g. ``HEP``).
        """
        members_by_id = _load_panel_membership_from_contract()
        if not members_by_id:
            return 0

        existing = {
            row.code: row for row in self.db.query(CatalogPanel).all()
        }
        touched = 0
        for panel_id, member_codes in members_by_id.items():
            definition = ORDERABLE_PANEL_BY_ID.get(panel_id)
            if not definition:
                continue
            row = existing.get(panel_id)
            if row is None:
                self.db.add(
                    CatalogPanel(
                        code=panel_id,
                        name=definition.name,
                        description=definition.description or None,
                        memberTestCodes=member_codes,
                        price=None,
                        isActive=True,
                    )
                )
                touched += 1
                continue
            changed = False
            if row.name != definition.name:
                row.name = definition.name
                changed = True
            desc = definition.description or None
            if row.description != desc:
                row.description = desc
                changed = True
            if row.memberTestCodes != member_codes:
                row.memberTestCodes = member_codes
                changed = True
            if changed:
                touched += 1

        legacy_codes = [code for code in existing if code not in ORDERABLE_PANEL_IDS]
        if legacy_codes:
            self.db.query(CatalogPanel).filter(CatalogPanel.code.in_(legacy_codes)).delete(
                synchronize_session=False
            )
            touched += len(legacy_codes)
            logger.info("Removed %s legacy slug catalog panels", len(legacy_codes))

        if touched:
            self.db.commit()
            logger.info("Synced %s orderable catalog panels from contract", touched)
        return touched