"""
Delta check — compare current result to patient's last validated value for same analyte.
"""
from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

from app.models.order import Order, OrderTest
from app.models.test import Test
from app.schemas.enums import (
    EscalationReasonCode,
    LabOperationType,
    OrderStatus,
    RemedyType,
    SampleStatus,
    TestStatus,
)
from app.services.lab.samples import generate_samples_for_order
from app.services.lab.state import TestStateMachine
from app.services.orders import OrderService, build_order_completion_metadata, update_order_status
from app.utils.common import parse_numeric_result_value
from app.utils.exceptions import LabOperationError
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

DEFAULT_DELTA_PERCENT = 20.0


@dataclass
class DeltaCheckWarning:
    item_code: str
    current_value: float
    prior_value: float
    percent_change: float
    prior_order_test_id: int
    prior_validated_at: str


class DeltaCheckService:
    def __init__(self, db: Session):
        self.db = db

    def check_results(
        self,
        patient_id: int,
        test_code: str,
        results: dict[str, Any],
        exclude_order_test_id: int | None = None,
        delta_percent: float = DEFAULT_DELTA_PERCENT,
    ) -> list[DeltaCheckWarning]:
        warnings: list[DeltaCheckWarning] = []
        prior_tests = (
            self.db.query(OrderTest, Order)
            .join(Order, OrderTest.orderId == Order.orderId)
            .filter(
                Order.patientId == patient_id,
                OrderTest.testCode == test_code,
                OrderTest.status == TestStatus.VALIDATED,
                OrderTest.results.isnot(None),
            )
            .order_by(OrderTest.resultValidatedAt.desc())
            .limit(5)
            .all()
        )

        prior_results: dict[str, float] = {}
        prior_meta: dict[str, tuple] = {}
        for ot, _order in prior_tests:
            if exclude_order_test_id and ot.id == exclude_order_test_id:
                continue
            if not ot.results:
                continue
            for code, value in ot.results.items():
                if code in prior_results:
                    continue
                numeric = parse_numeric_result_value(value)
                if numeric is not None:
                    prior_results[code] = numeric
                    prior_meta[code] = (
                        ot.id,
                        ot.resultValidatedAt.isoformat() if ot.resultValidatedAt else "",
                    )

        for item_code, value in results.items():
            current = parse_numeric_result_value(value)
            prior = prior_results.get(item_code)
            if current is None or prior is None or prior == 0:
                continue
            pct = abs((current - prior) / prior) * 100.0
            if pct >= delta_percent:
                meta = prior_meta[item_code]
                warnings.append(
                    DeltaCheckWarning(
                        item_code=item_code,
                        current_value=current,
                        prior_value=prior,
                        percent_change=round(pct, 1),
                        prior_order_test_id=meta[0],
                        prior_validated_at=meta[1],
                    )
                )
        return warnings


"""
Reflex testing engine — add linked tests after validation based on catalog rules.

Rule format (stored in test catalog panels JSON or REFLEX_RULES below):
  {"item": "HGB", "operator": "lt", "value": 7.0, "addTest": "IRON001", "rule": "Low HGB reflex iron"}
"""


# Catalog-level reflex rules keyed by triggering test code
REFLEX_RULES: dict[str, list[dict[str, Any]]] = {}


@dataclass
class ReflexTriggerResult:
    added_test_code: str
    rule_description: str
    order_test_id: int


class ReflexEngine:
    def __init__(self, db: Session):
        self.db = db

    def _load_rules(self, test_code: str, test_def: Test | None) -> list[dict[str, Any]]:
        rules = list(REFLEX_RULES.get(test_code, []))
        if test_def and test_def.panels:
            panels = test_def.panels
            if isinstance(panels, str):
                try:
                    panels = json.loads(panels)
                except json.JSONDecodeError:
                    panels = []
            if isinstance(panels, list):
                for entry in panels:
                    if isinstance(entry, dict) and entry.get("type") == "reflex":
                        rules.append(entry)
        return rules

    def _evaluate_rule(self, rule: dict[str, Any], results: dict[str, Any]) -> bool:
        item = rule.get("item")
        if not item or item not in results:
            return False
        value = parse_numeric_result_value(results[item])
        if value is None:
            return False
        threshold = rule.get("value")
        op = rule.get("operator", "gt")
        if threshold is None:
            return False
        if op == "gt":
            return value > threshold
        if op == "gte":
            return value >= threshold
        if op == "lt":
            return value < threshold
        if op == "lte":
            return value <= threshold
        if op == "eq":
            return value == threshold
        return False

    def evaluate_after_validation(
        self,
        order_test: OrderTest,
        user_id: int,
    ) -> list[ReflexTriggerResult]:
        if not order_test.results:
            return []

        order = self.db.query(Order).filter(Order.orderId == order_test.orderId).first()
        if not order:
            return []

        test_def = self.db.query(Test).filter(Test.code == order_test.testCode).first()
        rules = self._load_rules(order_test.testCode, test_def)
        if not rules:
            return []

        added: list[ReflexTriggerResult] = []
        existing_codes = {
            t.testCode
            for t in self.db.query(OrderTest).filter(OrderTest.orderId == order.orderId).all()
            if t.status not in (TestStatus.CANCELLED, TestStatus.REMOVED, TestStatus.SUPERSEDED)
        }

        for rule in rules:
            add_code = rule.get("addTest")
            if not add_code or add_code in existing_codes:
                continue
            if not self._evaluate_rule(rule, order_test.results):
                continue

            reflex_test_def = (
                self.db.query(Test).filter(Test.code == add_code, Test.isActive.is_(True)).first()
            )
            if not reflex_test_def:
                continue

            new_ot = OrderTest(
                orderId=order.orderId,
                testCode=add_code,
                status=TestStatus.PENDING,
                priceAtOrder=reflex_test_def.price,
                isReflexTest=True,
                triggeredBy=order_test.testCode,
                reflexRule=rule.get("rule") or f"Reflex from {order_test.testCode}",
            )
            self.db.add(new_ot)
            self.db.flush()

            generate_samples_for_order(order.orderId, self.db, user_id)

            added.append(
                ReflexTriggerResult(
                    added_test_code=add_code,
                    rule_description=new_ot.reflexRule or "",
                    order_test_id=new_ot.id,
                )
            )
            existing_codes.add(add_code)

        return added


