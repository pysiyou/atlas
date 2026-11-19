"""
FastAPI Annotated path/query types for clinical identifiers.

Patterns are defined in ``app.shared.identifiers`` and mirrored in ``entity-ids.json``.
"""
from __future__ import annotations

from typing import Annotated

from app.shared.identifiers import (
    EMPLOYEE_NUMBER_PATTERN,
    FILLER_PATTERN,
    LAB_ACTOR_USER_ID_PATTERN,
    MRN_PATTERN,
    RECEIPT_NUMBER_PATTERN,
    REFERENT_DOCTOR_ID_PATTERN,
    SAMPLE_ID_PATTERN,
    TEST_MNEMONIC_PATTERN,
)
from fastapi import Path, Query

MrnPath = Annotated[str, Path(pattern=MRN_PATTERN, min_length=8, max_length=8)]
OrderIdPath = Annotated[str, Path(pattern=FILLER_PATTERN, min_length=13, max_length=13)]
SampleIdPath = Annotated[str, Path(pattern=SAMPLE_ID_PATTERN, min_length=8, max_length=20)]
EmployeeIdPath = Annotated[
    str, Path(pattern=EMPLOYEE_NUMBER_PATTERN, min_length=8, max_length=8)
]
TestCodePath = Annotated[str, Path(pattern=TEST_MNEMONIC_PATTERN, min_length=2, max_length=8)]
OrderTestIdPath = Annotated[int, Path(gt=0)]
ReceiptIdPath = Annotated[str, Path(pattern=RECEIPT_NUMBER_PATTERN, min_length=8, max_length=8)]

MrnQuery = Annotated[str | None, Query(pattern=MRN_PATTERN, min_length=8, max_length=8)]
OrderIdQuery = Annotated[str | None, Query(pattern=FILLER_PATTERN, min_length=13, max_length=13)]
SampleIdQuery = Annotated[
    str | None,
    Query(pattern=SAMPLE_ID_PATTERN, min_length=8, max_length=20),
]
EmployeeIdQuery = Annotated[
    str | None,
    Query(pattern=EMPLOYEE_NUMBER_PATTERN, min_length=8, max_length=8),
]
LabActorIdQuery = Annotated[
    str | None,
    Query(pattern=LAB_ACTOR_USER_ID_PATTERN, min_length=6, max_length=8),
]
ReferentDoctorIdQuery = Annotated[
    str | None,
    Query(pattern=REFERENT_DOCTOR_ID_PATTERN, min_length=8, max_length=8),
]