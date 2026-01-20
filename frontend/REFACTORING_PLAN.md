# Atlas Codebase Refactoring Plan

> **Generated:** January 2026
> **Target:** Production-ready, clean, optimized codebase
> **Executor:** Code Agent

---

## Executive Summary

This document outlines a comprehensive refactoring plan for the Atlas Laboratory Management System (frontend + backend). The analysis identified **87+ issues** across the codebase that need to be addressed to achieve production-ready code quality.

### Issue Distribution

| Severity | Count | Description |
|----------|-------|-------------|
| CRITICAL | 5 | Security vulnerabilities, hardcoded credentials |
| HIGH | 32 | Debug logs, missing validation, authorization gaps |
| MEDIUM | 35 | Code duplication, large files, deprecated APIs |
| LOW | 15+ | Unused code, naming inconsistencies |

---

## Table of Contents

1. [Critical Security Issues](#1-critical-security-issues)
2. [Debug & Console Statements](#2-debug--console-statements)
3. [Unused Code Cleanup](#3-unused-code-cleanup)
4. [Code Duplication](#4-code-duplication)
5. [Large Component Refactoring](#5-large-component-refactoring)
6. [Backend Validation & Error Handling](#6-backend-validation--error-handling)
7. [Deprecated API Updates](#7-deprecated-api-updates)
8. [Configuration & Constants](#8-configuration--constants)
9. [Empty Directories & Unused Dependencies](#9-empty-directories--unused-dependencies)
10. [TypeScript Improvements](#10-typescript-improvements)
11. [Final Verification Checklist](#11-final-verification-checklist)

---

## 1. Critical Security Issues

### 1.1 Remove Hardcoded Database Credentials

**File:** `backend/app/config.py`

**Current Code (Lines 10, 19):**
```python
DATABASE_URL: str = "postgresql://atlas:atlas123@localhost:5432/atlas_lab"
CORS_ORIGINS: str = "http://localhost:5173"
```

**Action:** Replace with environment variable fallbacks that don't expose credentials:
```python
DATABASE_URL: str = Field(default=..., env="DATABASE_URL")  # No default, must be set
CORS_ORIGINS: str = Field(default="", env="CORS_ORIGINS")  # Empty default
```

**Also update:** `backend/.env.example` to include templates without actual values.

---

### 1.2 Remove Debug Print Statements (Security Risk)

**File:** `backend/app/core/dependencies.py`

**Remove these lines:**
- **Line 22:** `print("DEBUG: No credentials found in request (Authorization header missing or invalid scheme)")`
- **Line 55:** `print(f"DEBUG: User {user.username} authenticated successfully. Role: {user.role}")`
- **Line 64:** `print(f"DEBUG: ACCESS DENIED. User {current_user.username} (role={current_user.role}) attempted to access resource requiring {allowed_roles}")`

**Action:** Replace with proper logging:
```python
import logging
logger = logging.getLogger(__name__)

# Line 22:
logger.debug("No credentials found in request")

# Line 55:
logger.info(f"User {user.username} authenticated")

# Line 64:
logger.warning(f"Access denied for user {current_user.username}")
```

---

### 1.3 Add Authorization Checks for Data Access

**Files to update:**

1. **`backend/app/api/v1/patients.py`** - Line 40 (`get_patients`)
   - Add role-based filtering or require specific role

2. **`backend/app/api/v1/orders.py`** - Line 22 (`get_orders`)
   - Add role-based filtering

3. **`backend/app/api/v1/results.py`** - Line 29 (`get_pending_entry`)
   - Ensure lab techs only see their assigned tests

**Action:** Add appropriate `Depends(require_*)` checks and consider row-level security.

---

## 2. Debug & Console Statements

### 2.1 Frontend - Remove All Console Statements (28 instances)

Replace all `console.*` calls with the existing logger utility at `src/utils/logger.ts`.

**High Priority - Debug Logs to Remove:**

| File | Line | Statement |
|------|------|-----------|
| `src/features/auth/AuthProvider.tsx` | 44 | `console.log('DEBUG: Login response received:', response)` |
| `src/features/auth/AuthProvider.tsx` | 50 | `console.log('DEBUG: Tokens stored in sessionStorage...')` |
| `src/features/auth/AuthProvider.tsx` | 52 | `console.error('DEBUG: No access_token in login response!')` |
| `src/services/api/client.ts` | 46 | `console.warn('DEBUG: No token found in storage for request')` |

**Other Console Errors to Convert:**

| File | Lines | Action |
|------|-------|--------|
| `src/features/patient/PatientProvider.tsx` | 81, 93, 105 | Replace `console.error` with `logger.error` |
| `src/features/order/OrderProvider.tsx` | 99, 111, 123, 152, 171, 295 | Replace `console.error` with `logger.error` |
| `src/features/lab/SamplesProvider.tsx` | 139, 161, 176 | Replace `console.error` with `logger.error` |
| `src/shared/ui/Icon.tsx` | 138, 145 | Replace `console.error` with `logger.error` |
| `src/features/lab/sample-collection/SampleLabel.tsx` | 120 | Replace `console.error` with `logger.error` |

**Import to add in each file:**
```typescript
import { logger } from '@/utils/logger';
```

---

## 3. Unused Code Cleanup

### 3.1 Remove Unused Exports

**File:** `src/utils/reference-ranges.ts`
- Delete `getResultColor()` function
- Delete `getResultBadgeColor()` function

**File:** `src/utils/sampleHelpers.ts`
- Delete `getContainerColor()` function (Line ~208)
- Delete `calculateRetentionExpiry()` function
- Delete `generateSampleId()` function
- Delete `generateMovementId()` function
- Delete `sortByPriority()` function
- Delete `validateVolume()` function

**File:** `src/utils/orderUtils.ts`
- Delete `markTestAsCritical()` function (Line 87)

### 3.2 Fix Duplicate Function in useUserDisplay Hook

**File:** `src/features/lab/useUserDisplay.ts`

**Current Code (Lines 14-27):**
```typescript
return {
  getUserDisplay: (userId: string) => getUserName(userId),
  getUserName: (userId: string) => getUserName(userId),  // DUPLICATE
  getUserInfo,
};
```

**Fix:** Remove one of the duplicate functions:
```typescript
return {
  getUserName: (userId: string) => getUserName(userId),
  getUserInfo,
};
```

Then update all usages of `getUserDisplay` to use `getUserName` instead.

### 3.3 Remove Unused Route Configuration

**File:** `src/config/routes.ts`

Either:
- **Option A:** Add route handler in `App.tsx` for `BILLING: '/billing'`
- **Option B:** Remove `BILLING` from ROUTES if not needed

---

## 4. Code Duplication

### 4.1 Backend - Extract Payment Enrichment Logic

**File:** `backend/app/api/v1/payments.py`

**Problem:** Same enrichment code repeated 3 times (Lines 43-62, 83-98, 122-137)

**Action:** Create helper function:
```python
# Add at top of file after imports
def _enrich_payment(payment: Payment, db: Session) -> dict:
    """Enrich payment with order data."""
    order = db.query(Order).filter(Order.orderId == payment.orderId).first()
    return {
        "paymentId": payment.paymentId,
        "orderId": payment.orderId,
        "invoiceId": payment.invoiceId,
        "amount": payment.amount,
        "paymentMethod": payment.paymentMethod,
        "paidAt": payment.paidAt,
        "receivedBy": payment.receivedBy,
        "receiptGenerated": payment.receiptGenerated,
        "notes": payment.notes,
        "orderTotalPrice": order.totalPrice if order else None,
        "numberOfTests": len(order.tests) if order else 0,
        "patientName": order.patient.fullName if order and order.patient else None,
    }
```

Then replace all 3 duplicate blocks with calls to this function.

### 4.2 Backend - Extract Generic Update Pattern

**Files:** `backend/app/api/v1/users.py`, `orders.py`, `tests.py`, `patients.py`

**Problem:** Duplicate update pattern in 4 files:
```python
update_data = model_data.model_dump(exclude_unset=True)
for field, value in update_data.items():
    setattr(model, field, value)
```

**Action:** Create utility in `backend/app/utils/db_helpers.py`:
```python
from pydantic import BaseModel
from sqlalchemy.orm import DeclarativeBase

def apply_updates(db_model: DeclarativeBase, update_schema: BaseModel) -> None:
    """Apply Pydantic schema updates to SQLAlchemy model."""
    update_data = update_schema.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if hasattr(db_model, field):
            setattr(db_model, field, value)
```

### 4.3 Frontend - Consolidate Type Lookup Functions

**File:** `src/utils/typeHelpers.ts`

**Problem:** Multiple functions with identical lookup patterns:
- `getTestName()` (Line 14)
- `getTestSampleType()` (Line 25)
- `getTestCategory()` (Line 36)
- `getTestNames()` (Line 90)

**Action:** Create generic lookup function:
```typescript
function getTestProperty<K extends keyof Test>(
  testCode: string,
  property: K,
  testCatalog: Test[]
): Test[K] | undefined {
  const test = testCatalog.find(t => t.code === testCode);
  return test?.[property];
}
```

---

## 5. Large Component Refactoring

### 5.1 Split SampleDetail.tsx (561 lines)

**File:** `src/features/lab/sample-collection/SampleDetail.tsx`

**Action:** Split into:
1. `SampleDetailModal.tsx` - Main modal wrapper
2. `SampleRequirementsSection.tsx` - Requirements display (containers, volumes)
3. `SampleRejectionSection.tsx` - Rejection history display
4. `SampleInfoSection.tsx` - Basic sample info

### 5.2 Split PatientDetailSections.tsx (550 lines)

**File:** `src/features/patient/PatientDetailSections.tsx`

**Action:** Split into separate files:
1. `PatientInfoCard.tsx`
2. `AffiliationCard.tsx`
3. `MedicalHistoryCard.tsx`
4. `OrderHistoryCard.tsx`
5. `AppointmentHistoryCard.tsx`

Create `src/features/patient/sections/` directory for these.

### 5.3 Split PatientForm.tsx (422 lines)

**File:** `src/features/patient/PatientForm.tsx`

**Action:** Split into:
1. `PatientDemographicsSection.tsx`
2. `PatientAddressSection.tsx`
3. `PatientEmergencyContactSection.tsx`
4. `PatientAffiliationSection.tsx`
5. `PatientMedicalHistorySection.tsx`

Create `src/features/patient/form-sections/` directory.

### 5.4 Split DateFilter.tsx (420 lines)

**File:** `src/features/order/DateFilter.tsx`

**Action:** Split calendar views:
1. `DateFilter.tsx` - Main component
2. `CalendarDaysView.tsx` - Days grid
3. `CalendarMonthsView.tsx` - Months grid
4. `CalendarYearsView.tsx` - Years grid

### 5.5 Split EditPatientModal.tsx (397 lines)

**File:** `src/features/patient/EditPatientModal.tsx`

**Action:**
- Extract form state management to `usePatientForm.ts` (enhance existing)
- Keep modal as thin wrapper around form

---

## 6. Backend Validation & Error Handling

### 6.1 Add Input Validation

**File:** `backend/app/schemas/order.py`

Add validation to `OrderCreate`:
```python
from pydantic import Field, field_validator

class OrderCreate(BaseModel):
    patientId: str
    tests: list[OrderTestCreate] = Field(min_length=1)  # At least 1 test
    priority: PriorityLevel = PriorityLevel.ROUTINE

    @field_validator('tests')
    @classmethod
    def no_duplicate_tests(cls, v):
        codes = [t.testCode for t in v]
        if len(codes) != len(set(codes)):
            raise ValueError('Duplicate test codes not allowed')
        return v
```

**File:** `backend/app/schemas/patient.py`

Add validation:
```python
from pydantic import EmailStr, Field, field_validator
import re

class PatientCreate(BaseModel):
    fullName: str = Field(min_length=2, max_length=100)
    phone: str = Field(min_length=10, max_length=20)
    email: EmailStr | None = None

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        if not re.match(r'^[\d\s\-\+\(\)]+$', v):
            raise ValueError('Invalid phone number format')
        return v
```

**File:** `backend/app/api/v1/patients.py`

Add search length validation (Line 32):
```python
@router.get("")
async def get_patients(
    search: str | None = Query(None, max_length=100),
    # ...
):
```

### 6.2 Add Error Handling to Database Operations

**File:** `backend/app/api/v1/orders.py`

Wrap order creation in transaction (Lines 124-129):
```python
from sqlalchemy.exc import SQLAlchemyError

try:
    db.add(order)
    db.flush()  # Get order ID without committing

    # Generate samples
    samples = generate_samples_for_order(order.orderId, db, current_user.id)
    for sample in samples:
        db.add(sample)

    db.commit()
    db.refresh(order)
except SQLAlchemyError as e:
    db.rollback()
    raise HTTPException(status_code=500, detail="Failed to create order")
```

**File:** `backend/app/api/v1/payments.py`

Add null checks (Lines 44-62):
```python
for payment in payments:
    order = db.query(Order).filter(Order.orderId == payment.orderId).first()
    if not order:
        logger.warning(f"Order {payment.orderId} not found for payment {payment.paymentId}")
        continue
    # ... rest of enrichment
```

### 6.3 Consolidate Database Commits

**File:** `backend/app/services/order_status_updater.py`

**Problem:** Multiple `db.commit()` calls in different branches.

**Action:** Use single commit at end:
```python
def update_order_status(db: Session, order_id: str) -> None:
    order = db.query(Order).filter(Order.orderId == order_id).first()
    if not order:
        return

    new_status = _calculate_order_status(order)
    if order.overallStatus != new_status:
        order.overallStatus = new_status
        order.updatedAt = datetime.now(timezone.utc)

    db.commit()  # Single commit at end
```

---

## 7. Deprecated API Updates

### 7.1 Replace datetime.utcnow() (Python 3.12+ Deprecation)

**Files to update:**
- `backend/app/api/v1/payments.py` (Line 167)
- `backend/app/api/v1/orders.py` (Line 111)
- `backend/app/api/v1/samples.py` (Lines 101, 154, 171, 259)
- `backend/app/api/v1/results.py` (Lines 81, 127)
- `backend/app/core/security.py` (Lines 28, 30, 40)

**Search and replace:**
```python
# OLD
from datetime import datetime
datetime.utcnow()

# NEW
from datetime import datetime, timezone
datetime.now(timezone.utc)
```

---

## 8. Configuration & Constants

### 8.1 Extract Hardcoded Values to Config

**Create:** `src/config/constants.ts`

```typescript
export const ANIMATION_CONFIG = {
  loginFormDelays: ['1s', '2s'],
} as const;

export const PAGINATION_CONFIG = {
  defaultPageSize: 10,
  samplePreviewLimit: 5,
  testPreviewLimit: 10,
} as const;

export const DATE_RANGE_CONFIG = {
  maxYearsBack: 10,
  maxYearsForward: 1,
} as const;

export const TABLE_COLUMN_WIDTHS = {
  small: '8%',
  medium: '12%',
  large: '20%',
  xlarge: '30%',
} as const;
```

**Update files:**
- `src/features/auth/LoginForm.tsx` (Lines 66-67) - Use `ANIMATION_CONFIG`
- `src/features/order/DateFilter.tsx` (Lines 50-51) - Use `DATE_RANGE_CONFIG`
- `src/features/order/OrderCreate.tsx` (Lines 55-56, 66) - Use `PAGINATION_CONFIG`
- `src/features/order/OrderDetail.tsx` (Lines 268-273) - Use `TABLE_COLUMN_WIDTHS`
- `src/features/patient/PatientDetail.tsx` (Lines 264-270) - Use `TABLE_COLUMN_WIDTHS`

### 8.2 Extract Inline Styles to CSS/Tailwind Classes

**File:** `src/features/patient/PatientDetailSections.tsx` (Line 406)

Replace:
```tsx
style={{ width: 20, height: 20 }}
```
With:
```tsx
className="w-5 h-5"
```

**File:** `src/features/lab/result-entry/ResultDetail.tsx` (Line 99)

Keep dynamic style for progress bar (acceptable for runtime values).

---

## 9. Empty Directories & Unused Dependencies

### 9.1 Remove Empty Directories

**Directories to delete:**
- `src/features/dashboard/` (empty)
- `src/features/report/` (empty)

Or if features are planned, add placeholder `index.ts` files:
```typescript
// src/features/dashboard/index.ts
export {}; // Placeholder for future dashboard feature
```

### 9.2 Remove Unused Dependencies

**File:** `package.json`

Remove these unused dependencies:
```json
{
  "dependencies": {
    // REMOVE THESE:
    "rsuite": "^6.1.1",
    "jspdf": "^4.0.0",
    "react-window": "^2.2.4",
    "react-virtualized-auto-sizer": "^2.0.2"
  }
}
```

**Run:** `npm uninstall rsuite jspdf react-window react-virtualized-auto-sizer`

### 9.3 Clean Empty Backend Files

**File:** `backend/db_scripts/__init__.py`

Either add docstring or delete if not needed for imports:
```python
"""Database scripts for data generation and migrations."""
```

---

## 10. TypeScript Improvements

### 10.1 Add Stricter Types to API Client

**File:** `src/services/api/client.ts`

Replace generic types with mapped endpoint types:
```typescript
type APIEndpoints = {
  '/patients': Patient[];
  '/patients/:id': Patient;
  '/orders': Order[];
  // ... etc
};
```

### 10.2 Fix useAuth Hook Typing

**File:** `src/features/auth/useAuth.ts`

Ensure return type is fully typed:
```typescript
interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export function useAuth(): AuthContextValue {
  // ...
}
```

### 10.3 Fix Implicit Any in Providers

Review and add explicit types to all context provider values.

---

## 11. Final Verification Checklist

After completing all refactoring tasks, verify:

### Build & Lint
- [ ] `npm run build` passes without errors
- [ ] `npm run lint` passes without warnings
- [ ] TypeScript strict mode passes

### Frontend Testing
- [ ] Login/logout works
- [ ] Patient CRUD operations work
- [ ] Order creation works
- [ ] Sample collection workflow works
- [ ] Payment processing works
- [ ] All routes accessible by appropriate roles

### Backend Testing
- [ ] All API endpoints return expected responses
- [ ] Authentication/authorization works
- [ ] Database operations complete without errors
- [ ] No debug output in console/logs

### Code Quality
- [ ] No `console.log/error/warn` statements
- [ ] No hardcoded credentials
- [ ] No unused exports
- [ ] No duplicate code blocks
- [ ] All components under 300 lines
- [ ] All functions under 50 lines

### Security
- [ ] Environment variables for all secrets
- [ ] Proper authorization on all endpoints
- [ ] Input validation on all user inputs
- [ ] No sensitive data in logs

---

## Execution Order

Execute tasks in this order to minimize conflicts:

1. **Phase 1: Security** (Critical)
   - Section 1: All security fixes
   - Section 2.1: Debug statements in backend

2. **Phase 2: Cleanup** (High)
   - Section 3: Unused code removal
   - Section 9: Empty directories & dependencies

3. **Phase 3: Refactoring** (Medium)
   - Section 4: Code duplication
   - Section 5: Large component splits
   - Section 7: Deprecated APIs

4. **Phase 4: Enhancement** (Low)
   - Section 6: Validation & error handling
   - Section 8: Configuration extraction
   - Section 10: TypeScript improvements

5. **Phase 5: Verification**
   - Section 11: Full testing

---

## Summary Statistics

| Category | Items | Estimated Impact |
|----------|-------|-----------------|
| Security fixes | 5 | Critical |
| Console removals | 28 | High |
| Unused code deletion | 15+ | Medium |
| Code deduplication | 6 | Medium |
| Component splits | 5 | Medium |
| Validation additions | 10+ | High |
| Deprecated API fixes | 10 | Medium |
| Config extraction | 8 | Low |
| Dependency cleanup | 4 | Low |

**Total Estimated Changes:** 87+ individual fixes across 50+ files

---

*End of Refactoring Plan*
