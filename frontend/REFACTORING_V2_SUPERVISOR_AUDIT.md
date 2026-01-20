# Supervisor Audit Report - V2 Refactoring

> **Date:** January 2026
> **Status:** INCOMPLETE - Action Required
> **Verdict:** 7 of 18 critical/high items incomplete. NOT ACCEPTABLE for merge.

---

## Agent Work Assessment

| Task | Status | Notes |
|------|--------|-------|
| **Phase 1: V1 Cleanup** | | |
| 1.1 Remove console statements | ✅ DONE | Only logger.ts remains (correct) |
| 1.2 Delete empty directories | ✅ DONE | dashboard/ and report/ removed |
| 1.3 Fix datetime.utcnow | ✅ DONE | None remaining |
| 1.4 Split SampleDetail.tsx | ⚠️ PARTIAL | Reduced to 411 lines but NOT split into separate files |
| **Phase 2: Critical Fixes** | | |
| 2.1 Atomic order creation | ❌ NOT DONE | No rollback/transaction logic added |
| 2.2 Payment status alignment | ❌ NOT DONE | Still mixed: 'unpaid' vs 'pending' |
| 5.1-5.2 Authorization fixes | ❌ NOT DONE | No can_access_patient, no role filtering |
| 6.1 Overpayment prevention | ✅ DONE | Validation added in payments.py |
| 7.1 State machine fix | ✅ DONE | Terminal states protected |
| **Phase 3: High Priority** | | |
| 2.3 Partial payment support | ❌ NOT DONE | No PARTIAL enum in backend |
| 2.4 API retry logic | ✅ DONE | withRetry implemented |
| 6.2 PARTIAL status enum | ❌ NOT DONE | Not in enums.py |
| 8.1 N+1 query fix (joinedload) | ❌ NOT DONE | No joinedload in payments.py |
| 8.2 Database indexes | ✅ DONE | index=True on status columns |
| **Phase 4: Medium Priority** | | |
| 4.2 Error helper utility | ✅ DONE | errorHelpers.ts created |
| 7.2 REPORTED endpoint | ❌ NOT DONE | No mark_as_reported endpoint |
| 7.3 Max recollection limit | ❌ NOT DONE | No MAX_RECOLLECTION constant |
| 9.1-9.2 DRY helpers | ✅ DONE | PaginationParams, get_or_404 exist |

---

## Summary

| Category | Done | Not Done | Partial |
|----------|------|----------|---------|
| Phase 1 (V1 Cleanup) | 3 | 0 | 1 |
| Phase 2 (Critical) | 2 | 3 | 0 |
| Phase 3 (High) | 2 | 3 | 0 |
| Phase 4 (Medium) | 2 | 2 | 0 |
| **Total** | **9** | **8** | **1** |

---

## DIRECTIVE: Immediate Action Required

Complete these 7 items in priority order. Do not skip any.

---

### 1. Backend Authorization - CRITICAL SECURITY ISSUE

**Priority:** CRITICAL
**File:** `backend/app/api/v1/patients.py`

**Problem:** Any authenticated user can view ALL patients. This is a HIPAA violation.

**Action:** Add role-based filtering to `get_patients()`:

```python
from app.models import Order, Sample, OrderTest
from app.schemas.enums import SampleStatus, TestStatus, UserRole

@router.get("")
async def get_patients(
    search: str | None = Query(None, max_length=100),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Patient)

    # Role-based filtering
    if current_user.role == UserRole.LAB_TECH:
        # Lab techs only see patients with pending samples
        query = query.join(Order).join(Sample).filter(
            Sample.status.in_([SampleStatus.PENDING, SampleStatus.COLLECTED])
        ).distinct()
    elif current_user.role == UserRole.VALIDATOR:
        # Validators only see patients with results to validate
        query = query.join(Order).join(OrderTest).filter(
            OrderTest.status == TestStatus.COMPLETED
        ).distinct()
    # Admin and Receptionist see all patients (no filter)

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

**Also apply similar logic to:**
- `backend/app/api/v1/orders.py` - `get_orders()`
- `backend/app/api/v1/payments.py` - `get_payments()`
- `backend/app/api/v1/samples.py` - `get_samples()`

---

### 2. Add PARTIAL Payment Status

**Priority:** HIGH
**File:** `backend/app/schemas/enums.py`

**Action:** Find `PaymentStatus` enum and add PARTIAL:

```python
class PaymentStatus(str, Enum):
    PENDING = "pending"
    PARTIAL = "partial"  # ADD THIS LINE
    PAID = "paid"
