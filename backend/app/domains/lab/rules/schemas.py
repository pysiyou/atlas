"""Lab work-item projection DTOs (API / orders / worklists). No ORM imports."""
from typing import Literal

from app.shared.api import StatusPresentation
from pydantic import BaseModel, Field

MonitorAttentionStage = Literal["collection", "entry", "validation", "escalation"]

PipelineStage = Literal["collection", "entry", "validation", "completed", "cancelled"]


class LabWorklistAllowedActions(BaseModel):
    """Shared allowed-action flags for lab worklists and order test projections."""

    model_config = {"populate_by_name": True}

    collect: bool = False
    enterResults: bool = False
    can_validate: bool = Field(default=False, alias="validate")
    reject: bool = False


class EscalationActionFlags(BaseModel):
    criticalNotificationSent: bool = False
    allowForceValidate: bool = True


class LabWorkItemProjection(BaseModel):
    model_config = {"populate_by_name": True}

    pipelineStage: PipelineStage
    attentionReason: str | None = None
    attentionLabel: str | None = None
    denyReason: str | None = None
    denyMessage: str | None = None
    allowedActions: LabWorklistAllowedActions = Field(default_factory=LabWorklistAllowedActions)
    escalation: EscalationActionFlags | None = None
    statusPresentation: StatusPresentation | None = None