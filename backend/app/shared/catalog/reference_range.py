"""Resolve analyte ``reference_range`` bands — SI demographic convention (mirrors frontend)."""
from __future__ import annotations

from typing import Any, Literal, TypedDict

ReferenceBandSource = Literal[
    "pediatric",
    "adult_male",
    "adult_female",
    "adult_general",
    "legacy",
    "none",
]


class ResolvedBand(TypedDict, total=False):
    low: float
    high: float
    text: str
    source: ReferenceBandSource
    band_key: str


def _as_band(value: Any) -> dict[str, Any] | None:
    if not isinstance(value, dict):
        return None
    if value.get("low") is not None or value.get("high") is not None or value.get("text"):
        return value
    return None


def resolve_reference_band(
    reference_range: dict[str, Any] | None,
    *,
    gender: str | None = None,
    age: int | None = None,
) -> ResolvedBand:
    """Pick the reference interval used for result flagging."""
    if not reference_range:
        return {"source": "none"}

    if age is not None and age < 18:
        pediatric = _as_band(reference_range.get("pediatric"))
        if pediatric:
            return {**pediatric, "source": "pediatric", "band_key": "pediatric"}

    if gender == "male":
        male = _as_band(reference_range.get("adult_male"))
        if male:
            return {**male, "source": "adult_male", "band_key": "adult_male"}

    if gender == "female":
        female = _as_band(reference_range.get("adult_female"))
        if female:
            return {**female, "source": "adult_female", "band_key": "adult_female"}

    for band_key, source in (
        ("adult_general", "adult_general"),
        ("adult_male", "adult_male"),
        ("adult_female", "adult_female"),
        ("pediatric", "pediatric"),
    ):
        band = _as_band(reference_range.get(band_key))
        if band:
            return {**band, "source": source, "band_key": band_key}

    if "low" in reference_range or "high" in reference_range:
        return {
            "low": reference_range.get("low"),
            "high": reference_range.get("high"),
            "source": "legacy",
            "band_key": "legacy",
        }

    return {"source": "none"}


def band_low_high(band: ResolvedBand) -> tuple[float | None, float | None]:
    low = band.get("low")
    high = band.get("high")
    return (
        float(low) if isinstance(low, (int, float)) else None,
        float(high) if isinstance(high, (int, float)) else None,
    )