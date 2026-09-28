"""Domain-specific audit event emissions (dot-notation taxonomy)."""
from __future__ import annotations

from typing import Any

from app.models.order import Order
from app.models.user import User
from app.schemas.audit import AuditEventCreate, EventChanges, EventContext, EventTarget, EventType
from app.services.audit.write import AuditWriter
from sqlalchemy.orm import Session


class AuditEmitter:
    """Central helper for writing audit events from service-layer code."""

    def __init__(self, db: Session):
        self.db = db
        self._writer = AuditWriter(db)

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
        self._writer.log_event_sync(create, self._actor(user_id))

    def _emit(
        self,
        event_type: EventType,
        target_type: str,
        target_id: int,
        user_id: int | None,
        *,
        context: EventContext | None = None,
        changes: EventChanges | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        self.emit(
            AuditEventCreate(
                eventType=event_type,
                target=EventTarget(entityType=target_type, entityId=target_id),
                context=context,
                changes=changes,
                metadata=metadata,
            ),
            user_id,
        )

    # ── Patient ──────────────────────────────────────────────────────────

    def patient_created(self, patient_id: int, user_id: int) -> None:
        self._emit(
            EventType.PATIENT_CREATE,
            "patient",
            patient_id,
            user_id,
            context=EventContext(patientId=patient_id),
        )

    def patient_updated(self, patient_id: int, user_id: int, changes: dict[str, Any] | None = None) -> None:
        self._emit(
            EventType.PATIENT_UPDATE,
            "patient",
            patient_id,
            user_id,
            context=EventContext(patientId=patient_id),
            changes=EventChanges(newValues=changes or {}) if changes else None,
        )

    def patient_deleted(self, patient_id: int, user_id: int) -> None:
        self._emit(
            EventType.PATIENT_DELETE,
            "patient",
            patient_id,
            user_id,
            context=EventContext(patientId=patient_id),
        )

    def patient_viewed(self, patient_id: int, user_id: int) -> None:
        self._emit(
            EventType.PATIENT_VIEW,
            "patient",
            patient_id,
            user_id,
            context=EventContext(patientId=patient_id),
        )

    # ── Order ────────────────────────────────────────────────────────────

    def order_created(self, order_id: int, patient_id: int, user_id: int) -> None:
        self._emit(
            EventType.ORDER_CREATE,
            "order",
            order_id,
            user_id,
            context=EventContext(orderId=order_id, patientId=patient_id),
        )

    def order_updated(self, order_id: int, user_id: int, metadata: dict[str, Any] | None = None) -> None:
        self._emit(
            EventType.ORDER_UPDATE,
            "order",
            order_id,
            user_id,
            context=self._order_context(order_id),
            metadata=metadata,
        )

    def order_deleted(self, order_id: int, user_id: int) -> None:
        self._emit(
            EventType.ORDER_DELETE,
            "order",
            order_id,
            user_id,
            context=self._order_context(order_id),
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
        self._emit(
            EventType.ORDER_STATUS,
            "order",
            order_id,
            user_id,
            context=self._order_context(order_id),
            changes=EventChanges(
                oldValues={"status": old_status},
                newValues={"status": new_status},
            ),
            metadata=meta,
        )

    def order_test_added(self, order_id: int, order_test_id: int, test_code: str, user_id: int) -> None:
        self._emit(
            EventType.ORDER_TEST_ADD,
            "order_test",
            order_test_id,
            user_id,
            context=self._order_context(order_id, test_id=order_test_id),
            metadata={"test_code": test_code},
        )

    def order_test_removed(
        self,
        order_id: int,
        order_test_id: int,
        test_code: str,
        user_id: int,
        old_status: str,
    ) -> None:
        self._emit(
            EventType.ORDER_TEST_REMOVE,
            "order_test",
            order_test_id,
            user_id,
            context=self._order_context(order_id, test_id=order_test_id),
            changes=EventChanges(oldValues={"status": old_status}, newValues={"status": "removed"}),
            metadata={"test_code": test_code},
        )

    def order_test_cancelled(
        self,
        order_id: int,
        order_test_id: int,
        test_code: str,
        user_id: int,
        reason: str | None = None,
    ) -> None:
        self._emit(
            EventType.ORDER_TEST_CANCEL,
            "order_test",
            order_test_id,
            user_id,
            context=self._order_context(order_id, test_id=order_test_id),
            changes=EventChanges(newValues={"status": "cancelled"}),
            metadata={"test_code": test_code, "reason": reason},
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
        self._emit(
            EventType.ORDER_TEST_RETEST,
            "order_test",
            new_test_id,
            user_id,
            context=self._order_context(order_id, test_id=new_test_id),
            metadata={
                "test_code": test_code,
                "superseded_test_id": original_test_id,
                "reason": reason,
            },
        )

    def order_test_reflex(
        self,
        order_id: int,
        new_test_id: int,
        added_test_code: str,
        triggered_by_test_code: str,
        user_id: int | None,
    ) -> None:
        self._emit(
            EventType.ORDER_TEST_REFLEX,
            "order_test",
            new_test_id,
            user_id,
            context=self._order_context(order_id, test_id=new_test_id),
            metadata={
                "added_test_code": added_test_code,
                "triggered_by": triggered_by_test_code,
            },
        )

    # ── Laboratory — sample ──────────────────────────────────────────────

    def sample_created(self, sample_id: int, order_id: int, user_id: int | None) -> None:
        self._emit(
            EventType.LABORATORY_SAMPLE_CREATE,
            "sample",
            sample_id,
            user_id,
            context=self._order_context(order_id),
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
        self._emit(
            EventType.LABORATORY_SAMPLE_COLLECT,
            "sample",
            sample_id,
            user_id,
            context=self._order_context(order_id),
            changes=EventChanges(oldValues=before, newValues=after),
            metadata=metadata,
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
        self._emit(
            EventType.LABORATORY_SAMPLE_REJECT,
            "sample",
            sample_id,
            user_id,
            context=self._order_context(order_id),
            changes=EventChanges(
                oldValues={"status": old_status or "collected"},
                newValues={"status": "rejected"},
            ),
            metadata={"rejection_reason": reason, **(metadata or {})},
        )

    def sample_recollect_requested(
        self,
        sample_id: int,
        order_id: int,
        user_id: int,
        metadata: dict[str, Any],
    ) -> None:
        self._emit(
            EventType.LABORATORY_SAMPLE_RECOLLECT_REQUEST,
            "sample",
            sample_id,
            user_id,
            context=self._order_context(order_id),
            metadata=metadata,
        )

    def sample_recollect_approved(
        self,
        sample_id: int,
        order_id: int,
        user_id: int,
        metadata: dict[str, Any],
    ) -> None:
        self._emit(
            EventType.LABORATORY_SAMPLE_RECOLLECT_APPROVE,
            "sample",
            sample_id,
            user_id,
            context=self._order_context(order_id),
            metadata=metadata,
        )

    def sample_recollect_denied(
        self,
        sample_id: int,
        order_id: int,
        user_id: int,
        metadata: dict[str, Any],
    ) -> None:
        self._emit(
            EventType.LABORATORY_SAMPLE_RECOLLECT_DENY,
            "sample",
            sample_id,
            user_id,
            context=self._order_context(order_id),
            metadata=metadata,
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
        self._emit(
            EventType.LABORATORY_RESULT_ENTER,
            "order_test",
            order_test_id,
            user_id,
            context=self._order_context(order_id, test_id=order_test_id),
            changes=EventChanges(
                oldValues={"status": "sample-collected"},
                newValues={"status": "resulted"},
            ),
            metadata={"test_code": test_code, **(metadata or {})},
        )

    def result_updated(
        self,
        order_id: int,
        order_test_id: int,
        test_code: str,
        user_id: int,
        old_results: dict[str, Any] | list[Any] | None,
        new_results: dict[str, Any] | list[Any] | None,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        self._emit(
            EventType.LABORATORY_RESULT_UPDATE,
            "order_test",
            order_test_id,
            user_id,
            context=self._order_context(order_id, test_id=order_test_id),
            changes=EventChanges(
                oldValues={"results": old_results or {}},
                newValues={"results": new_results or {}},
            ),
            metadata={"test_code": test_code, **(metadata or {})},
        )

    def result_critical_detected(
        self,
        order_id: int,
        order_test_id: int,
        test_code: str,
        user_id: int,
        metadata: dict[str, Any],
    ) -> None:
        self._emit(
            EventType.LABORATORY_RESULT_CRITICAL_DETECT,
            "order_test",
            order_test_id,
            user_id,
            context=self._order_context(order_id, test_id=order_test_id),
            metadata={"test_code": test_code, **metadata},
        )

    def result_critical_notified(
        self,
        order_id: int,
        order_test_id: int,
        test_code: str,
        user_id: int,
        metadata: dict[str, Any],
    ) -> None:
        self._emit(
            EventType.LABORATORY_RESULT_CRITICAL_NOTIFY,
            "order_test",
            order_test_id,
            user_id,
            context=self._order_context(order_id, test_id=order_test_id),
            metadata={"test_code": test_code, **metadata},
        )

    def result_critical_acknowledged(
        self,
        order_id: int,
        order_test_id: int,
        test_code: str,
        user_id: int,
        metadata: dict[str, Any],
    ) -> None:
        self._emit(
            EventType.LABORATORY_RESULT_CRITICAL_ACKNOWLEDGE,
            "order_test",
            order_test_id,
            user_id,
            context=self._order_context(order_id, test_id=order_test_id),
            metadata={"test_code": test_code, **metadata},
        )

    def validation_approved(
        self,
        order_id: int,
        order_test_id: int,
        test_code: str,
        user_id: int,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        self._emit(
            EventType.LABORATORY_VALIDATION_APPROVE,
            "order_test",
            order_test_id,
            user_id,
            context=self._order_context(order_id, test_id=order_test_id),
            changes=EventChanges(
                oldValues={"status": "resulted"},
                newValues={"status": "validated"},
            ),
            metadata={"test_code": test_code, **(metadata or {})},
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
        self._emit(
            EventType.LABORATORY_VALIDATION_REJECT,
            target_type,
            target_id,
            user_id,
            context=self._order_context(
                order_id, test_id=order_test_id if order_test_id else None
            ),
            metadata=metadata,
        )

    def escalation_triggered(
        self,
        order_id: int,
        order_test_id: int,
        test_code: str,
        user_id: int,
        metadata: dict[str, Any],
    ) -> None:
        self._emit(
            EventType.LABORATORY_ESCALATION_TRIGGER,
            "order_test",
            order_test_id,
            user_id,
            context=self._order_context(order_id, test_id=order_test_id),
            changes=EventChanges(newValues={"status": "escalated"}),
            metadata={"test_code": test_code, **metadata},
        )

    def escalation_resolved(
        self,
        order_id: int,
        order_test_id: int,
        test_code: str,
        user_id: int,
        metadata: dict[str, Any],
    ) -> None:
        self._emit(
            EventType.LABORATORY_ESCALATION_RESOLVE,
            "order_test",
            order_test_id,
            user_id,
            context=self._order_context(order_id, test_id=order_test_id),
            metadata={"test_code": test_code, **metadata},
        )

    # ── Billing ──────────────────────────────────────────────────────────

    def payment_processed(
        self,
        order_id: int,
        payment_id: int,
        user_id: int,
        metadata: dict[str, Any],
    ) -> None:
        self._emit(
            EventType.BILLING_PAYMENT_PROCESS,
            "payment",
            payment_id,
            user_id,
            context=self._order_context(order_id),
            metadata=metadata,
        )

    def invoice_generated(self, order_id: int, invoice_id: int, user_id: int | None) -> None:
        self._emit(
            EventType.BILLING_INVOICE_GENERATE,
            "invoice",
            invoice_id,
            user_id,
            context=self._order_context(order_id),
        )

    def invoice_voided(
        self,
        order_id: int,
        invoice_id: int,
        user_id: int,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        self._emit(
            EventType.BILLING_INVOICE_VOID,
            "invoice",
            invoice_id,
            user_id,
            context=self._order_context(order_id),
            metadata=metadata,
        )

    def insurance_submitted(
        self,
        order_id: int,
        claim_id: int,
        user_id: int,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        self._emit(
            EventType.BILLING_INSURANCE_SUBMIT,
            "insurance_claim",
            claim_id,
            user_id,
            context=self._order_context(order_id),
            metadata=metadata,
        )

    # ── Reporting / system ───────────────────────────────────────────────

    def reporting_generated(self, order_id: int, user_id: int) -> None:
        self._emit(
            EventType.REPORTING_GENERATE,
            "order",
            order_id,
            user_id,
            context=self._order_context(order_id),
        )

    def reporting_downloaded(
        self,
        order_id: int,
        order_test_id: int,
        user_id: int,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        self._emit(
            EventType.REPORTING_DOWNLOAD,
            "order_test",
            order_test_id,
            user_id,
            context=self._order_context(order_id, test_id=order_test_id),
            metadata=metadata,
        )

    def user_login(self, user_id: int) -> None:
        self._emit(EventType.SYSTEM_USER_LOGIN, "user", user_id, user_id)

    def user_logout(self, user_id: int) -> None:
        self._emit(EventType.SYSTEM_USER_LOGOUT, "user", user_id, user_id)

    def user_created(self, new_user_id: int, actor_user_id: int) -> None:
        self._emit(EventType.SYSTEM_USER_CREATE, "user", new_user_id, actor_user_id)

    def user_updated(self, target_user_id: int, actor_user_id: int) -> None:
        self._emit(EventType.SYSTEM_USER_UPDATE, "user", target_user_id, actor_user_id)

    def catalog_test_created(self, test_id: int, test_code: str, actor_user_id: int) -> None:
        self._emit(
            EventType.SYSTEM_CATALOG_CREATE,
            "test_catalog",
            test_id,
            actor_user_id,
            metadata={"test_code": test_code},
        )

    def catalog_test_updated(self, test_id: int, test_code: str, actor_user_id: int) -> None:
        self._emit(
            EventType.SYSTEM_CATALOG_UPDATE,
            "test_catalog",
            test_id,
            actor_user_id,
            metadata={"test_code": test_code},
        )
