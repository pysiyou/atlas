"""Pydantic schemas for the audit event log (dot-notation event taxonomy)."""
from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

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
    entityId: int


class EventContext(BaseModel):
    patientId: int | None = None
    orderId: int | None = None
    testId: int | None = None


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
    orderId: int | None = None
    testId: int | None = None
    sampleId: int | None = None
    patientId: int | None = None


class AuditSearchIntent(BaseModel):
    mode: str
    textTerm: str | None = None
    dimensions: list[str] = Field(default_factory=list)
    parsedIds: AuditSearchParsedIds | None = None
    displayToken: str | None = None


class AuditSearchPreviewPatient(BaseModel):
    id: int
    fullName: str
    displayId: str


class AuditSearchPreviewUser(BaseModel):
    id: int
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
    actorId: int | None = None
    actorSnapshot: dict[str, Any]
    targetType: str
    targetId: int
    patientId: int | None = None
    orderId: int | None = None
    testId: int | None = None
    eventScope: str | None = None
    changes: dict[str, Any] | None = None
    metadata: dict[str, Any] | None = None

    class Config:
        from_attributes = True
