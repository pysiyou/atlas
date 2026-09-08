"""
Escalation Resolution Service - handles supervisor escalation resolutions.

Extracted from LabOperationsService to separate concerns.
"""
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.models.order import Order, OrderTest
from app.models.test import Test
from app.schemas.enums import (
    EscalationReasonCode,
    EscalationResolutionAction,
    LabOperationType,
    TestStatus,
)
from app.services.audit_service import AuditService
from app.services.escalation_engine import EscalationEngine
from app.services.flag_calculator import FlagCalculatorService
from app.services.order_status_updater import update_order_status
from app.services.quality import QualityIssueService
from app.services.result_validator import ResultValidatorService
from app.services.sample_collection import SampleCollectionService
from app.services.state_machine import TestStateMachine
from app.utils.exceptions import LabOperationError


class EscalationResolveResult(BaseModel):
    success: bool
    action: EscalationResolutionAction
    message: str
    escalatedTestId: int
    createdTestId: Optional[int] = None


class EscalationResolverService:
    """
    Handles all escalation resolution actions.
    
    Separated from LabOperationsService for single responsibility.
    """
    
    def __init__(
        self,
        db: Session,
        audit: AuditService,
        escalation: EscalationEngine,
        quality: QualityIssueService,
        result_validator: ResultValidatorService,
        flag_calculator: FlagCalculatorService,
    ):
        self.db = db
        self.audit = audit
        self.escalation = escalation
        self.quality = quality
        self.result_validator = result_validator
        self.flag_calculator = flag_calculator
        self.collection = SampleCollectionService(db)
    
    def resolve(
        self,
        order_test_id: int,
        user_id: int,
        action: EscalationResolutionAction,
        validation_notes: Optional[str] = None,
        read_back_payload: Optional[Dict[str, Any]] = None,
    ) -> EscalationResolveResult:
        """Route to appropriate resolver based on action."""
        order_test = self._get_order_test(order_test_id)
        
        if action == EscalationResolutionAction.FORCE_VALIDATE:
            return self.force_validate(order_test, user_id, validation_notes, read_back_payload)
        elif action == EscalationResolutionAction.AUTHORIZE_RETEST:
            return self.authorize_retest(order_test, user_id, validation_notes or "Retest authorized")
        elif action == EscalationResolutionAction.AUTHORIZE_RECOLLECT:
            return self.authorize_recollect(order_test, user_id, validation_notes or "Recollection authorized")
        elif action == EscalationResolutionAction.APPLY_AMENDMENT:
            return self.apply_amendment(order_test, user_id, validation_notes)
        elif action == EscalationResolutionAction.CANCEL:
            return self.cancel_test(order_test, user_id, validation_notes or "Cancelled by supervisor")
        else:
            raise LabOperationError(f"Unknown resolution action: {action}", status_code=400)
    
    def _get_order_test(self, order_test_id: int) -> OrderTest:
        """Get order test with row lock."""
        order_test = (
            self.db.query(OrderTest)
            .filter(OrderTest.id == order_test_id)
            .with_for_update()
            .first()
        )
        if not order_test:
            raise LabOperationError(f"Test {order_test_id} not found", status_code=404)
        return order_test
    
    def force_validate(
        self,
        order_test: OrderTest,
        user_id: int,
        validation_notes: Optional[str],
        read_back_payload: Optional[Dict[str, Any]],
    ) -> EscalationResolveResult:
        """Force validate an escalated test."""
        ticket = self.escalation.resolve_ticket(
            order_test.id,
            EscalationResolutionAction.FORCE_VALIDATE,
            user_id,
            notes=validation_notes,
            read_back_payload=read_back_payload,
        )
        
        order_test.resultValidatedAt = datetime.now(timezone.utc)
        order_test.validatedBy = str(user_id)
        order_test.validationNotes = validation_notes
        order_test.status = TestStatus.VALIDATED
        
        self.audit.log_escalation_resolution_force_validate(
            order_id=order_test.orderId,
            test_code=order_test.testCode,
            test_id=order_test.id,
            ticket_id=ticket.id,
            user_id=user_id,
            validation_notes=validation_notes,
            metadata=ticket.ticketMetadata,
        )
        
        self.db.commit()
        self.db.refresh(order_test)
        update_order_status(self.db, order_test.orderId)
        
        return EscalationResolveResult(
            success=True,
            action=EscalationResolutionAction.FORCE_VALIDATE,
            message="Test force-validated.",
            escalatedTestId=order_test.id,
        )
    
    def authorize_retest(
        self,
        original_test: OrderTest,
        user_id: int,
        reason: str,
    ) -> EscalationResolveResult:
        """Authorize a retest for an escalated test."""
        # Create retest using quality service
        new_test = self.quality._create_retest(
            original_test,
            user_id,
            reason,
            None,
            retest_number=0,
            technician_note_prefix="Supervisor authorized re-test",
        )
        
        # Record quality issue
        issue = self.quality._record_issue(
            order_id=original_test.orderId,
            stage=QualityStage.VALIDATION,
            domain=QualityDomain.ANALYTICAL,
            reason=reason,
            notes=None,
            remedy=RemedyType.RETRY_SAME_SAMPLE,
            user_id=user_id,
            order_test_id=original_test.id,
            sample_id=original_test.sampleId,
            test_code=original_test.testCode,
            created_test_id=new_test.id,
        )
        
        ticket = self.escalation.resolve_ticket(
            original_test.id,
            EscalationResolutionAction.AUTHORIZE_RETEST,
            user_id,
            notes=reason,
        )
        
        self.audit.log_escalation_resolution_authorize_retest(
            order_id=original_test.orderId,
            test_code=original_test.testCode,
            original_test_id=original_test.id,
            new_test_id=new_test.id,
            ticket_id=ticket.id,
            user_id=user_id,
            reason=reason,
        )
        
        self.db.commit()
        self.db.refresh(new_test)
        update_order_status(self.db, original_test.orderId)
        
        return EscalationResolveResult(
            success=True,
            action=EscalationResolutionAction.AUTHORIZE_RETEST,
            message="Retest authorized and scheduled.",
            escalatedTestId=original_test.id,
            createdTestId=new_test.id,
        )
    
    def authorize_recollect(
        self,
        original_test: OrderTest,
        user_id: int,
        reason: str,
    ) -> EscalationResolveResult:
        """Authorize recollection for an escalated test."""
        if not original_test.sampleId:
            raise LabOperationError("No sample linked to this test", status_code=400)
        
        sample = self.db.query(Sample).filter(Sample.sampleId == original_test.sampleId).first()
        if not sample:
            raise LabOperationError("Sample not found", status_code=404)
        
        # Create recollection sample
        new_sample = self.quality._create_recollection_sample(
            sample,
            user_id,
            reason,
            test_codes=[original_test.testCode],
            supervisor_authorized=True,
        )
        
        # Create new test on recollection sample
        new_test = OrderTest(
            orderId=original_test.orderId,
            testCode=original_test.testCode,
            status=TestStatus.PENDING,
            priceAtOrder=original_test.priceAtOrder,
            sampleId=new_sample.sampleId,
            retestOfTestId=original_test.id,
            retestNumber=0,
        )
        self.db.add(new_test)
        self.db.flush()
        
        original_test.retestOrderTestId = new_test.id
        TestStateMachine.validate_transition(original_test.status, TestStatus.SUPERSEDED)
        original_test.status = TestStatus.SUPERSEDED
        
        # Record quality issue
        issue = self.quality._record_issue(
            order_id=original_test.orderId,
            stage=QualityStage.VALIDATION,
            domain=QualityDomain.SPECIMEN,
            reason=reason,
            notes=None,
            remedy=RemedyType.REQUEST_RECOLLECTION,
            user_id=user_id,
            order_test_id=original_test.id,
            sample_id=sample.sampleId,
            test_code=original_test.testCode,
            created_test_id=new_test.id,
            created_sample_id=new_sample.sampleId,
        )
        
        ticket = self.escalation.resolve_ticket(
            original_test.id,
            EscalationResolutionAction.AUTHORIZE_RECOLLECT,
            user_id,
            notes=reason,
        )
        
        self.audit.log_escalation_resolution_authorize_recollect(
            order_id=original_test.orderId,
            test_code=original_test.testCode,
            original_test_id=original_test.id,
            new_test_id=new_test.id,
            new_sample_id=new_sample.sampleId,
            ticket_id=ticket.id,
            user_id=user_id,
            reason=reason,
        )
        
        self.db.commit()
        update_order_status(self.db, original_test.orderId)
        
        return EscalationResolveResult(
            success=True,
            action=EscalationResolutionAction.AUTHORIZE_RECOLLECT,
            message="Recollection authorized and new sample created.",
            escalatedTestId=original_test.id,
            createdTestId=new_test.id,
        )
    
    def apply_amendment(
        self,
        order_test: OrderTest,
        user_id: int,
        validation_notes: Optional[str],
    ) -> EscalationResolveResult:
        """Apply amended results to a validated test."""
        ticket = self.escalation.get_open_ticket(order_test.id)
        if not ticket or ticket.reasonCode != EscalationReasonCode.AMEND_RES:
            raise LabOperationError("No amendment escalation ticket found", status_code=404)
        
        proposed = (ticket.ticketMetadata or {}).get("proposedResults")
        if not proposed:
            raise LabOperationError("Amendment ticket has no proposed results", status_code=400)
        
        # Re-validate proposed results
        order = self.db.query(Order).filter(Order.id == order_test.orderId).first()
        test_def = self.db.query(Test).filter(Test.testCode == order_test.testCode).first()
        
        if test_def and order:
            # Validate results against physiologic limits
            result_items = self.result_validator.validate_results(
                proposed, test_def, order.patient
            )
            # Recalculate flags
            updated_results = self.flag_calculator.calculate_flags(
                result_items, test_def
            )
            order_test.results = updated_results
            order_test.hasCriticalValues = any(r.get('isCritical') for r in updated_results)
        else:
            # Fallback if test definition is missing
            order_test.results = proposed
        
        order_test.resultValidatedAt = datetime.now(timezone.utc)
        order_test.validatedBy = str(user_id)
        order_test.validationNotes = validation_notes
        order_test.status = TestStatus.VALIDATED
        
        self.escalation.resolve_ticket(
            order_test.id,
            EscalationResolutionAction.APPLY_AMENDMENT,
            user_id,
            notes=validation_notes,
        )
        
        self.audit.log_escalation_resolution_apply_amendment(
            order_id=order_test.orderId,
            test_code=order_test.testCode,
            test_id=order_test.id,
            ticket_id=ticket.id,
            user_id=user_id,
            validation_notes=validation_notes,
        )
        
        self.db.commit()
        self.db.refresh(order_test)
        update_order_status(self.db, order_test.orderId)
        
        return EscalationResolveResult(
            success=True,
            action=EscalationResolutionAction.APPLY_AMENDMENT,
            message="Amendment applied.",
            escalatedTestId=order_test.id,
        )
    
    def cancel_test(
        self,
        order_test: OrderTest,
        user_id: int,
        reason: str,
    ) -> EscalationResolveResult:
        """Cancel an escalated test."""
        TestStateMachine.validate_transition(order_test.status, TestStatus.CANCELLED)
        order_test.status = TestStatus.CANCELLED
        order_test.validationNotes = reason
        
        ticket = self.escalation.resolve_ticket(
            order_test.id,
            EscalationResolutionAction.CANCEL,
            user_id,
            notes=reason,
        )
        
        self.audit.log_escalation_resolution_cancel(
            order_id=order_test.orderId,
            test_code=order_test.testCode,
            test_id=order_test.id,
            ticket_id=ticket.id,
            user_id=user_id,
            reason=reason,
        )
        
        self.db.commit()
        self.db.refresh(order_test)
        update_order_status(self.db, order_test.orderId)
        
        return EscalationResolveResult(
            success=True,
            action=EscalationResolutionAction.CANCEL,
            message="Test cancelled.",
            escalatedTestId=order_test.id,
        )
