"""Pydantic schemas for the audit event log (dot-notation event taxonomy)."""
from __future__ import annotations

import enum
from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class EventType(str, enum.Enum):
    """Dot-notation event taxonomy for LIS audit trail."""

    # Patient
    PATIENT_CREATE = "patient.create"
    PATIENT_UPDATE = "patient.update"
    PATIENT_DELETE = "patient.delete"
    PATIENT_VIEW = "patient.view"

    # Order
    ORDER_CREATE = "order.create"
    ORDER_UPDATE = "order.update"
    ORDER_STATUS = "order.status"
    ORDER_DELETE = "order.delete"
    ORDER_TEST_ADD = "order.test.add"
    ORDER_TEST_REMOVE = "order.test.remove"
    ORDER_TEST_CANCEL = "order.test.cancel"
    ORDER_TEST_RETEST = "order.test.retest"
    ORDER_TEST_REFLEX = "order.test.reflex"

    # Laboratory — sample
    LABORATORY_SAMPLE_CREATE = "laboratory.sample.create"
    LABORATORY_SAMPLE_COLLECT = "laboratory.sample.collect"
    LABORATORY_SAMPLE_REJECT = "laboratory.sample.reject"
    LABORATORY_SAMPLE_RECOLLECT_REQUEST = "laboratory.sample.recollect_request"
    LABORATORY_SAMPLE_RECOLLECT_APPROVE = "laboratory.sample.recollect_approve"
    LABORATORY_SAMPLE_RECOLLECT_DENY = "laboratory.sample.recollect_deny"

    # Laboratory — analyzer
    LABORATORY_ANALYZER_DUPLICATE_INGEST = "laboratory.analyzer.duplicate_ingest"
    LABORATORY_ANALYZER_INGEST_REJECTED = "laboratory.analyzer.ingest_rejected"

    # Laboratory — result
    LABORATORY_RESULT_ENTER = "laboratory.result.enter"
    LABORATORY_RESULT_UPDATE = "laboratory.result.update"
    LABORATORY_RESULT_CRITICAL_DETECT = "laboratory.result.critical_detect"
    LABORATORY_RESULT_CRITICAL_NOTIFY = "laboratory.result.critical_notify"
    LABORATORY_RESULT_CRITICAL_ACKNOWLEDGE = "laboratory.result.critical_acknowledge"

    # Laboratory — validation
    LABORATORY_VALIDATION_APPROVE = "laboratory.validation.approve"
    LABORATORY_VALIDATION_REJECT = "laboratory.validation.reject"

    # Laboratory — escalation
    LABORATORY_ESCALATION_TRIGGER = "laboratory.escalation.trigger"
    LABORATORY_ESCALATION_RESOLVE = "laboratory.escalation.resolve"

    # Billing
    BILLING_PAYMENT_PROCESS = "billing.payment.process"
    BILLING_INVOICE_GENERATE = "billing.invoice.generate"
    BILLING_INVOICE_VOID = "billing.invoice.void"
    BILLING_INSURANCE_SUBMIT = "billing.insurance.submit"

    # Reporting
    REPORTING_GENERATE = "reporting.generate"
    REPORTING_DOWNLOAD = "reporting.download"

    # System — user
    SYSTEM_USER_LOGIN = "system.user.login"
    SYSTEM_USER_LOGOUT = "system.user.logout"
    SYSTEM_USER_CREATE = "system.user.create"
    SYSTEM_USER_UPDATE = "system.user.update"

    # System — catalog
    SYSTEM_CATALOG_CREATE = "system.catalog.create"
    SYSTEM_CATALOG_UPDATE = "system.catalog.update"


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
