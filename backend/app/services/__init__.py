"""
Services package for business logic
"""
from app.services.sample_generator import generate_samples_for_order
from app.services.order_status_updater import update_order_status
from app.services.state_machine import (
    SampleStateMachine,
    TestStateMachine,
    StateTransitionError
)
from app.services.audit_service import AuditService
from app.services.lab_operations import (
    LabOperationsService,
    LabOperationError,
    RejectionOptions,
    RejectionResult,
    AvailableAction,
)
from app.services.lab_constants import (
    MAX_RETEST_ATTEMPTS,
    MAX_RECOLLECTION_ATTEMPTS
)

__all__ = [
    # Sample operations
    "generate_samples_for_order",
    # Order status
    "update_order_status",
    # State machine
    "SampleStateMachine",
    "TestStateMachine",
    "StateTransitionError",
    # Audit
    "AuditService",
    # Lab operations
    "LabOperationsService",
    "LabOperationError",
    "RejectionOptions",
    "RejectionResult",
    "AvailableAction",
    "MAX_RETEST_ATTEMPTS",
    "MAX_RECOLLECTION_ATTEMPTS",
]
