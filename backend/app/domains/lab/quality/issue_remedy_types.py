"""Shared remedy-type helpers and sample-rejection outcome literals."""

from __future__ import annotations

from typing import Literal

from app.shared.contracts.enums import RemedyType
from app.shared.contracts.lab_contract import (
    SAMPLE_UNFINISHED_REMEDIES as SAMPLE_UNFINISHED_REMEDY_WIRES,
)
from app.shared.contracts.lab_contract import VALIDATION_REMEDIES as VALIDATION_REMEDY_WIRES
from app.shared.contracts.enums import TestStatus

ResultedRejectionOutcome = Literal["reset_pending", "cancel"]

SAMPLE_RESET_STATUSES = {
    TestStatus.PENDING,
    TestStatus.SAMPLE_COLLECTED,
}


def _remedy_types(wires: tuple[str, ...]) -> list[RemedyType]:
    return [RemedyType(w) for w in wires]


def validation_remedy_types() -> list[RemedyType]:
    return _remedy_types(VALIDATION_REMEDY_WIRES)


def sample_unfinished_remedy_types() -> list[RemedyType]:
    return _remedy_types(SAMPLE_UNFINISHED_REMEDY_WIRES)
