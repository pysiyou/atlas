"""Map flat contract JSON (contracts/*.json) onto catalog ORM columns."""
from __future__ import annotations

from typing import Any


def validation_rejection_criteria(entry: dict[str, Any]) -> list[Any] | None:
    validation = entry.get("validation")
    if isinstance(validation, dict):
        raw = validation.get("rejection_criteria")
        if raw is not None:
            return raw
    return None


def copy_test_fields(entry: dict[str, Any]) -> dict[str, Any]:
    """Normalize one orderable-tests.json row into OrderableTest column kwargs."""
    collection = entry.get("collection") if isinstance(entry.get("collection"), dict) else {}
    return {
        "code": entry["test_code"],
        "name": entry.get("name") or entry["test_code"],
        "displayName": entry.get("name") or entry["test_code"],
        "synonyms": entry.get("synonyms"),
        "category": entry.get("category_slug") or "general",
        "categoryLabel": entry.get("category_label"),
        "description": entry.get("description"),
        "orderObs": entry.get("order_obs"),
        "price": float(entry.get("price") or 0),
        "turnaroundTimeHours": int(entry.get("turnaround_time_hours") or 0),
        "sampleType": collection.get("sample_type") or "other",
        "sampleVolume": collection.get("volume_description") or collection.get("container_description"),
        "minimumVolume": collection.get("volume_ml_min"),
        "optimalVolume": None,
        "containerTypes": collection.get("container_types") or [],
        "containerTopColors": collection.get("container_top_colors") or [],
        "numberOfContainers": None,
        "containerDescription": collection.get("container_description"),
        "specialRequirements": None,
        "fastingRequired": bool(collection.get("fasting_required")),
        "collectionNotes": collection.get("collection_notes"),
        "rejectionCriteria": collection.get("rejection_criteria") if collection else None,
        "validationRejectionCriteria": validation_rejection_criteria(entry),
        "loincCode": entry.get("loinc_code"),
        "methodology": entry.get("methodology"),
        "confidence": entry.get("confidence"),
        "notes": entry.get("notes"),
        "isActive": True,
    }