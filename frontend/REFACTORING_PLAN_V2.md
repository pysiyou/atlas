# Atlas Codebase Refactoring Plan V2

> **Generated:** January 2026
> **Status:** Post-V1 Refactoring - Deep Functional Analysis
> **Executor:** Code Agent

---

## Overview

This V2 plan addresses:
1. **Incomplete items from V1** - Tasks that were missed or partially completed
2. **Agent errors/misunderstandings** - Corrections to V1 implementation
3. **Deep functional issues** - Business logic, data flow, and architectural problems
4. **Security vulnerabilities** - Authorization and data access issues

### Issue Summary

| Category | Critical | High | Medium | Low | Total |
|----------|----------|------|--------|-----|-------|
| V1 Incomplete | 2 | 2 | 1 | - | 5 |
| Frontend Functional | 4 | 3 | 5 | 2 | 14 |
| Backend Functional | 6 | 5 | 6 | 2 | 19 |
| **Total** | **12** | **10** | **12** | **4** | **38** |

---

## Table of Contents

1. [V1 Incomplete Items](#1-v1-incomplete-items)
2. [Frontend - Critical Fixes](#2-frontend---critical-fixes)
3. [Frontend - Data Flow Issues](#3-frontend---data-flow-issues)
4. [Frontend - Business Logic Fixes](#4-frontend---business-logic-fixes)
5. [Backend - Authorization (Critical)](#5-backend---authorization-critical)
6. [Backend - Payment System Fixes](#6-backend---payment-system-fixes)
7. [Backend - State Machine Corrections](#7-backend---state-machine-corrections)
8. [Backend - Database Optimizations](#8-backend---database-optimizations)
9. [Backend - Code Quality (DRY)](#9-backend---code-quality-dry)
10. [Verification Checklist](#10-verification-checklist)

---

## 1. V1 Incomplete Items

### 1.1 Remove Remaining Console Statements (11 instances)

**Priority:** HIGH

The following console statements were NOT removed during V1:

| File | Line | Statement | Action |
|------|------|-----------|--------|
| `src/features/patient/EditPatientModal.tsx` | 294 | `console.error('Error saving patient:', error)` | Replace with `logger.error()` |
| `src/features/order/OrderCreate.tsx` | 166 | `console.error('Error creating order:', error)` | Replace with `logger.error()` |
| `src/features/test/TestsProvider.tsx` | 72 | `console.error('Failed to create test:', err)` | Replace with `logger.error()` |
| `src/features/test/TestsProvider.tsx` | 85 | `console.error('Failed to update test:', err)` | Replace with `logger.error()` |
| `src/features/test/TestsProvider.tsx` | 204 | `console.warn('Price cannot be negative')` | Replace with `logger.warn()` |
| `src/features/lab/sample-collection/SampleCollectionView.tsx` | 144 | `console.error('Error collecting sample:', error)` | Replace with `logger.error()` |
| `src/features/lab/sample-collection/SampleCard.tsx` | 142 | `console.error('Failed to reject sample:', error)` | Replace with `logger.error()` |
| `src/features/lab/sample-collection/SampleDetail.tsx` | 350 | `console.error('Failed to reject sample:', error)` | Replace with `logger.error()` |
| `src/features/lab/result-entry/ResultEntryView.tsx` | 172 | `console.error('Error saving results:', error)` | Replace with `logger.error()` |
| `src/features/lab/result-validation/ResultValidationView.tsx` | 121 | `console.error('Error validating results:', error)` | Replace with `logger.error()` |
| `src/shared/ui/ModalRenderer.tsx` | 34 | `console.warn('No modal registered...')` | Replace with `logger.warn()` |

**Import to add in each file:**
```typescript
import { logger } from '@/utils/logger';
```

---

### 1.2 Delete Empty Directories

**Priority:** MEDIUM

**Action:** Delete these empty directories:
```bash
rm -rf src/features/dashboard
rm -rf src/features/report
```

Or if features are planned, create placeholder files:
```typescript
// src/features/dashboard/index.ts
export const DASHBOARD_FEATURE_PLACEHOLDER = true;
// TODO: Implement dashboard feature
```

---

### 1.3 Fix Remaining datetime.utcnow() (Backend)

**Priority:** LOW (db_scripts only, not production code)

**File:** `backend/db_scripts/generate_patients.py`

**Lines 639 and 660:**
```python
# OLD
"registrationDate": datetime.utcnow(),

# NEW
"registrationDate": datetime.now(timezone.utc),
```

**Add import at top:**
```python
from datetime import datetime, timezone
```

---

### 1.4 Split SampleDetail.tsx into Separate Files

**Priority:** MEDIUM

**Current state:** Sub-components exist but are in the same file (561 lines).

**Action:** Create directory and extract:

```
src/features/lab/sample-collection/
├── SampleDetail/
│   ├── index.tsx              # Main modal (re-export)
│   ├── SampleDetailModal.tsx  # Main component
│   ├── RequirementsSection.tsx
│   └── RejectionSection.tsx
```

**File: `src/features/lab/sample-collection/SampleDetail/RequirementsSection.tsx`**
Extract lines 47-130 from current SampleDetail.tsx

**File: `src/features/lab/sample-collection/SampleDetail/RejectionSection.tsx`**
Extract lines 133-186 from current SampleDetail.tsx

**File: `src/features/lab/sample-collection/SampleDetail/index.tsx`**
```typescript
export { SampleDetailModal as default } from './SampleDetailModal';
export { RequirementsSection } from './RequirementsSection';
export { RejectionSection } from './RejectionSection';
```

---

## 2. Frontend - Critical Fixes

### 2.1 Fix Non-Atomic Order Creation (Race Condition)

**Priority:** CRITICAL

**File:** `src/features/order/OrderCreate.tsx`

**Problem (Lines 133-161):**
- `addOrder()` is called first
- `addInvoice()` is called separately
- If invoice creation fails, order exists without invoice

**Solution:** Create atomic order+invoice creation in backend or handle frontend rollback.

**Option A - Backend Solution (Recommended):**

Update `backend/app/api/v1/orders.py` to create invoice atomically:

```python
@router.post("", status_code=201)
async def create_order(...):
    try:
        # Create order
        db.add(order)
        db.flush()

        # Generate samples
        generate_samples_for_order(...)

        # Create invoice atomically
        invoice = Invoice(
            invoiceId=generate_id("INV", db),
            orderId=order.orderId,
            patientId=order.patientId,
            total=order.totalPrice,
            paymentStatus=PaymentStatus.UNPAID,
            # ... other fields
        )
        db.add(invoice)

        db.commit()
        db.refresh(order)
        return {"order": order, "invoice": invoice}
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create order")
```

**Option B - Frontend Rollback:**

Update `src/features/order/OrderCreate.tsx`:

```typescript
try {
  const newOrder = await addOrder(orderData);

  try {
    await addInvoice(invoiceData);
  } catch (invoiceError) {
    // Rollback: delete the order
    await deleteOrder(newOrder.orderId);
    throw new Error('Failed to create invoice. Order has been rolled back.');
  }

  toast.success('Order created successfully');
} catch (error) {
  toast.error(error.message || 'Failed to create order');
}
```

---

### 2.2 Fix Payment Status Terminology Mismatch

**Priority:** CRITICAL

**Problem:**
- Order uses `paymentStatus: 'unpaid'` (OrderCreate.tsx line 126)
- Invoice uses `paymentStatus: 'pending'` (OrderCreate.tsx line 155)

**Files to update:**

1. **`src/types/enums/payment-status.ts`** - Ensure single source of truth
2. **`src/features/order/OrderCreate.tsx`** - Use consistent status

**Fix in OrderCreate.tsx (Line 126 and 155):**
```typescript
// Both should use the same enum value
import { PaymentStatus } from '@/types/enums';

// Line 126 - Order
paymentStatus: PaymentStatus.PENDING,  // or PaymentStatus.UNPAID - pick one

// Line 155 - Invoice
paymentStatus: PaymentStatus.PENDING,  // must match
```

**Also update backend `schemas/enums.py`:**
```python
class PaymentStatus(str, Enum):
    PENDING = "pending"      # Not paid yet
    PARTIAL = "partial"      # Partially paid (NEW)
    PAID = "paid"           # Fully paid
```

---

### 2.3 Add Partial Payment Support

**Priority:** CRITICAL

**Problem:** Payment system only supports full payment, no partial payments.

**File:** `src/features/payment/PaymentPopover.tsx`

**Current Code (Lines 50-63):**
```typescript
const amount = order.totalPrice;  // Fixed to full amount
```

**Fix - Allow Custom Amount:**
```typescript
interface PaymentPopoverProps {
  order: Order;
  onSuccess: () => void;
  onCancel: () => void;
  existingPayments?: Payment[];  // Add this
}

const PaymentPopover: React.FC<PaymentPopoverProps> = ({
  order,
  onSuccess,
  onCancel,
  existingPayments = [],
}) => {
  const totalPaid = existingPayments.reduce((sum, p) => sum + p.amount, 0);
  const remainingAmount = order.totalPrice - totalPaid;

  const [amount, setAmount] = useState(remainingAmount);
  const [error, setError] = useState<string | null>(null);

  const isValid = amount > 0 && amount <= remainingAmount;

  const handleSubmit = async () => {
    if (amount > remainingAmount) {
      setError(`Amount cannot exceed remaining balance ($${remainingAmount.toFixed(2)})`);
      return;
    }
    // ... rest of submission
  };

  return (
    <div>
      <Input
        type="number"
        label="Payment Amount"
        value={amount}
        onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
        max={remainingAmount}
        min={0.01}
        step={0.01}
      />
      <p className="text-sm text-gray-500">
        Remaining: ${remainingAmount.toFixed(2)} of ${order.totalPrice.toFixed(2)}
      </p>
      {/* ... */}
    </div>
  );
};
```

---

### 2.4 Add API Retry Logic

**Priority:** HIGH

**File:** `src/services/api/client.ts`

**Add retry utility:**
```typescript
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
};

async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on 4xx errors (client errors)
      if (error instanceof APIError && error.status >= 400 && error.status < 500) {
        throw error;
      }

      if (attempt < config.maxRetries) {
        const delay = Math.min(
          config.baseDelay * Math.pow(2, attempt),
          config.maxDelay
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}
```

**Update HTTP methods to use retry:**
```typescript
async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
  return withRetry(() => this._get<T>(endpoint, config));
}

private async _get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
  // ... existing implementation
}
```

---

## 3. Frontend - Data Flow Issues

### 3.1 Fix Cache Stale Data with Different Filters

**Priority:** MEDIUM

**File:** `src/hooks/queries/useSamples.ts`

**Problem:** Filtered queries remain in cache causing stale data.

**Fix - Add query key specificity:**
```typescript
const query = useQuery({
  queryKey: queryKeys.samples.list(filters),
  queryFn: () => sampleAPI.getAll(filters),
  ...cacheConfig.dynamic,
  // Add: Remove stale filtered queries on refetch
  refetchOnMount: 'always',
});
```

**Better Fix - Invalidate related queries:**
```typescript
export function useInvalidateSamples() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => {
      // Invalidate ALL sample queries regardless of filters
      queryClient.invalidateQueries({
        queryKey: ['samples'],
        refetchType: 'all'  // Force refetch all, not just active
      });
    },
  };
}
```

---

### 3.2 Remove Unused isError from SamplesProvider

**Priority:** LOW

**File:** `src/features/lab/SamplesProvider.tsx`

**Line 50-51:**
```typescript
// OLD
const { samples, isLoading: loading, isError, error: queryError, refetch } = useSamplesList();

// NEW - Remove isError if not used
const { samples, isLoading: loading, error: queryError, refetch } = useSamplesList();
```

---

### 3.3 Optimize OrderCreate Test Filtering

**Priority:** LOW

**File:** `src/features/order/OrderCreate.tsx`

**Problem (Lines 58-67):** Tests filtered on every render.

**Fix - Memoize filtering:**
```typescript
const filteredTests = useMemo(() => {
  if (!testSearch.trim()) return activeTests;
  const search = testSearch.toLowerCase();
  return activeTests.filter(
    (test) =>
      test.name.toLowerCase().includes(search) ||
      test.code.toLowerCase().includes(search) ||
      test.category.toLowerCase().includes(search)
  );
}, [activeTests, testSearch]);
```

---

## 4. Frontend - Business Logic Fixes

### 4.1 Fix Age Validation Edge Case

**Priority:** LOW

**File:** `src/features/patient/usePatientForm.ts`

**Problem (Lines 148-150):** Age calculation only uses year, not full date.

**Fix:**
```typescript
// OLD
const age = today.getFullYear() - dob.getFullYear();
if (age > VALIDATION_RULES.AGE.MAX) {

// NEW - Accurate age calculation
const age = differenceInYears(today, dob);  // from date-fns
if (age > VALIDATION_RULES.AGE.MAX) {
```

**Add import:**
```typescript
import { differenceInYears } from 'date-fns';
```

---

### 4.2 Improve Error Messages to Users

**Priority:** MEDIUM

**File:** `src/features/lab/sample-collection/SampleCollectionView.tsx`

**Current (Lines 143-146):**
```typescript
} catch (error) {
  console.error('Error collecting sample:', error);
  toast.error('Failed to collect sample. Please try again.');
}
```

**Fix - Extract error message:**
```typescript
import { getErrorMessage } from '@/utils/errorHelpers';

} catch (error) {
  logger.error('Error collecting sample:', error);
  const message = getErrorMessage(error, 'Failed to collect sample');
  toast.error(message);
}
```

**Create utility `src/utils/errorHelpers.ts`:**
```typescript
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    // Check for specific error types
    if (error.message.includes('network')) {
      return 'Network error. Please check your connection.';
    }
    if (error.message.includes('401') || error.message.includes('unauthorized')) {
      return 'Session expired. Please log in again.';
    }
    if (error.message.includes('403') || error.message.includes('forbidden')) {
      return 'You do not have permission to perform this action.';
    }
    return error.message;
  }
  return fallback;
}
```

Apply this pattern to all catch blocks in:
- `src/features/order/OrderCreate.tsx:165-170`
- `src/features/patient/EditPatientModal.tsx:293-296`
- `src/features/lab/result-entry/ResultEntryView.tsx:171-174`
- `src/features/lab/result-validation/ResultValidationView.tsx:120-123`

---

### 4.3 Fix PaymentPopover Effect Re-runs

**Priority:** LOW

**File:** `src/features/payment/PaymentPopover.tsx`

**Problem (Lines 103-115):** Effect creates new event listener on every isValid/submitting change.

**Fix - Use ref for stable callback:**
```typescript
const handleSubmitRef = useRef(handleSubmit);
handleSubmitRef.current = handleSubmit;

useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitRef.current();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [onCancel]);  // Only re-run when onCancel changes
```

---

## 5. Backend - Authorization (Critical)

### 5.1 Add Ownership Checks to GET Endpoints

**Priority:** CRITICAL

**Problem:** Any authenticated user can access any patient/order/payment data.

**File:** `backend/app/api/v1/patients.py`

**Fix - Add role-based filtering:**

```python
from app.core.dependencies import get_current_user, require_receptionist

@router.get("")
async def get_patients(
    search: str | None = Query(None, max_length=100),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get patients with role-based access:
    - Admin: All patients
    - Receptionist: All patients (for scheduling)
    - Lab Tech: Only patients with active orders
    - Validator: Only patients with results pending validation
    """
    query = db.query(Patient)

    # Role-based filtering
    if current_user.role == UserRole.LAB_TECH:
        # Lab techs only see patients with samples to process
        query = query.join(Order).join(Sample).filter(
            Sample.status.in_([SampleStatus.PENDING, SampleStatus.COLLECTED])
        )
    elif current_user.role == UserRole.VALIDATOR:
        # Validators only see patients with results to validate
        query = query.join(Order).join(OrderTest).filter(
            OrderTest.status == TestStatus.COMPLETED
        )
    # Admin and Receptionist see all patients

    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(
            or_(
                Patient.fullName.ilike(search_term),
                Patient.id.ilike(search_term),
                Patient.phone.contains(search)
            )
        )

    query = query.order_by(Patient.createdAt.desc())
    patients = query.offset(skip).limit(limit).all()
    return [PatientResponse.model_validate(p).model_dump() for p in patients]
```

**Apply similar logic to:**
- `backend/app/api/v1/orders.py` - Line 30
- `backend/app/api/v1/payments.py` - Line 60
- `backend/app/api/v1/samples.py` - Line 29

---

### 5.2 Add Ownership Validation to Single-Resource GET

**Priority:** CRITICAL

**File:** `backend/app/api/v1/patients.py`

**Fix for `get_patient()` (Line 47):**

```python
@router.get("/patients/{patientId}")
async def get_patient(
    patientId: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = db.query(Patient).filter(Patient.id == patientId).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Ownership/access validation
    if not can_access_patient(current_user, patient, db):
        raise HTTPException(status_code=403, detail="Access denied")

    return PatientResponse.model_validate(patient).model_dump()


def can_access_patient(user: User, patient: Patient, db: Session) -> bool:
    """Check if user can access this patient's data."""
    # Admin and Receptionist can access all
    if user.role in [UserRole.ADMIN, UserRole.RECEPTIONIST]:
        return True

    # Lab tech can access if patient has samples they need to process
    if user.role == UserRole.LAB_TECH:
        has_pending = db.query(Sample).join(Order).filter(
            Order.patientId == patient.id,
            Sample.status.in_([SampleStatus.PENDING, SampleStatus.COLLECTED])
        ).first()
        return has_pending is not None

    # Validator can access if patient has results to validate
    if user.role == UserRole.VALIDATOR:
        has_pending = db.query(OrderTest).join(Order).filter(
            Order.patientId == patient.id,
            OrderTest.status == TestStatus.COMPLETED
        ).first()
        return has_pending is not None

    return False
```

---

## 6. Backend - Payment System Fixes

### 6.1 Prevent Overpayment

**Priority:** CRITICAL

**File:** `backend/app/api/v1/payments.py`

**Fix (Lines 155-167):**

```python
@router.post("", status_code=201)
async def create_payment(
    payment_data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_receptionist)
):
    # Fetch order
    order = db.query(Order).filter(Order.orderId == payment_data.orderId).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Calculate existing payments
    existing_payments = db.query(Payment).filter(
        Payment.orderId == payment_data.orderId
    ).all()
    total_paid = sum(p.amount for p in existing_payments)
    remaining = order.totalPrice - total_paid

    # Validate payment amount
    if remaining <= 0:
        raise HTTPException(status_code=400, detail="Order is already fully paid")

    if payment_data.amount > remaining:
        raise HTTPException(
            status_code=400,
            detail=f"Payment amount (${payment_data.amount}) exceeds remaining balance (${remaining:.2f})"
        )

    # Create payment
    payment = Payment(
        paymentId=generate_id("PAY", db),
        orderId=payment_data.orderId,
        amount=payment_data.amount,
        paymentMethod=payment_data.paymentMethod,
        paidAt=datetime.now(timezone.utc),
        receivedBy=current_user.id,
        notes=payment_data.notes,
    )
    db.add(payment)

    # Update order payment status
    new_total_paid = total_paid + payment_data.amount
    if new_total_paid >= order.totalPrice:
        order.paymentStatus = PaymentStatus.PAID
    elif new_total_paid > 0:
        order.paymentStatus = PaymentStatus.PARTIAL  # NEW status

    db.commit()
    return _enrich_payment(payment, order)
```

---

### 6.2 Add PARTIAL Payment Status

**Priority:** HIGH

**File:** `backend/app/schemas/enums.py`

```python
class PaymentStatus(str, Enum):
    PENDING = "pending"
    PARTIAL = "partial"  # NEW
    PAID = "paid"
```

**Update frontend enum:** `src/types/enums/payment-status.ts`
```typescript
export const PAYMENT_STATUS_VALUES = ['pending', 'partial', 'paid'] as const;
```

---

### 6.3 Add Refund Support (Schema Only)

**Priority:** MEDIUM

**File:** `backend/app/models/billing.py`

Add to Payment model:
```python
class Payment(Base):
    __tablename__ = "payments"

    # Existing fields...

    # NEW: Refund tracking
    isRefund = Column(Boolean, default=False)
    refundReason = Column(String, nullable=True)
    originalPaymentId = Column(String, ForeignKey("payments.paymentId"), nullable=True)
```

---

## 7. Backend - State Machine Corrections

### 7.1 Fix Order Status Regression Bug

**Priority:** CRITICAL

**File:** `backend/app/services/order_status_updater.py`

**Problem:** Order can regress from COMPLETED/VALIDATED back to PENDING.

**Fix:**

```python
def update_order_status(db: Session, order_id: str) -> None:
    order = db.query(Order).filter(Order.orderId == order_id).first()
    if not order:
        return

    current_status = order.overallStatus
    new_status = _calculate_new_status(order, db)

    # Prevent backward transitions from terminal states
    if current_status in [OrderStatus.VALIDATED, OrderStatus.REPORTED]:
        # These are terminal states, don't regress
        logger.warning(f"Attempted to change order {order_id} from {current_status} to {new_status}")
        return

    # Prevent regression from COMPLETED unless explicitly allowed
    if current_status == OrderStatus.COMPLETED and new_status in [OrderStatus.PENDING, OrderStatus.SAMPLE_COLLECTION]:
        logger.warning(f"Prevented regression of order {order_id} from COMPLETED to {new_status}")
        return

    if order.overallStatus != new_status:
        order.overallStatus = new_status
        order.updatedAt = datetime.now(timezone.utc)
        db.commit()


def _calculate_new_status(order: Order, db: Session) -> OrderStatus:
    """Calculate what the order status should be based on tests and samples."""
    tests = order.tests
    if not tests:
        return OrderStatus.PENDING

    # Check validation status
    all_validated = all(t.status == TestStatus.VALIDATED for t in tests)
    if all_validated:
        return OrderStatus.VALIDATED

    # Check completion status
    completed_statuses = [TestStatus.COMPLETED, TestStatus.VALIDATED]
    all_completed = all(t.status in completed_statuses for t in tests)
    if all_completed:
        return OrderStatus.COMPLETED

    # Check sample collection status
    samples = db.query(Sample).filter(Sample.orderId == order.orderId).all()
    non_rejected_samples = [s for s in samples if s.status != SampleStatus.REJECTED]

    if not non_rejected_samples:
        # All samples rejected - need recollection
        # But don't regress if already past sample collection
        return OrderStatus.PENDING

    # Check if any sample collected
    collected_statuses = [SampleStatus.COLLECTED, SampleStatus.RECEIVED,
                         SampleStatus.ACCESSIONED, SampleStatus.IN_PROGRESS,
                         SampleStatus.COMPLETED]
    any_collected = any(s.status in collected_statuses for s in non_rejected_samples)
    all_collected = all(s.status in collected_statuses for s in non_rejected_samples)

    if all_collected:
        return OrderStatus.IN_PROGRESS
    elif any_collected:
        return OrderStatus.SAMPLE_COLLECTION

    return OrderStatus.PENDING
```

---

### 7.2 Add REPORTED Status Logic

**Priority:** MEDIUM

**File:** `backend/app/api/v1/orders.py`

Add new endpoint:
```python
@router.post("/{orderId}/report", status_code=200)
async def mark_as_reported(
    orderId: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_validator)
):
    """Mark order as reported (final state)."""
    order = db.query(Order).filter(Order.orderId == orderId).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.overallStatus != OrderStatus.VALIDATED:
        raise HTTPException(
            status_code=400,
            detail=f"Order must be VALIDATED before reporting. Current: {order.overallStatus}"
        )

    order.overallStatus = OrderStatus.REPORTED
    order.updatedAt = datetime.now(timezone.utc)
    db.commit()

    return {"message": "Order marked as reported", "orderId": orderId}
```

---

### 7.3 Add Max Recollection Limit

**Priority:** MEDIUM

**File:** `backend/app/api/v1/samples.py`

**Add configuration:**
```python
MAX_RECOLLECTION_ATTEMPTS = 3  # Make this configurable via settings
```

**Update request_recollection() (Line 196):**
```python
@router.post("/{sampleId}/request-recollection", status_code=201)
async def request_recollection(...):
    # ... existing validation ...

    # Check recollection limit
    recollection_count = len(original_sample.rejectionHistory or [])
    if recollection_count >= MAX_RECOLLECTION_ATTEMPTS:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum recollection attempts ({MAX_RECOLLECTION_ATTEMPTS}) reached. Please escalate to supervisor."
        )

    # ... rest of function ...
```

---

## 8. Backend - Database Optimizations

### 8.1 Fix N+1 Query in Payment Enrichment

**Priority:** HIGH

**File:** `backend/app/api/v1/payments.py`

**Fix `get_payments()` (Lines 53-81):**

```python
from sqlalchemy.orm import joinedload

@router.get("")
async def get_payments(
    orderId: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Payment).options(
        joinedload(Payment.order).joinedload(Order.patient)  # Eager load
    )

    if orderId:
        query = query.filter(Payment.orderId == orderId)

    query = query.order_by(Payment.paidAt.desc())
    payments = query.offset(skip).limit(limit).all()

    return [_enrich_payment(p, p.order) for p in payments]
```

**Note:** Requires adding relationship to Payment model:
```python
# backend/app/models/billing.py
class Payment(Base):
    # ... existing fields ...
    order = relationship("Order", back_populates="payments")

# backend/app/models/order.py
class Order(Base):
    # ... existing fields ...
    payments = relationship("Payment", back_populates="order")
```

---

### 8.2 Add Missing Database Indexes

**Priority:** HIGH

**File:** `backend/app/models/sample.py`

```python
class Sample(Base):
    __tablename__ = "samples"

    sampleId = Column(String, primary_key=True, index=True)
    orderId = Column(String, ForeignKey("orders.orderId"), index=True)
    status = Column(Enum(SampleStatus), default=SampleStatus.PENDING, index=True)  # ADD INDEX
    # ...
```

**File:** `backend/app/models/order.py`

```python
class OrderTest(Base):
    __tablename__ = "order_tests"

    id = Column(String, primary_key=True)
    orderId = Column(String, ForeignKey("orders.orderId"), index=True)
    testCode = Column(String, ForeignKey("tests.code"), index=True)  # ADD INDEX
    status = Column(Enum(TestStatus), default=TestStatus.PENDING, index=True)  # ADD INDEX
    # ...
```

**Run migration after changes:**
```bash
# Generate migration
alembic revision --autogenerate -m "Add indexes on status columns"
alembic upgrade head
```

---

### 8.3 Add Explicit Transactions

**Priority:** MEDIUM

**File:** `backend/app/api/v1/orders.py`

```python
from sqlalchemy import event
from contextlib import contextmanager

@contextmanager
def transaction(db: Session):
    """Context manager for explicit transactions."""
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise


@router.post("", status_code=201)
async def create_order(...):
    with transaction(db):
        # All operations in single transaction
        order = Order(...)
        db.add(order)
        db.flush()

        generate_samples_for_order(order.orderId, db, current_user.id)

        invoice = Invoice(...)
        db.add(invoice)

        db.refresh(order)
        return order
```

---

## 9. Backend - Code Quality (DRY)

### 9.1 Extract Pagination Parameters

**Priority:** MEDIUM

**Create:** `backend/app/api/deps.py`

```python
from fastapi import Query
from typing import Annotated

DEFAULT_PAGE_SIZE = 100
MAX_PAGE_SIZE = 1000

def pagination_params(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE, description="Max records to return")
) -> dict:
    return {"skip": skip, "limit": limit}

PaginationParams = Annotated[dict, Depends(pagination_params)]
```

**Usage in all routes:**
```python
from app.api.deps import PaginationParams

@router.get("")
async def get_patients(
    pagination: PaginationParams,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patients = db.query(Patient).offset(pagination["skip"]).limit(pagination["limit"]).all()
```

---

### 9.2 Extract 404 Helper

**Priority:** MEDIUM

**Create:** `backend/app/utils/db_helpers.py`

```python
from fastapi import HTTPException
from sqlalchemy.orm import Session
from typing import Type, TypeVar

T = TypeVar('T')

def get_or_404(
    db: Session,
    model: Type[T],
    id_value: str,
    id_field: str = "id",
    detail: str | None = None
) -> T:
    """Fetch entity by ID or raise 404."""
    entity = db.query(model).filter(
        getattr(model, id_field) == id_value
    ).first()

    if not entity:
        raise HTTPException(
            status_code=404,
            detail=detail or f"{model.__name__} not found"
        )

    return entity
```

**Usage:**
```python
from app.utils.db_helpers import get_or_404

@router.get("/patients/{patientId}")
async def get_patient(patientId: str, db: Session = Depends(get_db)):
    patient = get_or_404(db, Patient, patientId)
    return patient
```

---

### 9.3 Add Consistent Ordering to Pagination

**Priority:** LOW

**Update all list endpoints to include ordering:**

```python
# patients.py
query = query.order_by(Patient.createdAt.desc())

# samples.py - MISSING, add:
query = query.order_by(Sample.createdAt.desc())

# orders.py - already has ordering, OK
# payments.py - already has ordering, OK
```

---

## 10. Verification Checklist

### After V2 Implementation

**Frontend:**
- [ ] Zero console.log/error/warn statements (except in logger.ts)
- [ ] No empty directories in src/features
- [ ] Order + Invoice creation is atomic
- [ ] Payment status uses consistent terminology
- [ ] Partial payments are supported
- [ ] API client has retry logic
- [ ] Error messages are user-friendly
- [ ] All effects have proper dependencies

**Backend:**
- [ ] All datetime uses timezone.utc
- [ ] Role-based filtering on list endpoints
- [ ] Ownership checks on single-resource endpoints
- [ ] Overpayment prevention in place
- [ ] PARTIAL payment status exists
- [ ] Order status cannot regress from terminal states
- [ ] Max recollection limit enforced
- [ ] N+1 queries fixed with joinedload
- [ ] Indexes on Sample.status, OrderTest.status
- [ ] Pagination helper extracted
- [ ] 404 helper extracted
- [ ] All list endpoints have consistent ordering

### Testing

- [ ] Create order → verify invoice created atomically
- [ ] Pay partial amount → verify status is PARTIAL
- [ ] Try to overpay → verify error returned
- [ ] As lab tech, try to view unrelated patient → verify 403
- [ ] Reject sample 3 times → verify max limit error
- [ ] Complete order → try to regress status → verify prevented

---

## Execution Order

1. **Phase 1: V1 Cleanup** (Quick wins)
   - Section 1.1: Remove console statements
   - Section 1.2: Delete empty directories
   - Section 1.3: Fix datetime.utcnow

2. **Phase 2: Critical Fixes**
   - Section 2.1: Atomic order creation
   - Section 2.2: Payment status alignment
   - Section 5.1-5.2: Authorization fixes
   - Section 6.1: Overpayment prevention
   - Section 7.1: State machine fix

3. **Phase 3: High Priority**
   - Section 2.3: Partial payment support
   - Section 2.4: API retry logic
   - Section 6.2: PARTIAL status
   - Section 8.1-8.2: Database optimizations

4. **Phase 4: Medium Priority**
   - Section 1.4: Split SampleDetail
   - Section 4.2: Error messages
   - Section 7.2-7.3: REPORTED status, max recollection
   - Section 9: DRY improvements

5. **Phase 5: Low Priority**
   - Section 3: Data flow fixes
   - Section 4.1, 4.3: Minor fixes

---

*End of Refactoring Plan V2*