```

**Then update** `backend/app/api/v1/payments.py` in `create_payment()`:

```python
# After calculating new_total_paid, update status logic:
if new_total_paid >= order.totalPrice:
    order.paymentStatus = PaymentStatus.PAID
elif new_total_paid > 0:
    order.paymentStatus = PaymentStatus.PARTIAL  # ADD THIS
else:
    order.paymentStatus = PaymentStatus.PENDING
```

---

### 3. Fix Payment Status Terminology

**Priority:** HIGH
**Files:** Multiple frontend files

**Problem:** Order uses `'unpaid'`, Invoice uses `'pending'`. Inconsistent.

**Action 1:** Update `frontend/src/features/order/OrderCreate.tsx`

```typescript
// Line 127 - change 'unpaid' to 'pending'
paymentStatus: 'pending',

// Line 156 - already 'pending', OK
paymentStatus: 'pending',
```

**Action 2:** Update `frontend/src/types/billing.ts` line 38:

```typescript
// OLD
paymentStatus: 'unpaid' | 'paid';

// NEW
paymentStatus: 'pending' | 'partial' | 'paid';
```

**Action 3:** Update `frontend/src/features/payment/PaymentList.tsx` line 63:

```typescript
// OLD
const unpaidOrders = orders.filter(o => o.paymentStatus === 'unpaid').length;

// NEW
const unpaidOrders = orders.filter(o => o.paymentStatus === 'pending').length;
```

**Action 4:** Update `frontend/src/features/payment/PaymentTableColumns.tsx` line 82:

```typescript
// OLD
if (!order.lastPaymentMethod || order.paymentStatus === 'unpaid') {

// NEW
if (!order.lastPaymentMethod || order.paymentStatus === 'pending') {
```

**Action 5:** Update `frontend/src/features/order/OrderDetailComponents.tsx` line 111:

```typescript
// OLD
: paymentStatus === 'unpaid'

// NEW
: paymentStatus === 'pending'
```

---

### 4. Add N+1 Query Fix

**Priority:** HIGH
**File:** `backend/app/api/v1/payments.py`

**Problem:** Each payment triggers a separate query for its order. 100 payments = 101 queries.

**Action 1:** Add import at top:

```python
from sqlalchemy.orm import joinedload
```

**Action 2:** Add relationship in `backend/app/models/billing.py`:

```python
class Payment(Base):
    __tablename__ = "payments"

    # ... existing fields ...

    # ADD this relationship
    order = relationship("Order", foreign_keys=[orderId])
```

**Action 3:** Update `get_payments()` query:

```python
@router.get("")
async def get_payments(...):
    query = db.query(Payment).options(
        joinedload(Payment.order)
    )

    if orderId:
        query = query.filter(Payment.orderId == orderId)

    query = query.order_by(Payment.paidAt.desc())
    payments = query.offset(skip).limit(limit).all()

    # Now payment.order is pre-loaded, no N+1
    return [_enrich_payment(p, p.order) for p in payments]
```

---

### 5. Add Max Recollection Limit

**Priority:** MEDIUM
**File:** `backend/app/api/v1/samples.py`

**Action 1:** Add constant at top of file:

```python
MAX_RECOLLECTION_ATTEMPTS = 3
```

**Action 2:** In `request_recollection()`, add validation before creating new sample:

```python
@router.post("/{sampleId}/request-recollection", status_code=201)
async def request_recollection(...):
    # ... existing validation ...

    # ADD: Check recollection limit
    rejection_count = len(original_sample.rejectionHistory or [])
    if rejection_count >= MAX_RECOLLECTION_ATTEMPTS:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum recollection attempts ({MAX_RECOLLECTION_ATTEMPTS}) reached. Please escalate to supervisor."
        )

    # ... rest of function ...
```

---

### 6. Add REPORTED Endpoint

**Priority:** MEDIUM
**File:** `backend/app/api/v1/orders.py`

**Action:** Add this new endpoint:

```python
@router.post("/{orderId}/report", status_code=200)
async def mark_as_reported(
    orderId: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_validator)
):
    """Mark a validated order as reported (final state)."""
    order = get_or_404(db, Order, orderId, "orderId")

    if order.overallStatus != OrderStatus.VALIDATED:
        raise HTTPException(
            status_code=400,
            detail=f"Order must be VALIDATED before reporting. Current status: {order.overallStatus}"
        )

    order.overallStatus = OrderStatus.REPORTED
    order.updatedAt = datetime.now(timezone.utc)
    db.commit()

    return {"orderId": orderId, "status": "reported", "message": "Order marked as reported"}
