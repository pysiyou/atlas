"""Domain-specific audit event emissions (dot-notation taxonomy)."""
from __future__ import annotations

from typing import Any

from app.models.order import Order
from app.models.user import User
from app.schemas.audit import AuditEventCreate, EventChanges, EventContext, EventTarget, EventType
from app.services.audit.event_logger import EventLogger
from sqlalchemy.orm import Session


class AuditEmitter:
    """Central helper for writing audit events from service-layer code."""

    def __init__(self, db: Session):
        self.db = db
        self._logger = EventLogger(db)

    def _actor(self, user_id: int | None) -> User | None:
        if user_id is None or user_id <= 0:
            return None
        return self.db.query(User).filter(User.id == user_id).first()

    def _order_context(self, order_id: int, test_id: int | None = None) -> EventContext:
        order = self.db.query(Order).filter(Order.orderId == order_id).first()
        return EventContext(
            orderId=order_id,
            patientId=order.patientId if order else None,
            testId=test_id,
        )

    def emit(self, create: AuditEventCreate, user_id: int | None) -> None:
        self._logger.log_event_sync(create, self._actor(user_id))

    # ── Patient ──────────────────────────────────────────────────────────

    def patient_created(self, patient_id: int, user_id: int) -> None:
        self.emit(
            AuditEventCreate(
                eventType=EventType.PATIENT_CREATE,
                target=EventTarget(entityType="patient", entityId=patient_id),
                context=EventContext(patientId=patient_id),
            ),
            user_id,
        )

    def patient_updated(self, patient_id: int, user_id: int, changes: dict[str, Any] | None = None) -> None:
        self.emit(
            AuditEventCreate(
                eventType=EventType.PATIENT_UPDATE,
                target=EventTarget(entityType="patient", entityId=patient_id),
                context=EventContext(patientId=patient_id),
                changes=EventChanges(newValues=changes or {}) if changes else None,
            ),
            user_id,
        )

    def patient_deleted(self, patient_id: int, user_id: int) -> None:
        self.emit(
            AuditEventCreate(
                eventType=EventType.PATIENT_DELETE,
                target=EventTarget(entityType="patient", entityId=patient_id),
                context=EventContext(patientId=patient_id),
            ),
            user_id,
        )

    def patient_viewed(self, patient_id: int, user_id: int) -> None:
        self.emit(
            AuditEventCreate(
                eventType=EventType.PATIENT_VIEW,
                target=EventTarget(entityType="patient", entityId=patient_id),
                context=EventContext(patientId=patient_id),
            ),
            user_id,
        )

    # ── Order ────────────────────────────────────────────────────────────

    def order_created(self, order_id: int, patient_id: int, user_id: int) -> None:
        self.emit(
            AuditEventCreate(
                eventType=EventType.ORDER_CREATE,
                target=EventTarget(entityType="order", entityId=order_id),
                context=EventContext(orderId=order_id, patientId=patient_id),
            ),
            user_id,
        )

    def order_updated(self, order_id: int, user_id: int, metadata: dict[str, Any] | None = None) -> None:
        self.emit(
            AuditEventCreate(
                eventType=EventType.ORDER_UPDATE,
                target=EventTarget(entityType="order", entityId=order_id),
                context=self._order_context(order_id),
                metadata=metadata,
            ),
            user_id,
        )

    def order_deleted(self, order_id: int, user_id: int) -> None:
        ctx = self._order_context(order_id)
        self.emit(
            AuditEventCreate(
                eventType=EventType.ORDER_DELETE,
                target=EventTarget(entityType="order", entityId=order_id),
                context=ctx,
            ),
            user_id,
        )

    def order_status_changed(
        self,
        order_id: int,
        old_status: str | None,
        new_status: str,
        user_id: int | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        meta = {"trigger": metadata.get("trigger", "automatic") if metadata else "automatic"}
        if metadata:
            meta.update(metadata)
        self.emit(
            AuditEventCreate(
                eventType=EventType.ORDER_STATUS,
                target=EventTarget(entityType="order", entityId=order_id),
                context=self._order_context(order_id),
                changes=EventChanges(
                    oldValues={"status": old_status},
                    newValues={"status": new_status},
                ),
                metadata=meta,
            ),
            user_id,
        )

    def order_test_added(
        self, order_id: int, order_test_id: int, test_code: str, user_id: int
    ) -> None:
        self.emit(
            AuditEventCreate(
                eventType=EventType.ORDER_TEST_ADD,
                target=EventTarget(entityType="order_test", entityId=order_test_id),
                context=self._order_context(order_id, test_id=order_test_id),
                metadata={"test_code": test_code},
            ),
            user_id,
        )

    def order_test_removed(
        self,
        order_id: int,
        order_test_id: int,
        test_code: str,
        user_id: int,
        old_status: str,
    ) -> None:
        self.emit(
            AuditEventCreate(
                eventType=EventType.ORDER_TEST_REMOVE,
                target=EventTarget(entityType="order_test", entityId=order_test_id),
                context=self._order_context(order_id, test_id=order_test_id),
                changes=EventChanges(oldValues={"status": old_status}, newValues={"status": "removed"}),
                metadata={"test_code": test_code},
            ),
            user_id,
        )

    def order_test_cancelled(
        self,
        order_id: int,
        order_test_id: int,
        test_code: str,
        user_id: int,
        reason: str | None = None,
    ) -> None:
        self.emit(
            AuditEventCreate(
                eventType=EventType.ORDER_TEST_CANCEL,
                target=EventTarget(entityType="order_test", entityId=order_test_id),
                context=self._order_context(order_id, test_id=order_test_id),
                changes=EventChanges(newValues={"status": "cancelled"}),
                metadata={"test_code": test_code, "reason": reason},
            ),
            user_id,
        )

    def order_test_retest(
        self,
        order_id: int,
        original_test_id: int,
        new_test_id: int,
        test_code: str,
        user_id: int,
        reason: str | None = None,
    ) -> None:
        self.emit(
            AuditEventCreate(
                eventType=EventType.ORDER_TEST_RETEST,
                target=EventTarget(entityType="order_test", entityId=new_test_id),
                context=self._order_context(order_id, test_id=new_test_id),
                metadata={
                    "test_code": test_code,
                    "superseded_test_id": original_test_id,
                    "reason": reason,
                },
            ),
            user_id,
        )

    def order_test_reflex(
        self,
        order_id: int,
        new_test_id: int,
        added_test_code: str,
        triggered_by_test_code: str,
        user_id: int | None,
    ) -> None:
        self.emit(
            AuditEventCreate(
                eventType=EventType.ORDER_TEST_REFLEX,
                target=EventTarget(entityType="order_test", entityId=new_test_id),
                context=self._order_context(order_id, test_id=new_test_id),
                metadata={
                    "added_test_code": added_test_code,
                    "triggered_by": triggered_by_test_code,
                },
            ),
            user_id,
        )

    # ── Laboratory — sample ──────────────────────────────────────────────

    def sample_created(self, sample_id: int, order_id: int, user_id: int | None) -> None:
        self.emit(
            AuditEventCreate(
                eventType=EventType.LABORATORY_SAMPLE_CREATE,
                target=EventTarget(entityType="sample", entityId=sample_id),
                context=self._order_context(order_id),
            ),
            user_id,
        )

    def sample_collected(
        self,
        sample_id: int,
        order_id: int,
        user_id: int,
        before: dict[str, Any],
        after: dict[str, Any],
        metadata: dict[str, Any] | None = None,
    ) -> None:
        self.emit(
            AuditEventCreate(
                eventType=EventType.LABORATORY_SAMPLE_COLLECT,
                target=EventTarget(entityType="sample", entityId=sample_id),
                context=self._order_context(order_id),
                changes=EventChanges(oldValues=before, newValues=after),
                metadata=metadata,
            ),
            user_id,
        )

    def sample_rejected(
        self,
        sample_id: int,
        order_id: int,
        user_id: int,
        reason: str,
        metadata: dict[str, Any] | None = None,
        old_status: str | None = None,
    ) -> None:
        self.emit(
            AuditEventCreate(
                eventType=EventType.LABORATORY_SAMPLE_REJECT,
                target=EventTarget(entityType="sample", entityId=sample_id),
                context=self._order_context(order_id),
                changes=EventChanges(
                    oldValues={"status": old_status or "collected"},
                    newValues={"status": "rejected"},
                ),
                metadata={"rejection_reason": reason, **(metadata or {})},
            ),
            user_id,
        )

    def sample_recollect_requested(
        self,
        sample_id: int,
        order_id: int,
        user_id: int,
        metadata: dict[str, Any],
    ) -> None:
        self.emit(
            AuditEventCreate(
                eventType=EventType.LABORATORY_SAMPLE_RECOLLECT_REQUEST,
                target=EventTarget(entityType="sample", entityId=sample_id),
                context=self._order_context(order_id),
                metadata=metadata,
            ),
            user_id,
        )

    def sample_recollect_approved(
        self,
        sample_id: int,
        order_id: int,
        user_id: int,
        metadata: dict[str, Any],
    ) -> None:
        self.emit(
            AuditEventCreate(
                eventType=EventType.LABORATORY_SAMPLE_RECOLLECT_APPROVE,
                target=EventTarget(entityType="sample", entityId=sample_id),
                context=self._order_context(order_id),
                metadata=metadata,
            ),
            user_id,
        )

    def sample_recollect_denied(
        self,
        sample_id: int,
        order_id: int,
        user_id: int,
        metadata: dict[str, Any],
    ) -> None:
        self.emit(
            AuditEventCreate(
                eventType=EventType.LABORATORY_SAMPLE_RECOLLECT_DENY,
                target=EventTarget(entityType="sample", entityId=sample_id),
                context=self._order_context(order_id),
                metadata=metadata,
            ),
            user_id,
        )

    # ── Laboratory — result / validation ─────────────────────────────────

    def result_entered(
        self,
        order_id: int,
        order_test_id: int,
        test_code: str,
        user_id: int,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        self.emit(
            AuditEventCreate(
                eventType=EventType.LABORATORY_RESULT_ENTER,
                target=EventTarget(entityType="order_test", entityId=order_test_id),
                context=self._order_context(order_id, test_id=order_test_id),
                changes=EventChanges(
                    oldValues={"status": "sample-collected"},
                    newValues={"status": "resulted"},
                ),
                metadata={"test_code": test_code, **(metadata or {})},
            ),
            user_id,
        )

    def result_critical_detected(
        self,
        order_id: int,
        order_test_id: int,
        test_code: str,
        user_id: int,
        metadata: dict[str, Any],
    ) -> None:
        self.emit(
            AuditEventCreate(
                eventType=EventType.LABORATORY_RESULT_CRITICAL_DETECT,
                target=EventTarget(entityType="order_test", entityId=order_test_id),
                context=self._order_context(order_id, test_id=order_test_id),
                metadata={"test_code": test_code, **metadata},
            ),
            user_id,
        )

    def result_critical_notified(
        self,
        order_id: int,
        order_test_id: int,
        test_code: str,
        user_id: int,
        metadata: dict[str, Any],
    ) -> None:
        self.emit(
            AuditEventCreate(
                eventType=EventType.LABORATORY_RESULT_CRITICAL_NOTIFY,
                target=EventTarget(entityType="order_test", entityId=order_test_id),
                context=self._order_context(order_id, test_id=order_test_id),
                metadata={"test_code": test_code, **metadata},
            ),
            user_id,
        )

    def result_critical_acknowledged(
        self,
        order_id: int,
        order_test_id: int,
        test_code: str,
        user_id: int,
        metadata: dict[str, Any],
    ) -> None:
        self.emit(
            AuditEventCreate(
                eventType=EventType.LABORATORY_RESULT_CRITICAL_ACKNOWLEDGE,
                target=EventTarget(entityType="order_test", entityId=order_test_id),
                context=self._order_context(order_id, test_id=order_test_id),
                metadata={"test_code": test_code, **metadata},
            ),
            user_id,
        )

    def validation_approved(
        self,
        order_id: int,
        order_test_id: int,
        test_code: str,
        user_id: int,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        self.emit(
            AuditEventCreate(
                eventType=EventType.LABORATORY_VALIDATION_APPROVE,
                target=EventTarget(entityType="order_test", entityId=order_test_id),
                context=self._order_context(order_id, test_id=order_test_id),
                changes=EventChanges(
                    oldValues={"status": "resulted"},
                    newValues={"status": "validated"},
                ),
                metadata={"test_code": test_code, **(metadata or {})},
            ),
            user_id,
        )

    def validation_rejected(
        self,
        order_id: int,
        order_test_id: int | None,
        sample_id: int | None,
        user_id: int,
        metadata: dict[str, Any],
    ) -> None:
        target_type = "order_test" if order_test_id else "sample"
        target_id = order_test_id if order_test_id else (sample_id or 0)
        self.emit(
            AuditEventCreate(
                eventType=EventType.LABORATORY_VALIDATION_REJECT,
                target=EventTarget(entityType=target_type, entityId=target_id),
                context=self._order_context(
                    order_id, test_id=order_test_id if order_test_id else None
                ),
                metadata=metadata,
            ),
            user_id,
        )

    def escalation_triggered(
        self,
        order_id: int,
        order_test_id: int,
        test_code: str,
        user_id: int,
        metadata: dict[str, Any],
    ) -> None:
        self.emit(
            AuditEventCreate(
                eventType=EventType.LABORATORY_ESCALATION_TRIGGER,
                target=EventTarget(entityType="order_test", entityId=order_test_id),
                context=self._order_context(order_id, test_id=order_test_id),
                changes=EventChanges(newValues={"status": "escalated"}),
                metadata={"test_code": test_code, **metadata},
            ),
            user_id,
        )

    def escalation_resolved(
        self,
        order_id: int,
        order_test_id: int,
        test_code: str,
        user_id: int,
        metadata: dict[str, Any],
    ) -> None:
        self.emit(
            AuditEventCreate(
                eventType=EventType.LABORATORY_ESCALATION_RESOLVE,
                target=EventTarget(entityType="order_test", entityId=order_test_id),
                context=self._order_context(order_id, test_id=order_test_id),
                metadata={"test_code": test_code, **metadata},
            ),
            user_id,
        )

    # ── Billing ──────────────────────────────────────────────────────────

    def payment_processed(
        self,
        order_id: int,
        payment_id: int,
        user_id: int,
        metadata: dict[str, Any],
    ) -> None:
        self.emit(
            AuditEventCreate(
                eventType=EventType.BILLING_PAYMENT_PROCESS,
                target=EventTarget(entityType="payment", entityId=payment_id),
                context=self._order_context(order_id),
                metadata=metadata,
            ),
            user_id,
        )

    def invoice_generated(self, order_id: int, invoice_id: int, user_id: int | None) -> None:
        self.emit(
            AuditEventCreate(
                eventType=EventType.BILLING_INVOICE_GENERATE,
                target=EventTarget(entityType="invoice", entityId=invoice_id),
                context=self._order_context(order_id),
            ),
            user_id,
        )

    def insurance_submitted(
        self,
        order_id: int,
        claim_id: int,
        user_id: int,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        self.emit(
            AuditEventCreate(
                eventType=EventType.BILLING_INSURANCE_SUBMIT,
                target=EventTarget(entityType="insurance_claim", entityId=claim_id),
                context=self._order_context(order_id),
                metadata=metadata,
            ),
            user_id,
        )

    # ── Reporting / system ───────────────────────────────────────────────

    def reporting_generated(self, order_id: int, user_id: int) -> None:
        self.emit(
            AuditEventCreate(
                eventType=EventType.REPORTING_GENERATE,
                target=EventTarget(entityType="order", entityId=order_id),
                context=self._order_context(order_id),
            ),
            user_id,
        )

    def user_login(self, user_id: int) -> None:
        self.emit(
            AuditEventCreate(
                eventType=EventType.SYSTEM_USER_LOGIN,
                target=EventTarget(entityType="user", entityId=user_id),
            ),
            user_id,
        )

    def user_logout(self, user_id: int) -> None:
        self.emit(
            AuditEventCreate(
                eventType=EventType.SYSTEM_USER_LOGOUT,
                target=EventTarget(entityType="user", entityId=user_id),
            ),
            user_id,
        )

    def user_created(self, new_user_id: int, actor_user_id: int) -> None:
        self.emit(
            AuditEventCreate(
                eventType=EventType.SYSTEM_USER_CREATE,
                target=EventTarget(entityType="user", entityId=new_user_id),
            ),
            actor_user_id,
        )

    def user_updated(self, target_user_id: int, actor_user_id: int) -> None:
        self.emit(
            AuditEventCreate(
                eventType=EventType.SYSTEM_USER_UPDATE,
                target=EventTarget(entityType="user", entityId=target_user_id),
            ),
            actor_user_id,
        )

    def catalog_test_created(self, test_id: int, test_code: str, actor_user_id: int) -> None:
        self.emit(
            AuditEventCreate(
                eventType=EventType.SYSTEM_CATALOG_CREATE,
                target=EventTarget(entityType="test_catalog", entityId=test_id),
                metadata={"test_code": test_code},
            ),
            actor_user_id,
        )

    def catalog_test_updated(self, test_id: int, test_code: str, actor_user_id: int) -> None:
        self.emit(
            AuditEventCreate(
                eventType=EventType.SYSTEM_CATALOG_UPDATE,
                target=EventTarget(entityType="test_catalog", entityId=test_id),
                metadata={"test_code": test_code},
            ),
            actor_user_id,
        )
