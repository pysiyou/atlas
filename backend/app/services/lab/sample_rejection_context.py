"""Context for physical sample rejection (audit / timeline)."""

from dataclasses import dataclass

from app.schemas.enums import QualityStage


@dataclass(frozen=True)
class SampleRejectionContext:
    stage: QualityStage
    order_test_id: int | None = None
    quality_issue_id: int | None = None
