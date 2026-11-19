"""Emit domain audit events from service-layer code."""
from __future__ import annotations

import logging
from typing import Any

from app.domains.audit.schemas import (
    AuditEventCreate,
    EventChanges,
    EventContext,
    EventTarget,
    EventType,
)
from app.domains.audit.writer import AuditWriter
from app.domains.orders.models import Order
from app.domains.users.models import User
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


class AuditEmitter:
    """Central helper for writing audit events from service-layer code."""

    def __init__(self, db: Session):
        self.db = db
        self._writer = AuditWriter(db)

    def _actor(self, user_id: str | None) -> User | None:
        if not user_id:
            return None
        return self.db.query(User).filter(User.id == str(user_id)).first()

    def _order_context(self, order_id: str, test_id: int | None = None) -> EventContext:
        order = self.db.query(Order).filter(Order.orderId == order_id).first()
        return EventContext(
            orderId=order_id,
            patientId=order.patientId if order else None,
            testId=test_id,
        )

    def emit(self, create: AuditEventCreate, user_id: str | None) -> None:
        user = self._actor(user_id)
        self._writer.log_event_sync(create, user, acting_user_id=user_id)

    def _emit(
        self,
        event_type: EventType,
        target_type: str,
        target_id: str | int,
        user_id: str | None,
        *,
        context: EventContext | None = None,
        changes: EventChanges | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        self.emit(
            AuditEventCreate(
                eventType=event_type,
                target=EventTarget(entityType=target_type, entityId=str(target_id)),
                context=context,
                changes=changes,
                metadata=metadata,
            ),
            user_id,
        )

    # ── Patient ──────────────────────────────────────────────────────────

    def patient_created(self, patient_id: str, user_id: str) -> None:
        self._emit(
            EventType.PATIENT_CREATE,
            "patient",
            patient_id,
            user_id,
            context=EventContext(patientId=patient_id),
        )

    def patient_created_forced(
        self,
        patient_id: str,
        user_id: str,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        self._emit(
            EventType.PATIENT_CREATE_FORCED,
            "patient",
            patient_id,
            user_id,
            context=EventContext(patientId=patient_id),
            metadata=metadata,
        )

    def patient_updated(
        self, patient_id: str, user_id: str, changes: dict[str, Any] | None = None
    ) -> None:
        self._emit(
            EventType.PATIENT_UPDATE,
            "patient",
            patient_id,
            user_id,
            context=EventContext(patientId=patient_id),
            changes=EventChanges(newValues=changes or {}) if changes else None,
        )

    def patient_deleted(self, patient_id: str, user_id: str) -> None:
        self._emit(
            EventType.PATIENT_DELETE,
            "patient",
            patient_id,
            user_id,
            context=EventContext(patientId=patient_id),
        )

    def patient_viewed(self, patient_id: str, user_id: str) -> None:
        self._emit(
            EventType.PATIENT_VIEW,
            "patient",
            patient_id,
            user_id,
            context=EventContext(patientId=patient_id),
        )

    # ── Order ────────────────────────────────────────────────────────────

    def order_created(self, order_id: str, patient_id: str, user_id: str) -> None:
        self._emit(
            EventType.ORDER_CREATE,
            "order",
            order_id,
            user_id,
            context=EventContext(orderId=order_id, patientId=patient_id),
        )

    def order_updated(
        self, order_id: str, user_id: str, metadata: dict[str, Any] | None = None
    ) -> None:
        self._emit(
            EventType.ORDER_UPDATE,
            "order",
            order_id,
            user_id,
            context=self._order_context(order_id),
            metadata=metadata,
        )

    def order_deleted(self, order_id: str, user_id: str) -> None:
        self._emit(
            EventType.ORDER_DELETE,
            "order",
            order_id,
            user_id,
            context=self._order_context(order_id),
        )

    def order_status_changed(
        self,
        order_id: str,
        old_status: str | None,
        new_status: str,
        user_id: str | None = None,
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

    def order_test_added(
        self, order_id: str, order_test_id: int, test_code: str, user_id: str
    ) -> None:
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
        order_id: str,
        order_test_id: int,
        test_code: str,
        user_id: str,
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
        order_id: str,
        order_test_id: int,
        test_code: str,
        user_id: str,
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
        order_id: str,
        original_test_id: int,
        new_test_id: int,
        test_code: str,
        user_id: str,
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
        order_id: str,
        new_test_id: int,
        added_test_code: str,
        triggered_by_test_code: str,
        user_id: str | None,
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

    def sample_created(
        self,
        sample_id: str,
        order_id: str,
        user_id: str | None,
        *,
        test_codes: list[str] | None = None,
    ) -> None:
        metadata: dict[str, Any] | None = None
        if test_codes:
            metadata = {"test_codes": list(test_codes)}
        self._emit(
            EventType.LABORATORY_SAMPLE_CREATE,
            "sample",
            sample_id,
            user_id,
            context=self._order_context(order_id),
            metadata=metadata,
        )

    def sample_aliquot_created(
        self,
        sample_id: str,
        parent_sample_id: str,
        order_id: str,
        user_id: str,
        *,
        aliquot_index: int,
    ) -> None:
        self._emit(
            EventType.LABORATORY_SAMPLE_ALIQUOT,
            "sample",
            sample_id,
            user_id,
            context=self._order_context(order_id),
            metadata={
                "parent_sample_id": parent_sample_id,
                "aliquot_index": aliquot_index,
            },
        )

    def sample_collected(
        self,
        sample_id: str,
        order_id: str,
        user_id: str,
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
        sample_id: str,
        order_id: str,
        user_id: str,
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
        sample_id: str,
        order_id: str,
        user_id: str,
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
        sample_id: str,
        order_id: str,
        user_id: str,
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
        sample_id: str,
        order_id: str,
        user_id: str,
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

    # ── Laboratory — analyzer / result / validation ──────────────────────

    def analyzer_duplicate_ingest(
        self,
        order_id: str,
        order_test_id: int,
        test_code: str,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        self._emit(
            EventType.LABORATORY_ANALYZER_DUPLICATE_INGEST,
            "order_test",
            order_test_id,
            None,
            context=self._order_context(order_id, test_id=order_test_id),
            metadata={"test_code": test_code, **(metadata or {})},
        )

    def analyzer_ingest_rejected(
        self,
        order_id: str | None,
        order_test_id: int | None,
        test_code: str | None,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        if order_id is None and order_test_id is None:
            logger.warning(
                "Skipping analyzer_ingest_rejected persist: no order_id or order_test_id"
            )
            return
        target_id = order_test_id if order_test_id is not None else order_id
        if target_id is None:
            return
        target_type = "order_test" if order_test_id is not None else "order"
        # Unmatched analyzer rejects have no orderId — they only appear on stream feeds.
        ctx = EventContext(orderId=order_id, testId=order_test_id) if order_id else None
        self._emit(
            EventType.LABORATORY_ANALYZER_INGEST_REJECTED,
            target_type,
            target_id,
            None,
            context=ctx,
            metadata={
                **({"test_code": test_code} if test_code else {}),
                **(metadata or {}),
            },
        )

    def result_entered(
        self,
        order_id: str,
        order_test_id: int,
        test_code: str,
        user_id: str,
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
        order_id: str,
        order_test_id: int,
        test_code: str,
        user_id: str,
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
        order_id: str,
        order_test_id: int,
        test_code: str,
        user_id: str,
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
        order_id: str,
        order_test_id: int,
        test_code: str,
        user_id: str,
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
        order_id: str,
        order_test_id: int,
        test_code: str,
        user_id: str,
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
        order_id: str,
        order_test_id: int,
        test_code: str,
        user_id: str,
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

    def validation_auto(
        self,
        order_id: str,
        order_test_id: int,
        test_code: str,
        user_id: str,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        self._emit(
            EventType.LABORATORY_VALIDATION_AUTO,
            "order_test",
            order_test_id,
            user_id,
            context=self._order_context(order_id, test_id=order_test_id),
            metadata={"test_code": test_code, **(metadata or {})},
        )

    def validation_rejected(
        self,
        order_id: str,
        order_test_id: int | None,
        sample_id: str | None,
        user_id: str,
        metadata: dict[str, Any],
    ) -> None:
        target_type = "order_test" if order_test_id else "sample"
        target_id = (
            str(order_test_id) if order_test_id is not None else (sample_id or "")
        )
        if not target_id:
            return
        # Always attach orderId so sample-targeted rejects still appear on order scope.
        self._emit(
            EventType.LABORATORY_VALIDATION_REJECT,
            target_type,
            target_id,
            user_id,
            context=self._order_context(order_id, test_id=order_test_id if order_test_id else None),
            metadata=metadata,
        )

    def escalation_triggered(
        self,
        order_id: str,
        order_test_id: int,
        test_code: str,
        user_id: str,
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
        order_id: str,
        order_test_id: int,
        test_code: str,
        user_id: str,
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
        order_id: str,
        payment_id: int,
        user_id: str,
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

    def invoice_generated(self, order_id: str, invoice_id: str, user_id: str | None) -> None:
        self._emit(
            EventType.BILLING_INVOICE_GENERATE,
            "invoice",
            invoice_id,
            user_id,
            context=self._order_context(order_id),
        )

    def invoice_voided(
        self,
        order_id: str,
        invoice_id: str,
        user_id: str,
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
        order_id: str,
        claim_id: int,
        user_id: str,
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

    def reporting_generated(self, order_id: str, user_id: str) -> None:
        self._emit(
            EventType.REPORTING_GENERATE,
            "order",
            order_id,
            user_id,
            context=self._order_context(order_id),
        )

    def reporting_downloaded(
        self,
        order_id: str,
        user_id: str,
        order_test_id: int | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        if order_test_id is not None:
            self._emit(
                EventType.REPORTING_DOWNLOAD,
                "order_test",
                order_test_id,
                user_id,
                context=self._order_context(order_id, test_id=order_test_id),
                metadata=metadata,
            )
            return
        self._emit(
            EventType.REPORTING_DOWNLOAD,
            "order",
            order_id,
            user_id,
            context=self._order_context(order_id),
            metadata=metadata,
        )

    def user_login(self, user_id: str) -> None:
        self._emit(EventType.SYSTEM_USER_LOGIN, "user", user_id, user_id)

    def user_logout(self, user_id: str) -> None:
        self._emit(EventType.SYSTEM_USER_LOGOUT, "user", user_id, user_id)

    def user_created(self, new_user_id: str, actor_user_id: str) -> None:
        self._emit(EventType.SYSTEM_USER_CREATE, "user", new_user_id, actor_user_id)

    def user_updated(
        self,
        target_user_id: str,
        actor_user_id: str,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        self._emit(
            EventType.SYSTEM_USER_UPDATE,
            "user",
            target_user_id,
            actor_user_id,
            metadata=metadata,
        )

    def catalog_test_created(self, test_id: int, test_code: str, actor_user_id: str) -> None:
        self._emit(
            EventType.SYSTEM_CATALOG_CREATE,
            "test_catalog",
            test_id,
            actor_user_id,
            metadata={"test_code": test_code},
        )

    def catalog_test_updated(self, test_id: int, test_code: str, actor_user_id: str) -> None:
        self._emit(
            EventType.SYSTEM_CATALOG_UPDATE,
            "test_catalog",
            test_id,
            actor_user_id,
            metadata={"test_code": test_code},
        )

