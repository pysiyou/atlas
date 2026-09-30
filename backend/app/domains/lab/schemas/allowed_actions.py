"""Shared allowed-action flags for lab worklists and order test projections."""

from pydantic import BaseModel, Field


class LabWorklistAllowedActions(BaseModel):
    model_config = {"populate_by_name": True}

    collect: bool = False
    enterResults: bool = False
    can_validate: bool = Field(default=False, alias="validate")
    reject: bool = False