"""Lab workflow resultoperations operations."""


class ResultOperations:
    def __init__(self, svc):
        self._svc = svc

    def enter_results(
        self,
        order_test_id: int,
        user_id: int,
        results: dict[str, Any],
        technician_notes: str | None = None,
        skip_validation: bool = False,
    ) -> OrderTest:
        order_test = self._svc._get_order_test(order_test_id, for_update=True)  # Add row lock
        order_id = order_test.orderId
        test_code = order_test.testCode

        can_enter, reason = TestStateMachine.can_enter_results(order_test.status)
        if not can_enter:
            raise LabOperationError(reason, status_code=400)

        test_def = self._svc.db.query(Test).filter(Test.code == test_code).first()
        result_items = test_def.resultItems if test_def else []

        if not skip_validation and result_items:
            validation_errors = self._svc.result_validator.validate_results(results, result_items)
            if self._svc.result_validator.has_blocking_errors(validation_errors):
                error_msg = self._svc.result_validator.format_error_message(validation_errors)
                raise LabOperationError(error_msg, status_code=400, error_code="VALIDATION_ERROR")

        order = self._svc.db.query(Order).filter(Order.orderId == order_id).first()
        patient = order.patient if order else None
        patient_gender = patient.gender.value if patient and patient.gender else None
        patient_dob = patient.dateOfBirth if patient else None

        flags = []
        if result_items:
            flags = self._svc.flag_calculator.calculate_flags(
                results=results,
                result_items=result_items,
                patient_gender=patient_gender,
                patient_dob=patient_dob,
            )

        results_serializable = self._svc._results_to_json_serializable(results)
        order_test.results = results_serializable
        order_test.resultEnteredAt = datetime.now(UTC)
        order_test.enteredBy = str(user_id)
        order_test.technicianNotes = technician_notes
        if flags:
            order_test.flags = self._svc.flag_calculator.flags_to_string_list(flags)
            flag_modified(order_test, "flags")

        has_critical = self._svc.flag_calculator.has_critical_values(flags)
        order_test.hasCriticalValues = has_critical

        if order and patient:
            delta_warnings = DeltaCheckService(self._svc.db).check_results(
                patient_id=order.patientId,
                test_code=test_code,
                results=results_serializable,
                exclude_order_test_id=order_test.id,
            )
            if delta_warnings:
                delta_flag_strings = [
                    f"DELTA:{w.item_code}:{w.percent_change}" for w in delta_warnings
                ]
                existing_flags = list(order_test.flags or [])
                order_test.flags = existing_flags + delta_flag_strings
                flag_modified(order_test, "flags")
                self._svc.audit.log_operation(
                    operation_type=LabOperationType.RESULT_ENTRY,
                    entity_type="order_test",
                    entity_id=order_test.id,
                    user_id=user_id,
                    metadata={
                        "deltaChecks": [
                            {
                                "itemCode": w.item_code,
                                "percentChange": w.percent_change,
                                "priorValue": w.prior_value,
                                "currentValue": w.current_value,
                            }
                            for w in delta_warnings
                        ]
                    },
                )

        if has_critical:
            critical_flags = self._svc.flag_calculator.get_critical_flags(flags)
            self._svc.audit.log_critical_value_detected(
                order_id=order_id,
                test_id=order_test.id,
                test_code=test_code,
                user_id=user_id,
                critical_values=self._svc.flag_calculator.flags_to_json(critical_flags),
            )
            self._svc.escalation.escalate_test(
                order_test,
                EscalationReasonCode.CRIT_VAL,
                user_id,
                metadata={
                    "criticalValues": self._svc.flag_calculator.flags_to_json(critical_flags),
                    "results": results_serializable,
                },
                from_status=TestStatus.SAMPLE_COLLECTED,
            )
        else:
            order_test.status = TestStatus.RESULTED

        self._svc.audit.log_result_entry(
            order_id=order_id,
            test_code=test_code,
            test_id=order_test.id,
            user_id=user_id,
            results=results_serializable,
            comment=technician_notes,
        )

        self._svc.db.commit()
        self._svc.db.refresh(order_test)
        update_order_status(self._svc.db, order_id)
        return order_test

    def validate_results(
        self,
        order_test_id: int,
        user_id: int,
        validation_notes: str | None = None,
    ) -> OrderTest:
        order_test = self._svc._get_order_test(
            order_test_id, status=TestStatus.RESULTED, for_update=True
        )  # Add row lock
        order_id = order_test.orderId
        test_code = order_test.testCode

        # Note: The status filter above ensures order_test.status == RESULTED,
        # so no need for additional escalation check here.

        can_validate, reason = TestStateMachine.can_validate(order_test.status)
        if not can_validate:
            raise LabOperationError(reason)

        # Allow approve even when linked specimen is rejected — validator owns the decision.
        # Record that context in validation notes for audit when applicable.
        if order_test.sampleId:
            sample = self._svc._get_sample(order_test.sampleId)
            if sample.status == SampleStatus.REJECTED:
                reject_note = (
                    f"[Approved with rejected specimen {sample.sampleId}"
                    f"{f': {sample.rejectionReason}' if sample.rejectionReason else ''}]"
                )
                validation_notes = (
                    f"{validation_notes.strip()} {reject_note}".strip()
                    if validation_notes and validation_notes.strip()
                    else reject_note
                )

        order_test.resultValidatedAt = datetime.now(UTC)
        order_test.validatedBy = str(user_id)
        order_test.validationNotes = validation_notes
        order_test.status = TestStatus.VALIDATED

        order = self._svc.db.query(Order).filter(Order.orderId == order_id).first()
        completion_meta = build_order_completion_metadata(order) if order else {}

        self._svc.audit.log_result_validation_approve(
            order_id=order_id,
            test_code=test_code,
            test_id=order_test.id,
            user_id=user_id,
            validation_notes=validation_notes,
            metadata=completion_meta,
        )

        reflex_added = ReflexEngine(self._svc.db).evaluate_after_validation(order_test, user_id)
        if reflex_added:
            reflex_note = "; ".join(
                f"Reflex {r.added_test_code}: {r.rule_description}" for r in reflex_added
            )
            order_test.validationNotes = (
                f"{order_test.validationNotes or ''} [{reflex_note}]".strip()
            )

        self._svc.db.commit()
        self._svc.db.refresh(order_test)
        update_order_status(self._svc.db, order_id)

        order = self._svc.db.query(Order).filter(Order.orderId == order_id).first()
        if order and order.overallStatus == OrderStatus.COMPLETED:
            try:
                OrderService(self._svc.db).mark_as_reported(order_id)
            except Exception:
                pass

        return order_test

    def reject_results(
        self,
        order_test_id: int,
        user_id: int,
        rejection_reason: str,
        validation_notes: str | None = None,
        preferred_remedy: RemedyType | None = None,
    ):
        """Reject resulted test via validate endpoint (delegates to quality workflow)."""
        return self._svc.quality._report_test_issue(
            order_test_id=order_test_id,
            user_id=user_id,
            reason=rejection_reason,
            notes=validation_notes,
            preferred_remedy=preferred_remedy,
        )

    def request_amendment(
        self,
        order_test_id: int,
        user_id: int,
        amendment_reason: str,
        proposed_results: dict[str, Any] | None = None,
        notes: str | None = None,
    ) -> OrderTest:
        """
        Request amendment for a validated test result.
        Creates AMEND-RES escalation for supervisor review.
        """
        order_test = self._svc._get_order_test(order_test_id, status=TestStatus.VALIDATED)
        order_id = order_test.orderId

        # Validate transition from VALIDATED to ESCALATED
        can_escalate, reason = TestStateMachine.can_transition(
            TestStatus.VALIDATED, TestStatus.ESCALATED
        )
        if not can_escalate:
            raise LabOperationError(reason, status_code=400)

        # Prepare metadata with amendment details
        metadata = {
            "amendmentReason": amendment_reason,
            "originalResults": order_test.results,
            "originalValidatedAt": order_test.resultValidatedAt.isoformat()
            if order_test.resultValidatedAt
            else None,
            "originalValidatedBy": order_test.validatedBy,
            "requestNotes": notes,
        }
        if proposed_results:
            metadata["proposedResults"] = proposed_results

        # Create escalation ticket
        ticket = self._svc.escalation.escalate_test(
            order_test,
            EscalationReasonCode.AMEND_RES,
            user_id,
            metadata=metadata,
            from_status=TestStatus.VALIDATED,
        )

        self._svc.audit.log_operation(
            operation_type=LabOperationType.QUALITY_ISSUE_REPORTED,
            entity_type="order_test",
            entity_id=order_test.id,
            user_id=user_id,
            metadata={
                "stage": "amendment",
                "reason": amendment_reason,
                "ticketId": ticket.id,
            },
        )

        self._svc.db.commit()
        self._svc.db.refresh(order_test)
        update_order_status(self._svc.db, order_id)
        return order_test
