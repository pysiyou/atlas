"""
Enum types matching frontend TypeScript enums
"""
import enum


class Gender(str, enum.Enum):
    """Gender enum - only male and female values"""
    MALE = "male"
    FEMALE = "female"


class AffiliationDuration(int, enum.Enum):
    ONE_MONTH = 1
    THREE_MONTHS = 3
    SIX_MONTHS = 6
    TWELVE_MONTHS = 12
    TWENTY_FOUR_MONTHS = 24


class Relationship(str, enum.Enum):
    """Relationship types for emergency contacts"""
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
    VALIDATOR = "pathologist"
    BILLING = "billing"


class SampleType(str, enum.Enum):
    BLOOD = "blood"
    URINE = "urine"
    STOOL = "stool"
    SALIVA = "saliva"
    SWAB = "swab"
    TISSUE = "tissue"
    SPUTUM = "sputum"
    CSF = "csf"  # Cerebrospinal fluid
    PLEURAL_FLUID = "pleural_fluid"
    SERUM = "serum"
    PLASMA = "plasma"
    OTHER = "other"


class SampleStatus(str, enum.Enum):
    PENDING = "pending"
    COLLECTED = "collected"
    RECEIVED = "received"
    ACCESSIONED = "accessioned"
    IN_PROGRESS = "in-progress"
    COMPLETED = "completed"
    STORED = "stored"
    DISPOSED = "disposed"
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
    """
    Sample rejection reasons - must match frontend values exactly
    """
    HEMOLYZED = "hemolyzed"
    CLOTTED = "clotted"
    QNS = "qns"  # Quantity Not Sufficient
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
    RESULTED = "resulted"      # Results entered, awaiting validation
    VALIDATED = "validated"
    REJECTED = "rejected"
    SUPERSEDED = "superseded"  # Original test after retest is created during result validation rejection


class OrderStatus(str, enum.Enum):
    ORDERED = "ordered"
    IN_PROGRESS = "in-progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class PriorityLevel(str, enum.Enum):
    ROUTINE = "routine"
    URGENT = "urgent"
    STAT = "stat"


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
    """Types of laboratory operations for audit tracking"""
    # Sample Operations
    SAMPLE_COLLECT = "sample_collect"
    SAMPLE_REJECT = "sample_reject"
    SAMPLE_RECOLLECTION_REQUEST = "sample_recollection_request"

    # Result Operations
    RESULT_ENTRY = "result_entry"
    RESULT_VALIDATION_APPROVE = "result_validation_approve"
    RESULT_VALIDATION_REJECT_RETEST = "result_validation_reject_retest"
    RESULT_VALIDATION_REJECT_RECOLLECT = "result_validation_reject_recollect"


class RejectionAction(str, enum.Enum):
    """Action to take when rejecting a result or sample"""
    RETEST_SAME_SAMPLE = "retest_same_sample"      # Use existing sample, run test again
    RECOLLECT_NEW_SAMPLE = "recollect_new_sample"  # Get new sample from patient
    ESCALATE_TO_SUPERVISOR = "escalate"            # Limits exceeded, need supervisor


class RejectionSource(str, enum.Enum):
    """Where the rejection originated from"""
    SAMPLE_COLLECTION = "sample_collection"   # Rejected during/after collection
    RESULT_VALIDATION = "result_validation"   # Rejected during result validation
