"""Consolidated tube volume math and specimen volume classification."""
from __future__ import annotations

from enum import StrEnum
from typing import Iterable

from app.domains.catalog.models import OrderableTest


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


def aggregate_target_optimal_ml(tests: Iterable[OrderableTest]) -> float:
    """Maximum optimal_volume_ml across tests on the same tube (nulls ignored)."""
    optimals = [float(t.optimalVolumeMl) for t in tests if t.optimalVolumeMl is not None]
    return max(optimals) if optimals else 0.0


def classify_specimen_volume(
    measured_ml: float,
    required_min_ml: float,
    optimal_ml: float,
) -> SpecimenVolumeStatus:
    """Traffic-light classification for a measured volume (e.g. lab receive check-in)."""
    if required_min_ml <= 0 and optimal_ml <= 0:
        return SpecimenVolumeStatus.NO_REQUIREMENT
    if required_min_ml > 0 and measured_ml < required_min_ml:
        return SpecimenVolumeStatus.INSUFFICIENT
    if optimal_ml > 0 and measured_ml < optimal_ml:
        return SpecimenVolumeStatus.SHORT_SAMPLE
    if optimal_ml > 0 and measured_ml >= optimal_ml:
        return SpecimenVolumeStatus.OPTIMAL
    return SpecimenVolumeStatus.NO_REQUIREMENT


VOLUME_QUALITY_FLAGS = frozenset({SHORT_SAMPLE_VOLUME_ISSUE, INSUFFICIENT_VOLUME_REJECTION})


def apply_received_volume_quality_issues(
    sample,
    received_ml: float,
) -> SpecimenVolumeStatus:
    """Update sample qualityIssues from receive check-in volume only."""
    status = classify_specimen_volume(
        float(received_ml),
        float(sample.requiredVolume or 0),
        float(sample.optimalVolume or 0),
    )
    issues = [i for i in (sample.qualityIssues or []) if i not in VOLUME_QUALITY_FLAGS]
    if status == SpecimenVolumeStatus.INSUFFICIENT:
        issues.append(INSUFFICIENT_VOLUME_REJECTION)
    elif status == SpecimenVolumeStatus.SHORT_SAMPLE:
        issues.append(SHORT_SAMPLE_VOLUME_ISSUE)
    sample.qualityIssues = issues or None
    return status