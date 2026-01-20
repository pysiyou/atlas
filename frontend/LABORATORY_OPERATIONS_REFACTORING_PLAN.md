# Laboratory Operations Refactoring Plan

## Executive Summary

This document outlines a comprehensive refactoring plan for the Atlas laboratory operations module, focusing on sample collection/rejection, result entry, result validation/rejection, and the complex interactions between these operations.

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Identified Issues](#2-identified-issues)
3. [Proposed Architecture](#3-proposed-architecture)
4. [Detailed Refactoring Plan](#4-detailed-refactoring-plan)
5. [Implementation Phases](#5-implementation-phases)
6. [API Contract Changes](#6-api-contract-changes)
7. [Database Schema Changes](#7-database-schema-changes)
8. [Frontend Component Changes](#8-frontend-component-changes)
9. [Testing Strategy](#9-testing-strategy)

---

## 1. Current State Analysis

### 1.1 Backend Architecture

#### Current Endpoints

| Module | Endpoint | Purpose |
|--------|----------|---------|
| Samples | `PATCH /samples/{sampleId}/collect` | Mark sample as collected |
| Samples | `PATCH /samples/{sampleId}/reject` | Reject a collected sample |
| Samples | `POST /samples/{sampleId}/request-recollection` | Request new sample after rejection |
| Results | `GET /results/pending-entry` | Get tests awaiting result entry |
| Results | `GET /results/pending-validation` | Get tests awaiting validation |
| Results | `POST /results/{orderId}/tests/{testCode}` | Enter test results |
| Results | `POST /results/{orderId}/tests/{testCode}/validate` | Approve results |
| Results | `POST /results/{orderId}/tests/{testCode}/reject` | Reject results (re-test or re-collect) |

#### Current Services

- `sample_recollection.py` - Handles rejection and recollection logic
- `order_status_updater.py` - Calculates order status from test/sample states
- `sample_generator.py` - Creates samples when orders are placed

#### Current Models

- `Sample` - Physical specimen with status, rejection history, recollection tracking
- `Order` - Lab order container
- `OrderTest` - Individual test within an order with results, retest tracking
- `Test` - Test catalog definition

### 1.2 Frontend Architecture

#### Current Components

```
features/lab/
├── sample-collection/       # Sample collection workflow
├── result-entry/           # Result entry by technicians
│   ├── ResultEntryView.tsx
│   ├── ResultCard.tsx
│   ├── ResultForm.tsx
│   ├── ResultDetail.tsx
│   └── ResultRejectionSection.tsx
├── result-validation/      # Result validation by supervisors
│   ├── ResultValidationView.tsx
│   ├── ValidationCard.tsx
│   ├── ValidationDetail.tsx
│   └── ResultRejectionPopover.tsx
└── shared/                 # Shared components
```

#### Current State Management

- `SamplesProvider` - Context wrapper around TanStack Query hooks
- Query hooks in `hooks/queries/useSamples.ts`, `useTestCatalog.ts`
- API services in `services/api/results.ts`, `samples.ts`

---

## 2. Identified Issues

### 2.1 Backend Issues

#### Issue 1: Inconsistent Operation Naming
- **Problem:** `reject` vs `request-recollection` are separate endpoints but semantically related
- **Impact:** Client must make two API calls for a single logical operation
- **Location:** `backend/app/api/v1/samples.py`

#### Issue 2: Duplicated Rejection Logic
- **Problem:** Similar rejection tracking exists in both Sample and OrderTest models
- **Impact:** Maintenance burden, potential inconsistency
- **Location:** `Sample.rejectionHistory` vs `OrderTest.resultRejectionHistory`

#### Issue 3: Missing Unified Action Types
- **Problem:** No centralized enum for all possible rejection actions and their effects
- **Impact:** Business logic scattered across multiple files
- **Location:** `backend/app/schemas/enums.py`

#### Issue 4: Incomplete Status Transition Validation
- **Problem:** Status transitions not strictly validated against allowed transitions
- **Impact:** Potential invalid state transitions in edge cases
- **Location:** `backend/app/services/order_status_updater.py`

#### Issue 5: Missing Audit Trail for All Operations
- **Problem:** Some operations don't log complete audit information
- **Impact:** Incomplete traceability for compliance
- **Location:** Various API endpoints

### 2.2 Frontend Issues

#### Issue 1: Scattered Rejection UI Logic
- **Problem:** Rejection handling split across multiple components
- **Impact:** Inconsistent user experience, code duplication
- **Location:** `ResultRejectionPopover.tsx`, `ResultRejectionSection.tsx`

#### Issue 2: Missing Unified Workflow State
- **Problem:** Each workflow stage manages its own state independently
- **Impact:** No holistic view of sample/test lifecycle
- **Location:** Each view component

#### Issue 3: Incomplete Error Handling
- **Problem:** Edge cases in rejection flows not fully handled
- **Impact:** Poor UX when limits reached or operations fail
- **Location:** Various components

#### Issue 4: Type Inconsistencies
- **Problem:** Some types don't match backend schemas exactly
- **Impact:** Runtime errors, type safety gaps
- **Location:** `types/sample.ts`, `types/order.ts`

---

## 3. Proposed Architecture

### 3.1 Unified Lab Operation Model

```
                    ┌─────────────────────────────────────────────┐
                    │           LAB OPERATION ENGINE              │
                    │                                             │
                    │  ┌─────────────────────────────────────┐   │
                    │  │     Operation State Machine         │   │
                    │  │                                     │   │
                    │  │  SAMPLE_PENDING                     │   │
                    │  │       ↓                             │   │
                    │  │  SAMPLE_COLLECTED ←──────────────┐  │   │
                    │  │       ↓                          │  │   │
                    │  │  RESULT_ENTRY                    │  │   │
                    │  │       ↓                          │  │   │
                    │  │  RESULT_VALIDATION               │  │   │
                    │  │       ↓         ↓                │  │   │
                    │  │  VALIDATED   REJECTED            │  │   │
                    │  │                 ↓                │  │   │
                    │  │            ┌────┴────┐           │  │   │
                    │  │            ↓         ↓           │  │   │
                    │  │       RE_TEST    RE_COLLECT ─────┘  │   │
                    │  │            ↓                        │   │
                    │  │      SUPERSEDED                     │   │
                    │  └─────────────────────────────────────┘   │
                    │                                             │
                    │  ┌─────────────────────────────────────┐   │
                    │  │       Action Handlers               │   │
                    │  │                                     │   │
                    │  │  • CollectSample                    │   │
                    │  │  • RejectSample                     │   │
                    │  │  • RequestRecollection              │   │
                    │  │  • EnterResults                     │   │
                    │  │  • ValidateResults                  │   │
                    │  │  • RejectResults (re-test)          │   │
                    │  │  • RejectResults (re-collect)       │   │
                    │  └─────────────────────────────────────┘   │
                    │                                             │
                    │  ┌─────────────────────────────────────┐   │
                    │  │       Audit Trail Service           │   │
                    │  │                                     │   │
                    │  │  Records all operations with:       │   │
                    │  │  • Timestamp                        │   │
                    │  │  • User ID                          │   │
                    │  │  • Operation Type                   │   │
                    │  │  • Before/After State              │   │
                    │  │  • Related Entities                 │   │
                    │  └─────────────────────────────────────┘   │
                    └─────────────────────────────────────────────┘
```

### 3.2 New Enum Definitions

```python
class LabOperationType(str, Enum):
    # Sample Operations
    SAMPLE_COLLECT = "sample_collect"
    SAMPLE_REJECT = "sample_reject"
    SAMPLE_RECOLLECTION_REQUEST = "sample_recollection_request"

    # Result Operations
    RESULT_ENTRY = "result_entry"
    RESULT_VALIDATION_APPROVE = "result_validation_approve"
    RESULT_VALIDATION_REJECT_RETEST = "result_validation_reject_retest"
    RESULT_VALIDATION_REJECT_RECOLLECT = "result_validation_reject_recollect"

class RejectionAction(str, Enum):
    """Action to take when rejecting a result or sample"""
    RETEST_SAME_SAMPLE = "retest_same_sample"      # Use existing sample, run test again
    RECOLLECT_NEW_SAMPLE = "recollect_new_sample"  # Get new sample from patient
    ESCALATE_TO_SUPERVISOR = "escalate"            # Limits exceeded, need supervisor

class RejectionSource(str, Enum):
    """Where the rejection originated from"""
    SAMPLE_COLLECTION = "sample_collection"   # Rejected during/after collection
    RESULT_VALIDATION = "result_validation"   # Rejected during result validation
```

### 3.3 State Transition Matrix

| Current State | Action | Next State | Notes |
|---------------|--------|------------|-------|
| `sample.PENDING` | Collect | `sample.COLLECTED` | Normal flow |
| `sample.COLLECTED` | Reject | `sample.REJECTED` | Quality issue |
| `sample.REJECTED` | Request Recollection | New `sample.PENDING` | Up to 3 attempts |
| `test.SAMPLE_COLLECTED` | Enter Results | `test.COMPLETED` | Normal flow |
| `test.COMPLETED` | Validate (approve) | `test.VALIDATED` | Final state |
| `test.COMPLETED` | Reject (re-test) | `test.SUPERSEDED` + New `test.SAMPLE_COLLECTED` | Same sample |
| `test.COMPLETED` | Reject (re-collect) | `test.PENDING` + `sample.REJECTED` + New `sample.PENDING` | New sample |

---

## 4. Detailed Refactoring Plan

### 4.1 Backend Refactoring

#### 4.1.1 Create Unified Lab Operations Service

**New File:** `backend/app/services/lab_operations.py`

```python
"""
Unified service for all laboratory operations.
Provides a single source of truth for operation handling.
"""

class LabOperationsService:
    def __init__(self, db: Session):
        self.db = db
        self.audit = AuditService(db)

    # Sample Operations
    async def collect_sample(self, sample_id: str, data: CollectSampleRequest, user_id: str) -> Sample
    async def reject_sample(self, sample_id: str, data: RejectSampleRequest, user_id: str) -> Sample
    async def request_recollection(self, sample_id: str, reason: str, user_id: str) -> Sample

    # Result Operations
    async def enter_results(self, order_id: str, test_code: str, data: EnterResultsRequest, user_id: str) -> OrderTest
    async def validate_results(self, order_id: str, test_code: str, data: ValidateResultsRequest, user_id: str) -> OrderTest
    async def reject_results(self, order_id: str, test_code: str, data: RejectResultsRequest, user_id: str) -> RejectionResult

    # Combined Operations
    async def reject_sample_and_recollect(self, sample_id: str, data: RejectAndRecollectRequest, user_id: str) -> Tuple[Sample, Sample]
    async def reject_result_with_action(self, order_id: str, test_code: str, data: RejectWithActionRequest, user_id: str) -> RejectionResult

    # Validation helpers
    def can_retest(self, order_test: OrderTest) -> Tuple[bool, str]
    def can_recollect(self, sample: Sample) -> Tuple[bool, str]
    def get_available_rejection_actions(self, order_test: OrderTest) -> List[AvailableAction]
```

#### 4.1.2 Create Audit Trail Service

**New File:** `backend/app/services/audit_service.py`

```python
class AuditService:
    """Records all lab operations for compliance and traceability."""

    async def log_operation(
        self,
        operation_type: LabOperationType,
        entity_type: str,
        entity_id: str,
        user_id: str,
        before_state: dict,
        after_state: dict,
        metadata: dict = None
    ) -> AuditLog
```

#### 4.1.3 Create State Machine Validator

**New File:** `backend/app/services/state_machine.py`

```python
class SampleStateMachine:
    TRANSITIONS = {
        SampleStatus.PENDING: [SampleStatus.COLLECTED, SampleStatus.REJECTED],
        SampleStatus.COLLECTED: [SampleStatus.RECEIVED, SampleStatus.REJECTED],
        SampleStatus.RECEIVED: [SampleStatus.ACCESSIONED, SampleStatus.REJECTED],
        SampleStatus.ACCESSIONED: [SampleStatus.IN_PROGRESS, SampleStatus.REJECTED],
        SampleStatus.IN_PROGRESS: [SampleStatus.COMPLETED, SampleStatus.REJECTED],
        SampleStatus.COMPLETED: [SampleStatus.STORED, SampleStatus.DISPOSED],
        SampleStatus.REJECTED: [],  # Terminal - recollection creates new sample
        SampleStatus.STORED: [SampleStatus.DISPOSED],
        SampleStatus.DISPOSED: [],  # Terminal
    }

    def can_transition(self, from_status: SampleStatus, to_status: SampleStatus) -> bool
    def validate_transition(self, sample: Sample, to_status: SampleStatus) -> None  # Raises on invalid

class TestStateMachine:
    TRANSITIONS = {
        TestStatus.PENDING: [TestStatus.SAMPLE_COLLECTED, TestStatus.REJECTED],
        TestStatus.SAMPLE_COLLECTED: [TestStatus.IN_PROGRESS, TestStatus.REJECTED],
        TestStatus.IN_PROGRESS: [TestStatus.COMPLETED, TestStatus.REJECTED],
        TestStatus.COMPLETED: [TestStatus.VALIDATED, TestStatus.SUPERSEDED],
        TestStatus.VALIDATED: [],  # Terminal
        TestStatus.REJECTED: [TestStatus.PENDING],  # Via recollection
        TestStatus.SUPERSEDED: [],  # Terminal - replaced by retest
    }
```

#### 4.1.4 Refactor API Endpoints

**File:** `backend/app/api/v1/samples.py`

```python
# NEW: Combined reject and recollect endpoint
@router.post("/{sample_id}/reject-and-recollect")
async def reject_and_recollect_sample(
    sample_id: str,
    request: RejectAndRecollectRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> RejectAndRecollectResponse:
    """
    Atomically reject a sample and request recollection.
    Combines two operations into one transaction.
    """
    service = LabOperationsService(db)
    rejected_sample, new_sample = await service.reject_sample_and_recollect(
        sample_id, request, current_user.id
    )
    return RejectAndRecollectResponse(
        rejected_sample=rejected_sample,
        new_sample=new_sample,
        recollection_attempt=new_sample.recollectionAttempt
    )
```

**File:** `backend/app/api/v1/results.py`

```python
# ENHANCED: Result rejection with clear action types
@router.post("/{order_id}/tests/{test_code}/reject")
async def reject_test_result(
    order_id: str,
    test_code: str,
    request: RejectResultRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> RejectResultResponse:
    """
    Reject test results with specified action.

    Actions:
    - retest_same_sample: Create new OrderTest, reuse sample
    - recollect_new_sample: Reject sample, create recollection
    - escalate: Return guidance when limits exceeded
    """
    service = LabOperationsService(db)

    # Check what actions are available
    available_actions = service.get_available_rejection_actions(order_test)
    if request.action not in [a.action for a in available_actions]:
        raise HTTPException(400, f"Action {request.action} not available")

    result = await service.reject_result_with_action(
        order_id, test_code, request, current_user.id
    )
    return result

# NEW: Get available rejection actions for a test
@router.get("/{order_id}/tests/{test_code}/rejection-options")
async def get_rejection_options(
    order_id: str,
    test_code: str,
    db: Session = Depends(get_db)
) -> RejectionOptionsResponse:
    """
    Get available rejection actions and their status.
    Useful for frontend to know what options to show.
    """
    service = LabOperationsService(db)
    order_test = get_order_test(db, order_id, test_code)
    sample = get_sample(db, order_test.sampleId)

    return RejectionOptionsResponse(
        can_retest=service.can_retest(order_test),
        retest_attempts_remaining=3 - (order_test.retestNumber or 0),
        can_recollect=service.can_recollect(sample),
        recollection_attempts_remaining=3 - (sample.recollectionAttempt or 1),
        available_actions=service.get_available_rejection_actions(order_test)
    )
```

### 4.2 Frontend Refactoring

#### 4.2.1 Create Unified Rejection Manager

**New File:** `src/features/lab/shared/hooks/useRejectionManager.ts`

```typescript
interface RejectionOptions {
  canRetest: boolean;
  retestAttemptsRemaining: number;
  canRecollect: boolean;
  recollectionAttemptsRemaining: number;
  availableActions: AvailableAction[];
}

interface AvailableAction {
  action: RejectionAction;
  enabled: boolean;
  disabledReason?: string;
}

export function useRejectionManager(orderId: string, testCode: string) {
  const [options, setOptions] = useState<RejectionOptions | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch rejection options from API
  const fetchOptions = useCallback(async () => {
    const response = await resultAPI.getRejectionOptions(orderId, testCode);
    setOptions(response);
  }, [orderId, testCode]);

  // Execute rejection with selected action
  const rejectWithAction = useCallback(async (
    action: RejectionAction,
    reason: string
  ) => {
    return resultAPI.rejectResults(orderId, testCode, { action, reason });
  }, [orderId, testCode]);

  return {
    options,
    isLoading,
    fetchOptions,
    rejectWithAction,
  };
}
```

#### 4.2.2 Create Unified Rejection Dialog

**New File:** `src/features/lab/shared/RejectionDialog.tsx`

```typescript
interface RejectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  testCode: string;
  testName: string;
  onSuccess: (result: RejectionResult) => void;
}

export function RejectionDialog({
  isOpen,
  onClose,
  orderId,
  testCode,
  testName,
  onSuccess,
}: RejectionDialogProps) {
  const { options, fetchOptions, rejectWithAction } = useRejectionManager(orderId, testCode);
  const [selectedAction, setSelectedAction] = useState<RejectionAction | null>(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (isOpen) fetchOptions();
  }, [isOpen, fetchOptions]);

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogHeader>
        <Title>Reject Result: {testName}</Title>
      </DialogHeader>

      <DialogContent>
        {/* Action Selection */}
        <ActionSelector
          actions={options?.availableActions}
          selectedAction={selectedAction}
          onSelect={setSelectedAction}
        />

        {/* Reason Input */}
        <ReasonInput value={reason} onChange={setReason} />

        {/* Attempt Counter Display */}
        {selectedAction === 'retest_same_sample' && (
          <AttemptsRemaining count={options?.retestAttemptsRemaining} type="retest" />
        )}
        {selectedAction === 'recollect_new_sample' && (
          <AttemptsRemaining count={options?.recollectionAttemptsRemaining} type="recollection" />
        )}

        {/* Escalation Warning */}
        {options?.availableActions.every(a => !a.enabled) && (
          <EscalationWarning />
        )}
      </DialogContent>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button
          variant="destructive"
          onClick={() => handleReject()}
          disabled={!selectedAction || !reason}
        >
          Confirm Rejection
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
```

#### 4.2.3 Create Lab Workflow Context

**New File:** `src/features/lab/context/LabWorkflowContext.tsx`

```typescript
interface LabWorkflowState {
  // Current workflow stage
  currentStage: 'collection' | 'entry' | 'validation' | null;

  // Selected items
  selectedSample: Sample | null;
  selectedTest: OrderTest | null;

  // Operation state
  pendingOperation: LabOperation | null;
  operationHistory: LabOperationRecord[];

  // Modals
  activeModal: 'rejection' | 'details' | null;
}

interface LabWorkflowContextValue extends LabWorkflowState {
  // Actions
  selectSample: (sample: Sample) => void;
  selectTest: (test: OrderTest) => void;
  openRejectionDialog: (test: OrderTest) => void;
  closeModals: () => void;

  // Operations
  collectSample: (data: CollectSampleData) => Promise<void>;
  rejectSample: (data: RejectSampleData) => Promise<void>;
  enterResults: (data: EnterResultsData) => Promise<void>;
  validateResults: (data: ValidateResultsData) => Promise<void>;
  rejectResults: (data: RejectResultsData) => Promise<void>;

  // Refresh
  refreshWorkflow: () => Promise<void>;
}

export const LabWorkflowProvider: React.FC<PropsWithChildren> = ({ children }) => {
  // Implementation
};
```

#### 4.2.4 Update API Service Layer

**File:** `src/services/api/results.ts`

```typescript
export const resultAPI = {
  // Existing methods...

  // NEW: Get rejection options
  async getRejectionOptions(
    orderId: string,
    testCode: string
  ): Promise<RejectionOptionsResponse> {
    const response = await apiClient.get(
      `/results/${orderId}/tests/${testCode}/rejection-options`
    );
    return response.data;
  },

  // ENHANCED: Reject with action
  async rejectResults(
    orderId: string,
    testCode: string,
    data: {
      action: RejectionAction;
      reason: string;
    }
  ): Promise<RejectionResult> {
    const response = await apiClient.post(
      `/results/${orderId}/tests/${testCode}/reject`,
      data
    );
    return response.data;
  },
};
```

#### 4.2.5 Update Type Definitions

**File:** `src/types/lab-operations.ts` (New)

```typescript
// Rejection Actions
export type RejectionAction =
  | 'retest_same_sample'
  | 'recollect_new_sample'
  | 'escalate';

// Rejection Source
export type RejectionSource =
  | 'sample_collection'
  | 'result_validation';

// Available Action
export interface AvailableAction {
  action: RejectionAction;
  enabled: boolean;
  disabledReason?: string;
  label: string;
  description: string;
}

// Rejection Options Response
export interface RejectionOptionsResponse {
  canRetest: boolean;
  retestAttemptsRemaining: number;
  canRecollect: boolean;
  recollectionAttemptsRemaining: number;
  availableActions: AvailableAction[];
}

// Rejection Result
export interface RejectionResult {
  success: boolean;
  action: RejectionAction;
  originalTest: OrderTest;
  newTest?: OrderTest;  // If retest
  newSample?: Sample;   // If recollection
  escalationRequired?: boolean;
  message: string;
}

// Audit Record
export interface LabOperationRecord {
  id: string;
  operationType: string;
  entityType: 'sample' | 'test' | 'order';
  entityId: string;
  performedBy: string;
  performedAt: string;
  beforeState: Record<string, unknown>;
  afterState: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}
```

---

## 5. Implementation Phases

### Phase 1: Backend Foundation (Week 1)

**Tasks:**

1. **Create New Enums**
   - Add `LabOperationType`, `RejectionAction`, `RejectionSource` to `enums.py`
   - Ensure frontend enum types are synced

2. **Create State Machine Service**
   - Implement `SampleStateMachine` and `TestStateMachine`
   - Add transition validation to existing services

3. **Create Audit Service**
   - Design `LabOperationLog` model
   - Implement `AuditService` with logging methods

4. **Create Unified Lab Operations Service**
   - Migrate logic from `sample_recollection.py`
   - Add validation and audit logging

### Phase 2: Backend API Enhancement (Week 2)

**Tasks:**

1. **Add New Endpoints**
   - `GET /results/{orderId}/tests/{testCode}/rejection-options`
   - `POST /samples/{sampleId}/reject-and-recollect`

2. **Enhance Existing Endpoints**
   - Update `POST /results/{orderId}/tests/{testCode}/reject` to use new action types
   - Add audit logging to all mutation endpoints

3. **Update Response Schemas**
   - Add `RejectionOptionsResponse`
   - Add `RejectionResult` with full context

4. **Add Tests**
   - Unit tests for state machine
   - Integration tests for rejection flows
   - Edge case tests (limits, invalid transitions)

### Phase 3: Frontend Type Updates (Week 2)

**Tasks:**

1. **Create New Type Definitions**
   - Add `src/types/lab-operations.ts`
   - Update existing types in `order.ts`, `sample.ts`

2. **Update API Service Layer**
   - Add new methods to `results.ts`
   - Update existing method signatures

3. **Sync Enums**
   - Ensure frontend enums match backend

### Phase 4: Frontend Component Refactoring (Week 3)

**Tasks:**

1. **Create Shared Hooks**
   - `useRejectionManager`
   - `useLabWorkflow`

2. **Create Unified Rejection Dialog**
   - Single component for all rejection scenarios
   - Displays available actions dynamically
   - Shows attempt counters and warnings

3. **Create Lab Workflow Context**
   - Central state management for lab operations
   - Provides consistent operation methods

4. **Refactor Existing Components**
   - Update `ResultRejectionPopover` to use new dialog
   - Update `ValidationCard` to use workflow context
   - Update `ResultCard` to show unified rejection history

### Phase 5: Integration & Testing (Week 4)

**Tasks:**

1. **End-to-End Testing**
   - Test complete rejection flows
   - Verify state transitions
   - Check audit trail creation

2. **UI/UX Polish**
   - Consistent styling across rejection dialogs
   - Clear messaging for limits and escalation
   - Loading states and error handling

3. **Documentation**
   - Update API documentation
   - Add inline code comments
   - Update user documentation if needed

---

## 6. API Contract Changes

### 6.1 New Endpoints

#### `GET /results/{orderId}/tests/{testCode}/rejection-options`

**Response:**
```json
{
  "canRetest": true,
  "retestAttemptsRemaining": 2,
  "canRecollect": true,
  "recollectionAttemptsRemaining": 3,
  "availableActions": [
    {
      "action": "retest_same_sample",
      "enabled": true,
      "label": "Re-test (Same Sample)",
      "description": "Run the test again using the existing sample"
    },
    {
      "action": "recollect_new_sample",
      "enabled": true,
      "label": "Request New Sample",
      "description": "Reject the current sample and request a new collection"
    }
  ]
}
```

#### `POST /samples/{sampleId}/reject-and-recollect`

**Request:**
```json
{
  "rejectionReasons": ["hemolyzed", "qns"],
  "rejectionNotes": "Sample was visibly hemolyzed and insufficient volume",
  "recollectionReason": "Quality issues requiring new collection"
}
```

**Response:**
```json
{
  "rejectedSample": { /* Sample object with status: rejected */ },
  "newSample": { /* New Sample object with status: pending */ },
  "recollectionAttempt": 2,
  "message": "Sample rejected and recollection requested successfully"
}
```

### 6.2 Enhanced Endpoints

#### `POST /results/{orderId}/tests/{testCode}/reject`

**Request (Updated):**
```json
{
  "action": "retest_same_sample",  // or "recollect_new_sample"
  "reason": "Inconclusive results, needs repeat testing"
}
```

**Response (Updated):**
```json
{
  "success": true,
  "action": "retest_same_sample",
  "originalTest": { /* OrderTest marked as SUPERSEDED */ },
  "newTest": { /* New OrderTest with status: SAMPLE_COLLECTED */ },
  "message": "Retest created successfully. Test is ready for new result entry."
}
```

---

## 7. Database Schema Changes

### 7.1 New Table: `lab_operation_logs`

```sql
CREATE TABLE lab_operation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation_type VARCHAR(50) NOT NULL,  -- LabOperationType enum
    entity_type VARCHAR(20) NOT NULL,     -- 'sample', 'test', 'order'
    entity_id VARCHAR(50) NOT NULL,
    performed_by VARCHAR(50) NOT NULL,
    performed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    before_state JSONB,
    after_state JSONB,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lab_op_logs_entity ON lab_operation_logs(entity_type, entity_id);
CREATE INDEX idx_lab_op_logs_performed_by ON lab_operation_logs(performed_by);
CREATE INDEX idx_lab_op_logs_performed_at ON lab_operation_logs(performed_at);
```

### 7.2 Updated Columns (Minor)

**OrderTest Table:**
```sql
-- Add column for rejection action type (already has rejectionType, just ensure consistency)
ALTER TABLE order_tests
ADD COLUMN IF NOT EXISTS rejection_action VARCHAR(30);  -- 'retest_same_sample', 'recollect_new_sample'
```

---

## 8. Frontend Component Changes

### 8.1 Component Hierarchy (After Refactoring)

```
features/lab/
├── context/
│   └── LabWorkflowContext.tsx      # NEW: Central workflow state
│
├── shared/
│   ├── RejectionDialog.tsx         # NEW: Unified rejection modal
│   ├── ActionSelector.tsx          # NEW: Rejection action picker
│   ├── AttemptsRemaining.tsx       # NEW: Counter display
│   ├── EscalationWarning.tsx       # NEW: Limit exceeded warning
│   ├── RejectionHistory.tsx        # RENAMED from ResultRejectionSection
│   ├── hooks/
│   │   ├── useRejectionManager.ts  # NEW: Rejection logic hook
│   │   └── useLabWorkflow.ts       # NEW: Workflow operations hook
│   └── ... (existing shared components)
│
├── result-entry/
│   ├── ResultEntryView.tsx         # UPDATED: Use LabWorkflowContext
│   ├── ResultCard.tsx              # UPDATED: Use shared RejectionHistory
│   └── ... (existing components)
│
├── result-validation/
│   ├── ResultValidationView.tsx    # UPDATED: Use LabWorkflowContext
│   ├── ValidationCard.tsx          # UPDATED: Use RejectionDialog
│   ├── ResultRejectionPopover.tsx  # DEPRECATED: Replaced by RejectionDialog
│   └── ... (existing components)
│
└── sample-collection/
    └── ... (updated to use shared components)
```

### 8.2 Migration Path for Existing Components

| Existing Component | Change |
|--------------------|--------|
| `ResultRejectionPopover.tsx` | Deprecated, replaced by `RejectionDialog` |
| `ResultRejectionSection.tsx` | Renamed to `RejectionHistory`, moved to shared |
| `ValidationCard.tsx` | Updated to use `RejectionDialog` |
| `ResultCard.tsx` | Updated to use `RejectionHistory` |
| `ResultEntryView.tsx` | Updated to use `LabWorkflowContext` |
| `ResultValidationView.tsx` | Updated to use `LabWorkflowContext` |

---

## 9. Testing Strategy

### 9.1 Unit Tests

**Backend:**
- State machine transitions (valid and invalid)
- Rejection action availability logic
- Attempt limit calculations
- Audit log creation

**Frontend:**
- `useRejectionManager` hook
- `RejectionDialog` component states
- Action availability display logic

### 9.2 Integration Tests

**Backend:**
- Complete rejection flow (retest path)
- Complete rejection flow (recollection path)
- Limit exceeded scenarios
- Concurrent rejection handling
- Audit trail completeness

**Frontend:**
- Rejection dialog flow
- Error handling and retry
- State updates after rejection
- Navigation after operations

### 9.3 End-to-End Tests

```
Scenario: Result Rejection with Retest
  Given a test with status "completed"
  When I click "Reject"
  And I select "Re-test (Same Sample)"
  And I enter a reason
  And I click "Confirm Rejection"
  Then the original test should be marked "superseded"
  And a new test should be created with status "sample-collected"
  And the rejection should appear in the audit trail
  And I should be redirected to the result entry view

Scenario: Result Rejection with Recollection
  Given a test with status "completed"
  When I click "Reject"
  And I select "Request New Sample"
  And I enter a reason
  And I click "Confirm Rejection"
  Then the original sample should be marked "rejected"
  And a new sample should be created with status "pending"
  And the test should be linked to the new sample
  And the priority should be "urgent"
  And I should see a success message

Scenario: Rejection Limit Exceeded
  Given a test that has been retested 3 times
  When I click "Reject"
  Then the "Re-test (Same Sample)" option should be disabled
  And I should see "Maximum retest attempts reached"
  And I should see an escalation warning
```

---

## Appendix A: Complete Operation Flow Diagrams

### A.1 Sample Collection to Validation (Happy Path)

```
┌──────────────────┐
│  Order Created   │
│  (Receptionist)  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Samples Generated│
│  Status: PENDING │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐     ┌─────────────────────────────────────┐
│ Sample Collected │     │ COLLECT SAMPLE API                  │
│  by Lab Tech     │◄────│ PATCH /samples/{id}/collect         │
│  Status: COLLECT │     │ Updates: status, volume, container  │
└────────┬─────────┘     └─────────────────────────────────────┘
         │
         ▼
┌──────────────────┐     ┌─────────────────────────────────────┐
│ Results Entered  │     │ ENTER RESULTS API                   │
│  by Lab Tech     │◄────│ POST /results/{orderId}/tests/{tc}  │
│ Status: COMPLETED│     │ Updates: results, status, enteredBy │
└────────┬─────────┘     └─────────────────────────────────────┘
         │
         ▼
┌──────────────────┐     ┌─────────────────────────────────────┐
│ Results Validated│     │ VALIDATE RESULTS API                │
│  by Supervisor   │◄────│ POST /.../validate                  │
│ Status: VALIDATED│     │ Updates: status, validatedBy        │
└────────┬─────────┘     └─────────────────────────────────────┘
         │
         ▼
┌──────────────────┐
│     COMPLETE     │
│ Order: VALIDATED │
└──────────────────┘
```

### A.2 Result Rejection (Retest Path)

```
┌──────────────────┐
│ Results COMPLETED│
│   Awaiting       │
│   Validation     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Supervisor       │
│ Rejects with     │
│ "Re-test"        │
└────────┬─────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ REJECT RESULTS API                                          │
│ POST /results/{orderId}/tests/{testCode}/reject             │
│ Body: { action: "retest_same_sample", reason: "..." }       │
│                                                             │
│ Actions:                                                    │
│ 1. Original OrderTest.status → SUPERSEDED                   │
│ 2. Original OrderTest.retestOrderTestId → new test ID       │
│ 3. Create NEW OrderTest with:                               │
│    - id: {orderId}_{testCode}_RT{n}                         │
│    - status: SAMPLE_COLLECTED (ready for new results)       │
│    - sampleId: SAME as original                             │
│    - isRetest: true                                         │
│    - retestOfTestId: original test ID                       │
│    - retestNumber: n (1, 2, or 3)                           │
│    - resultRejectionHistory: copied from original + new     │
│ 4. Log audit trail                                          │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────┐
│ New Test Ready   │
│ for Result Entry │
│ Status: SAMPLE_  │
│       COLLECTED  │
└────────┬─────────┘
         │
         ▼ (Lab Tech enters new results)
┌──────────────────┐
│ Results Entered  │
│ Status: COMPLETED│
└────────┬─────────┘
         │
         ▼ (Supervisor validates)
┌──────────────────┐
│ Results Approved │
│ Status: VALIDATED│
└──────────────────┘
```

### A.3 Result Rejection (Recollection Path)

```
┌──────────────────┐
│ Results COMPLETED│
│   Awaiting       │
│   Validation     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Supervisor       │
│ Rejects with     │
│ "New Sample"     │
└────────┬─────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ REJECT RESULTS API                                          │
│ POST /results/{orderId}/tests/{testCode}/reject             │
│ Body: { action: "recollect_new_sample", reason: "..." }     │
│                                                             │
│ Actions:                                                    │
│ 1. Sample.status → REJECTED                                 │
│ 2. Sample.rejectionHistory → append rejection record        │
│ 3. Create NEW Sample with:                                  │
│    - status: PENDING                                        │
│    - isRecollection: true                                   │
│    - originalSampleId: rejected sample ID                   │
│    - priority: URGENT                                       │
│    - recollectionAttempt: n (2, 3, or 4)                    │
│    - recollectionReason: from rejection                     │
│ 4. Original Sample.recollectionSampleId → new sample ID     │
│ 5. OrderTest.sampleId → new sample ID                       │
│ 6. OrderTest.status → PENDING                               │
│ 7. Clear results, resultEnteredAt, enteredBy                │
│ 8. OrderTest.resultRejectionHistory → append record         │
│ 9. Log audit trail                                          │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────┐
│ New Sample PEND- │
│ ING collection   │
│ (Priority: URGENT│
└────────┬─────────┘
         │
         ▼ (Patient returns, new sample collected)
┌──────────────────┐
│ Sample Collected │
│ Status: COLLECTED│
└────────┬─────────┘
         │
         ▼ (Continue normal workflow)
        ...
```

---

## Appendix B: Error Handling Matrix

| Scenario | Backend Response | Frontend Display |
|----------|------------------|------------------|
| Retest limit (3) exceeded | `400 Bad Request: Maximum retest attempts reached` | Disable "Re-test" option, show warning |
| Recollection limit (3) exceeded | `400 Bad Request: Maximum recollection attempts reached` | Disable "New Sample" option, show escalation message |
| Both limits exceeded | `400 Bad Request: All rejection options exhausted. Please escalate.` | Show only escalation guidance |
| Invalid status transition | `400 Bad Request: Cannot reject test with status {status}` | Show error toast, refresh view |
| Concurrent modification | `409 Conflict: Test has been modified` | Show error, prompt refresh |
| Network error | Connection error | Show retry option, preserve form state |
| Permission denied | `403 Forbidden` | Show access denied message |

---

## Appendix C: Audit Log Examples

### Sample Rejection Log
```json
{
  "id": "log-001",
  "operationType": "SAMPLE_REJECT",
  "entityType": "sample",
  "entityId": "SAM-20240115-001",
  "performedBy": "USER-001",
  "performedAt": "2024-01-15T10:30:00Z",
  "beforeState": {
    "status": "collected",
    "rejectionHistory": []
  },
  "afterState": {
    "status": "rejected",
    "rejectionHistory": [
      {
        "rejectedAt": "2024-01-15T10:30:00Z",
        "rejectedBy": "USER-001",
        "rejectionReasons": ["hemolyzed"],
        "recollectionRequired": true
      }
    ]
  },
  "metadata": {
    "source": "result_validation",
    "triggeringTestCode": "HEM001",
    "recollectionSampleId": "SAM-20240115-002"
  }
}
```

### Result Rejection Log (Retest)
```json
{
  "id": "log-002",
  "operationType": "RESULT_VALIDATION_REJECT_RETEST",
  "entityType": "test",
  "entityId": "ORD-20240115-001_HEM001",
  "performedBy": "USER-002",
  "performedAt": "2024-01-15T11:00:00Z",
  "beforeState": {
    "status": "completed",
    "retestNumber": 0
  },
  "afterState": {
    "status": "superseded",
    "retestOrderTestId": "ORD-20240115-001_HEM001_RT1"
  },
  "metadata": {
    "rejectionReason": "Inconclusive results",
    "newTestId": "ORD-20240115-001_HEM001_RT1",
    "sampleReused": true
  }
}
```

---

## Summary

This refactoring plan addresses the key issues in the current laboratory operations implementation:

1. **Unified Operations Service** - Single source of truth for all lab operations
2. **State Machine Validation** - Strict status transition enforcement
3. **Comprehensive Audit Trail** - Full traceability for compliance
4. **Consistent Rejection Handling** - Unified UI and logic for all rejection scenarios
5. **Clear Action Types** - Explicit naming for re-test vs re-collect paths
6. **Limit Management** - Proper handling of attempt limits with escalation guidance

The implementation is phased to minimize disruption while delivering incremental value. Backend changes are completed first to establish a stable API, followed by frontend refactoring to leverage the new capabilities.
