"""Catalog loading and synthetic result value builders."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from app.data.physiologic_limits import PHYSIOLOGIC_LIMITS
from app.utils.result_values import PHYSIOLOGIC_LIMIT_ALIASES

CATALOG_PATH = Path(__file__).resolve().parents[2] / "app" / "data" / "test-catalog.json"
EXTRA_ALIASES = {"EGFR_VALUE": "eGFR", "GLU_FAST": "GLU", "GLU_RANDOM": "GLU", "CREAT": "Creatinine"}


def load_catalog() -> list[dict[str, Any]]:
    return json.loads(CATALOG_PATH.read_text())["tests"]


def get_test_by_code(code: str) -> dict[str, Any]:
    for test in load_catalog():
        if test["test_code"] == code:
            return test
    raise KeyError(code)


ALL_TEST_CODES = [t["test_code"] for t in load_catalog()]


def _limit_key(item_code: str) -> str:
    return EXTRA_ALIASES.get(item_code) or PHYSIOLOGIC_LIMIT_ALIASES.get(item_code, item_code)


def _physio_bounds(item_code: str) -> tuple[float | None, float | None]:
    limits = PHYSIOLOGIC_LIMITS.get(_limit_key(item_code))
    if not limits:
        return None, None
    return limits.get("min"), limits.get("max")


def _clamp(item_code: str, value: float) -> float:
    lo, hi = _physio_bounds(item_code)
    if lo is not None and value < lo:
        value = lo + 0.1
    if hi is not None and value > hi:
        value = hi - 0.1
    return value


def _ref_midpoint(item: dict[str, Any]) -> float:
    ref = item.get("reference_range") or {}
    for key in ("adult_general", "adult_male", "adult_female", "pediatric"):
        band = ref.get(key)
        if band and "low" in band and "high" in band:
            return _clamp(item["item_code"], (float(band["low"]) + float(band["high"])) / 2)
    return 1.0


def normal_results_for_test(test: dict[str, Any]) -> dict[str, Any]:
    results: dict[str, Any] = {}
    for item in test.get("result_items", []):
        code = item["item_code"]
        vtype = (item.get("value_type") or "NUMERIC").upper()
        results[code] = _ref_midpoint(item) if vtype == "NUMERIC" else "Negative"
    return results


def high_abnormal_results_for_test(test: dict[str, Any]) -> dict[str, Any] | None:
    results = normal_results_for_test(test)
    for item in test.get("result_items", []):
        for band in (item.get("reference_range") or {}).values():
            if isinstance(band, dict) and band.get("high") is not None:
                code = item["item_code"]
                ref_hi = float(band["high"])
                _, phys_hi = _physio_bounds(code)
                value = min(ref_hi + 0.5, (phys_hi - 0.1) if phys_hi else ref_hi + 0.5)
                if value > ref_hi:
                    results[code] = value
                    return results
    return None


def low_abnormal_results_for_test(test: dict[str, Any]) -> dict[str, Any] | None:
    results = normal_results_for_test(test)
    for item in test.get("result_items", []):
        for band in (item.get("reference_range") or {}).values():
            if isinstance(band, dict) and band.get("low") is not None:
                code = item["item_code"]
                ref_lo = float(band["low"])
                if ref_lo <= 0:
                    continue
                phys_lo, _ = _physio_bounds(code)
                value = max(ref_lo - 0.5, (phys_lo + 0.1) if phys_lo is not None else ref_lo - 0.5)
                if value < ref_lo:
                    results[code] = value
                    return results
    return None


def critical_high_results_for_test(test: dict[str, Any]) -> dict[str, Any] | None:
    results = normal_results_for_test(test)
    for item in test.get("result_items", []):
        crit = item.get("critical_range") or {}
        if crit.get("high") is not None:
            code = item["item_code"]
            hi = float(crit["high"])
            _, phys_hi = _physio_bounds(code)
            value = min(hi + 1, (phys_hi - 0.1) if phys_hi else hi + 1)
            if value > hi:
                results[code] = value
                return results
    return None


def critical_low_results_for_test(test: dict[str, Any]) -> dict[str, Any] | None:
    results = normal_results_for_test(test)
    for item in test.get("result_items", []):
        crit = item.get("critical_range") or {}
        if crit.get("low") is not None:
            code = item["item_code"]
            low = float(crit["low"])
            if low <= 0:
                continue
            phys_lo, _ = _physio_bounds(code)
            value = max(low - 0.5, (phys_lo + 0.1) if phys_lo is not None else low - 0.5)
            if value < low:
                results[code] = value
                return results
    return None
