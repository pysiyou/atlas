#!/usr/bin/env python3
"""
Export FastAPI OpenAPI schema to contracts/openapi.json (repo root).
Run from repository root: python scripts/export-openapi.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BACKEND = ROOT / "backend"
OUT = ROOT / "contracts" / "openapi.json"

if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

from app.main import app  # noqa: E402

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(app.openapi(), indent=2) + "\n", encoding="utf-8")
print(f"Wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size} bytes)")