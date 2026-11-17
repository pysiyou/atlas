"""Pydantic schemas for the audit event log (dot-notation event taxonomy)."""
from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from app.platform.utils import FILLER_PATTERN, MRN_PATTERN, SAMPLE_ID_PATTERN
from app.shared.contracts.audit_events import EventType
from pydantic import BaseModel, Field

__all__ = [
    "EventType",
    "EventTarget",
    "EventContext",
    "EventChanges",
    "AuditEventCreate",
    "AuditSearchParsedIds",
    "AuditSearchIntent",
    "AuditSearchPreviewPatient",
    "AuditSearchPreviewUser",
    "AuditSearchPreviewResponse",
    "AuditEventResponse",
]


class EventTarget(BaseModel):
    entityType: str = Field(..., min_length=1, max_length=50)
    entityId: str = Field(..., max_length=32)


class EventContext(BaseModel):
    patientId: str | None = Field(None, pattern=MRN_PATTERN)
    orderId: str | None = Field(None, pattern=FILLER_PATTERN)
    testId: int | None = Field(None, gt=0)


class EventChanges(BaseModel):
    oldValues: dict[str, Any] = Field(default_factory=dict)
    newValues: dict[str, Any] = Field(default_factory=dict)


class AuditEventCreate(BaseModel):
    eventType: EventType
    target: EventTarget
    context: EventContext | None = None
    changes: EventChanges | None = None
    metadata: dict[str, Any] | None = None


class AuditSearchParsedIds(BaseModel):
    orderId: str | None = Field(None, pattern=FILLER_PATTERN)
    testId: int | None = Field(None, gt=0)
    sampleId: str | None = Field(None, pattern=SAMPLE_ID_PATTERN)
    patientId: str | None = Field(None, pattern=MRN_PATTERN)


class AuditSearchIntent(BaseModel):
    mode: str
    textTerm: str | None = None
    dimensions: list[str] = Field(default_factory=list)
    parsedIds: AuditSearchParsedIds | None = None
    displayToken: str | None = None


class AuditSearchPreviewPatient(BaseModel):
    id: str
    fullName: str
    displayId: str


class AuditSearchPreviewUser(BaseModel):
    id: str
    name: str
    username: str


class AuditSearchPreviewResponse(BaseModel):
    intent: AuditSearchIntent
    patients: list[AuditSearchPreviewPatient] = Field(default_factory=list)
    users: list[AuditSearchPreviewUser] = Field(default_factory=list)
    eventCount: int | None = None


class AuditEventResponse(BaseModel):
    eventId: UUID
    createdAt: datetime
    eventType: str
    actorId: str | None = None
    actorSnapshot: dict[str, Any]
    targetType: str
    targetId: str
    patientId: str | None = None
    orderId: str | None = None
    testId: int | None = None
    eventScope: str | None = None
    changes: dict[str, Any] | None = None
    metadata: dict[str, Any] | None = None

    class Config:
        from_attributes = True
