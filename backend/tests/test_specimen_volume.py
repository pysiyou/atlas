"""Unit tests for consolidated tube volume helpers."""
from __future__ import annotations

import unittest

from app.domains.lab.specimen.volume import (
    SpecimenVolumeStatus,
    aggregate_required_min_ml,
    aggregate_target_optimal_ml,
    apply_received_volume_quality_issues,
    classify_specimen_volume,
    effective_sample_volumes,
)


class _FakeTest:
    def __init__(self, min_v: float | None = None, opt_v: float | None = None):
        self.minVolumeMl = min_v
        self.optimalVolumeMl = opt_v


class SpecimenVolumeTests(unittest.TestCase):
    def test_aggregate_uses_max_not_sum(self):
        tests = [_FakeTest(2.0, 3.0), _FakeTest(5.0, 4.0)]
        self.assertEqual(aggregate_required_min_ml(tests), 5.0)
        self.assertEqual(aggregate_target_optimal_ml(tests), 4.0)

    def test_classify_traffic_light(self):
        self.assertEqual(
            classify_specimen_volume(1.0, 2.0, 3.0),
            SpecimenVolumeStatus.INSUFFICIENT,
        )
        self.assertEqual(
            classify_specimen_volume(2.5, 2.0, 3.0),
            SpecimenVolumeStatus.SHORT_SAMPLE,
        )
        self.assertEqual(
            classify_specimen_volume(3.0, 2.0, 3.0),
            SpecimenVolumeStatus.OPTIMAL,
        )

    def test_effective_sample_volumes_falls_back_to_catalog(self):
        class _Sample:
            requiredVolume = 0.0
            optimalVolume = 0.0

        tests = [_FakeTest(2.0, 5.0), _FakeTest(3.0, 4.0)]
        self.assertEqual(effective_sample_volumes(_Sample(), tests), (3.0, 5.0))

    def test_receive_apply_quality_only_when_classifying(self):
        class _Sample:
            requiredVolume = 2.0
            optimalVolume = 3.0
            qualityIssues = None

        s = _Sample()
        apply_received_volume_quality_issues(s, 1.5)
        self.assertIn("insufficient_volume", s.qualityIssues or [])

        s.qualityIssues = ["hemolyzed"]
        apply_received_volume_quality_issues(s, 3.0)
        self.assertEqual(s.qualityIssues, ["hemolyzed"])


if __name__ == "__main__":
    unittest.main()