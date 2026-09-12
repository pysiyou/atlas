"""Shared lab workflow types."""
from typing import Optional

from pydantic import BaseModel

from app.schemas.enums import EscalationResolutionAction


class EscalationResolveResult(BaseModel):
    success: bool
    action: EscalationResolutionAction
    message: str
    escalatedTestId: int
    newTestId: Optional[int] = None
    newSampleId: Optional[int] = None