```

**Note:** Ensure these imports exist:
```python
from app.utils.db_helpers import get_or_404
from app.schemas.enums import OrderStatus
```

---

### 7. Atomic Order Creation (Frontend)

**Priority:** MEDIUM
**File:** `frontend/src/features/order/OrderCreate.tsx`

**Problem:** Order and invoice are created separately. If invoice fails, order is orphaned.

**Action:** Update `handleSubmit` with rollback logic:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!selectedPatient || !validate()) {
    return;
  }

  setIsSubmitting(true);

  try {
    // Create order first
    const newOrder = await createOrder(orderData);

    try {
      // Then create invoice
      await createInvoice({
        ...invoiceData,
        orderId: newOrder.orderId,
      });
    } catch (invoiceError) {
      // ROLLBACK: Delete the orphaned order
      logger.error('Invoice creation failed, rolling back order', invoiceError);
      try {
        await deleteOrder(newOrder.orderId);
      } catch (rollbackError) {
        logger.error('Failed to rollback order', rollbackError);
      }
      throw new Error('Failed to create invoice. Order has been cancelled.');
    }

    toast.success('Order created successfully');
    navigate(`/orders/${newOrder.orderId}`);

  } catch (error) {
    logger.error('Error creating order:', error);
    toast.error(getErrorMessage(error, 'Failed to create order'));
  } finally {
    setIsSubmitting(false);
  }
};
```

**Note:** Ensure `deleteOrder` function exists in the orders context/API. If not, add it:

```typescript
// In services/api/orders.ts
export const orderAPI = {
  // ... existing methods ...
  delete: (orderId: string) => apiClient.delete(`/orders/${orderId}`),
};
```

---

## Verification After Completion

Run these commands to verify:

```bash
# Backend - check for syntax errors
cd /Users/psiyou/Desktop/Atlas/backend
python -c "from app.main import app; print('Backend OK')"

# Frontend - build check
cd /Users/psiyou/Desktop/Atlas/frontend
npm run build

# Check no console statements crept back in
grep -r "console\." src/ --include="*.ts" --include="*.tsx" | grep -v logger.ts | grep -v node_modules
```

---

## Completion Checklist

After completing all tasks, verify:

- [ ] Authorization added to `get_patients()`, `get_orders()`, `get_payments()`, `get_samples()`
- [ ] PARTIAL enum added to PaymentStatus
- [ ] All frontend files use 'pending' instead of 'unpaid'
- [ ] joinedload added to payments query
- [ ] MAX_RECOLLECTION_ATTEMPTS = 3 enforced
- [ ] `/orders/{orderId}/report` endpoint exists
- [ ] Order creation has rollback on invoice failure
- [ ] `npm run build` passes
- [ ] Backend imports work without errors

---

**Report back with confirmation of each fix.**
