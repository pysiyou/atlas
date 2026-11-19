"""Consolidated tube volume math and specimen volume classification."""
from __future__ import annotations

from enum import StrEnum
from typing import Iterable

from app.domains.catalog.models import OrderableTest
from app.shared.generated.lab_policy import SPECIMEN_DEAD_VOLUME_ML


class SpecimenVolumeStatus(StrEnum):
    NO_REQUIREMENT = "no_requirement"
    INSUFFICIENT = "insufficient"
    SHORT_SAMPLE = "short_sample"
    OPTIMAL = "optimal"


SHORT_SAMPLE_VOLUME_ISSUE = "short_sample_volume"
INSUFFICIENT_VOLUME_REJECTION = "insufficient_volume"


def aggregate_required_min_ml(tests: Iterable[OrderableTest]) -> float:
    """Maximum min_volume_ml across tests on the same tube (nulls ignored)."""
    mins = [float(t.minVolumeMl) for t in tests if t.minVolumeMl is not None]
    return max(mins) if mins else 0.0


def aggregate_target_optimal_ml(
    tests: Iterable[OrderableTest],
    *,
    dead_volume_ml: float | None = None,
) -> float:
    """Maximum optimal_volume_ml plus analyzer dead volume (when any optimal is defined)."""
    dead = SPECIMEN_DEAD_VOLUME_ML if dead_volume_ml is None else dead_volume_ml
    optimals = [float(t.optimalVolumeMl) for t in tests if t.optimalVolumeMl is not None]
    if not optimals:
        return 0.0
    return max(optimals) + dead


def classify_specimen_volume(
    collected_ml: float,
    required_min_ml: float,
    optimal_ml: float,
) -> SpecimenVolumeStatus:
    """Traffic-light classification using phlebotomy collected volume."""
    if required_min_ml <= 0 and optimal_ml <= 0:
        return SpecimenVolumeStatus.NO_REQUIREMENT
    if required_min_ml > 0 and collected_ml < required_min_ml:
        return SpecimenVolumeStatus.INSUFFICIENT
    if optimal_ml > 0 and collected_ml < optimal_ml:
        return SpecimenVolumeStatus.SHORT_SAMPLE
    if optimal_ml > 0 and collected_ml >= optimal_ml:
        return SpecimenVolumeStatus.OPTIMAL
    return SpecimenVolumeStatus.NO_REQUIREMENT


def available_volume_ml(sample) -> float:
    """Volume left for add-ons / reflex (prefer remaining, else collected)."""
    remaining = getattr(sample, "remainingVolume", None)
    if remaining is not None:
        return float(remaining)
    collected = getattr(sample, "collectedVolume", None)
    return float(collected) if collected is not None else 0.0