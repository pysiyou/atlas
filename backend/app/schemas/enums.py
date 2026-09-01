"""
Enum types — GENERATED from contracts/enums.json. DO NOT EDIT.
"""
import enum


class Gender(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"

class AffiliationDuration(int, enum.Enum):
    SIX_MONTHS = 6
    TWELVE_MONTHS = 12
    TWENTY_FOUR_MONTHS = 24

class Relationship(str, enum.Enum):
    SPOUSE = "spouse"
    PARENT = "parent"
    SIBLING = "sibling"
    CHILD = "child"
    FRIEND = "friend"
    OTHER = "other"

class UserRole(str, enum.Enum):
    ADMIN = "administrator"
    RECEPTIONIST = "receptionist"
    LAB_TECH = "lab-technician"
    LAB_TECH_PLUS = "lab-technician-plus"

class SampleType(str, enum.Enum):
    BLOOD = "blood"
    URINE = "urine"
    STOOL = "stool"
    SALIVA = "saliva"
    SWAB = "swab"
    TISSUE = "tissue"
    SPUTUM = "sputum"
    CSF = "csf"
    PLEURAL_FLUID = "pleural_fluid"
    SERUM = "serum"
    PLASMA = "plasma"
    OTHER = "other"

class SampleStatus(str, enum.Enum):
    PENDING = "pending"
    COLLECTED = "collected"
    REJECTED = "rejected"

class ContainerType(str, enum.Enum):
    TUBE = "tube"
    CUP = "cup"

class ContainerTopColor(str, enum.Enum):
    RED = "red"
    PURPLE = "purple"
    BLUE = "blue"
    GREEN = "green"
    GRAY = "gray"
    YELLOW = "yellow"
    LIGHT_BLUE = "light-blue"
    PINK = "pink"
    WHITE = "white"
    BLACK = "black"
    ORANGE = "orange"
    CLEAR = "clear"

class RejectionReason(str, enum.Enum):
    HEMOLYZED = "hemolyzed"
    CLOTTED = "clotted"
    QNS = "qns"
    WRONG_CONTAINER = "wrong_container"
    LABELING_ERROR = "labeling_error"
    TRANSPORT_DELAY = "transport_delay"
    CONTAMINATED = "contaminated"
    LIPEMIC = "lipemic"
    ICTERIC = "icteric"
    OTHER = "other"

class TestStatus(str, enum.Enum):
    PENDING = "pending"
    SAMPLE_COLLECTED = "sample-collected"
    IN_PROGRESS = "in-progress"
    RESULTED = "resulted"
    VALIDATED = "validated"
    REJECTED = "rejected"
    ESCALATED = "escalated"
    SUPERSEDED = "superseded"
    REMOVED = "removed"

class OrderStatus(str, enum.Enum):
    ORDERED = "ordered"
    IN_PROGRESS = "in-progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class PriorityLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class PaymentStatus(str, enum.Enum):
    UNPAID = "unpaid"
    PAID = "paid"

class PaymentMethod(str, enum.Enum):
    CASH = "cash"
    CREDIT_CARD = "credit-card"
    DEBIT_CARD = "debit-card"
    INSURANCE = "insurance"
    BANK_TRANSFER = "bank-transfer"
    MOBILE_MONEY = "mobile-money"

class ClaimStatus(str, enum.Enum):
    SUBMITTED = "submitted"
    PROCESSING = "processing"
    APPROVED = "approved"
    DENIED = "denied"
    PAID = "paid"

class AliquotStatus(str, enum.Enum):
    AVAILABLE = "available"
    IN_USE = "in-use"
    CONSUMED = "consumed"
    STORED = "stored"
    DISPOSED = "disposed"

class ResultStatus(str, enum.Enum):
    NORMAL = "normal"
    HIGH = "high"
    LOW = "low"
    CRITICAL = "critical"
    CRITICAL_HIGH = "critical-high"
    CRITICAL_LOW = "critical-low"

class ValidationDecision(str, enum.Enum):
    APPROVED = "approved"
    REJECTED = "rejected"
    REPEAT_REQUIRED = "repeat-required"

class LabOperationType(str, enum.Enum):
    SAMPLE_COLLECT = "sample_collect"
    SAMPLE_REJECT = "sample_reject"
    SAMPLE_RECOLLECTION_REQUEST = "sample_recollection_request"
    RESULT_ENTRY = "result_entry"
    RESULT_VALIDATION_APPROVE = "result_validation_approve"
    RESULT_VALIDATION_REJECT_RETEST = "result_validation_reject_retest"
    RESULT_VALIDATION_REJECT_RECOLLECT = "result_validation_reject_recollect"
    RESULT_VALIDATION_ESCALATE = "result_validation_escalate"
    ESCALATION_RESOLUTION_AUTHORIZE_RETEST = "escalation_resolution_authorize_retest"
    ESCALATION_RESOLUTION_AUTHORIZE_RECOLLECT = "escalation_resolution_authorize_recollect"
    ESCALATION_RESOLUTION_FORCE_VALIDATE = "escalation_resolution_force_validate"
    ESCALATION_TRIGGER_CRIT_VAL = "escalation_trigger_crit_val"
    ESCALATION_TRIGGER_REJ_SAMP = "escalation_trigger_rej_samp"
    ESCALATION_TRIGGER_LIMIT_HIT = "escalation_trigger_limit_hit"
    ESCALATION_TRIGGER_AMEND_RES = "escalation_trigger_amend_res"
    ESCALATION_RESOLUTION_FINAL_REJECT = "escalation_resolution_final_reject"
    ORDER_STATUS_CHANGE = "order_status_change"
    TEST_REMOVED = "test_removed"
    TEST_ADDED = "test_added"
    CRITICAL_VALUE_DETECTED = "critical_value_detected"
    CRITICAL_VALUE_NOTIFIED = "critical_value_notified"
    CRITICAL_VALUE_ACKNOWLEDGED = "critical_value_acknowledged"

class RejectionAction(str, enum.Enum):
    RETEST_SAME_SAMPLE = "retest_same_sample"
    RECOLLECT_NEW_SAMPLE = "recollect_new_sample"
    ESCALATE_TO_SUPERVISOR = "escalate"

class RejectionSource(str, enum.Enum):
    SAMPLE_COLLECTION = "sample_collection"
    RESULT_VALIDATION = "result_validation"

class EscalationReasonCode(str, enum.Enum):
    CRIT_VAL = "CRIT-VAL"
    REJ_SAMP = "REJ-SAMP"
    LIMIT_HIT = "LIMIT-HIT"
    AMEND_RES = "AMEND-RES"

class EscalationTicketStatus(str, enum.Enum):
    OPEN = "OPEN"
    RESOLVED = "RESOLVED"

class EscalationSeverity(str, enum.Enum):
    CRITICAL = "CRITICAL"
    STANDARD = "STANDARD"

class EscalationResolutionAction(str, enum.Enum):
    FORCE_VALIDATE = "force_validate"
    AUTHORIZE_RETEST = "authorize_retest"
    AUTHORIZE_RECOLLECT = "authorize_recollect"
    FINAL_REJECT = "final_reject"
