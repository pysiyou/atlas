# Atlas Frontend - Code Enhancement & Organization Recommendations

> **Author**: Senior Design System Architect
> **Date**: February 2026
> **Codebase Stats**: 456 files, ~51,437 LOC, 5.3MB

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Critical Issues](#critical-issues)
3. [High Priority Improvements](#high-priority-improvements)
4. [Medium Priority Improvements](#medium-priority-improvements)
5. [Low Priority Improvements](#low-priority-improvements)
6. [Detailed Refactoring Guide](#detailed-refactoring-guide)
7. [Recommended Actions Timeline](#recommended-actions-timeline)

---

## Executive Summary

### What's Working Well ✅

| Area | Status | Notes |
|------|--------|-------|
| **Project Structure** | Excellent | Feature-based organization, clear separation |
| **TypeScript** | Excellent | Strict mode, no `any` types, proper typing |
| **State Management** | Good | Zustand + TanStack Query + Context |
| **API Layer** | Good | JWT auth, error handling, caching |
| **Code Style** | Good | ESLint + Prettier configured |
| **Component Design** | Good | Proper separation of concerns |
| **Theme System** | Excellent | Just refactored with semantic tokens |

### What Needs Attention ⚠️

| Area | Severity | Issue |
|------|----------|-------|
| **Testing** | 🔴 Critical | 0 test files for 51K LOC |
| **Code Duplication** | 🔴 Critical | Date logic repeated in 5 files |
| **Documentation** | 🟡 High | No README, no architecture docs |
| **Large Components** | 🟡 High | 5 files exceed 400 lines |
| **Memoization** | 🟠 Medium | Missing React.memo in lists |

---

## Critical Issues

### 1. No Test Coverage 🔴

**Impact**: High risk for regressions, difficult to refactor safely

**Current State**:
- 0 unit tests
- 0 integration tests
- 0 E2E tests
- Test infrastructure exists but unused (`vitest.config.ts`, test factories)

**Recommended Action**:
```
Priority: IMMEDIATE
Effort: 2-3 days for foundation
```

Start with:
1. **Utility functions** - `src/utils/formatters.ts`, `src/utils/validators.ts`
2. **Custom hooks** - `useOrderForm`, `usePatients`
3. **Critical flows** - Login, order creation

**Files to test first**:
```
src/utils/formatters.ts
src/utils/validators.ts
src/hooks/queries/usePatients.ts
src/features/order/hooks/useOrderForm.ts
src/services/api/client.ts
```

---

### 2. Duplicate Date Range Logic 🔴

**Impact**: Maintenance nightmare, bugs must be fixed in 5 places

**Current State**: `getDateRangeFromPreset()` is duplicated in:

| File | Lines | Exact Duplicate |
|------|-------|-----------------|
| `features/order/components/DateFilter.tsx` | ~40 | Yes |
| `features/order/components/OrderFilters.tsx` | ~40 | Yes |
| `features/filters/FilterModal.tsx` | ~40 | Yes |
| `features/payment/components/PaymentFilters.tsx` | ~40 | Yes |
| `features/lab/reports/components/ReportFilters.tsx` | ~40 | Yes |

**Recommended Action**:

Create `src/utils/dateHelpers.ts`:
```typescript
import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export type DatePreset = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
}

export function getDateRangeFromPreset(preset: DatePreset): DateRange | null {
  const now = new Date();

  switch (preset) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'yesterday':
      const yesterday = subDays(now, 1);
      return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
    case 'last7days':
      return { start: startOfDay(subDays(now, 6)), end: endOfDay(now) };
    case 'last30days':
      return { start: startOfDay(subDays(now, 29)), end: endOfDay(now) };
    case 'thisMonth':
      return { start: startOfMonth(now), end: endOfDay(now) };
    case 'lastMonth':
      const lastMonth = subMonths(now, 1);
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
    default:
      return null;
  }
}
```

Then update all 5 files to import from this single source.

---

## High Priority Improvements

### 3. Large Components Need Splitting

**Files exceeding recommended 300-line limit**:

| File | Lines | Recommendation |
|------|-------|----------------|
| `PatientForm.tsx` | 639 | Split into 5 section components |
| `FilterModal.tsx` | 509 | Extract ModalSearchInput, FilterSection |
| `PaymentFilters.tsx` | 471 | Share filter patterns |
| `OrderFilters.tsx` | 462 | Share filter patterns |
| `OrderUpsertModal.tsx` | 443 | Extract 3 sub-components |

**PatientForm.tsx Refactor Plan**:

Current structure (monolithic):
```
PatientForm.tsx (639 lines)
└── All form sections inline
```

Recommended structure:
```
features/patient/components/
├── PatientForm.tsx (150 lines - orchestration)
└── form-sections/
    ├── DemographicsSection.tsx
    ├── AddressSection.tsx
    ├── AffiliationSection.tsx
    ├── EmergencyContactSection.tsx
    └── MedicalHistorySection.tsx
```

---

### 4. Missing Project Documentation

**Create `README.md`** in project root:

```markdown
# Atlas Frontend

Laboratory Information Management System (LIMS) frontend built with React 19.

## Quick Start

\`\`\`bash
npm install
npm run dev
\`\`\`

## Tech Stack

- React 19 + TypeScript 5.9
- Vite for bundling
- TanStack Query for data fetching
- Zustand for state management
- Tailwind CSS v4 for styling

## Project Structure

\`\`\`
src/
├── features/     # Domain modules (order, patient, lab, etc.)
├── shared/       # Reusable components and utilities
├── hooks/        # Custom hooks and query hooks
├── services/     # API client
├── types/        # TypeScript definitions
└── utils/        # Helper functions
\`\`\`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests (coming soon)
```

---

### 5. Inconsistent Import Patterns

**Problem**: 175 relative imports using `../` when aliases are configured

**Examples to fix**:
```typescript
// ❌ Bad
import { Button } from '../../../shared/ui';
import { formatDate } from '../../utils/formatters';

// ✅ Good
import { Button } from '@/shared/ui';
import { formatDate } from '@/utils/formatters';
```

**Fix approach**: Run search and replace for common patterns:
- `'../../../shared/` → `'@/shared/`
- `'../../utils/` → `'@/utils/`
- `'../../hooks/` → `'@/hooks/`

---

## Medium Priority Improvements

### 6. Add Memoization for Performance

**Components that should use `React.memo()`**:

```typescript
// Table row component
export const TableRow = React.memo(({ data, columns, onClick }: TableRowProps) => {
  // ...
});

// Filter option item
export const FilterOption = React.memo(({ option, selected, onChange }: FilterOptionProps) => {
  // ...
});

// List item components
export const PatientCard = React.memo(({ patient, onClick }: PatientCardProps) => {
  // ...
});
```

**Where to add `useMemo`/`useCallback`**:
- Filter option arrays that don't change
- Event handlers passed to child components
- Expensive computations in render

---

### 7. Consolidate State Management

**Current inconsistency**:
- Auth: Zustand ✅
- Filters: Zustand ✅
- Modals: Context API ⚠️ (TODO in AppProviders.tsx)

**Recommendation**: Migrate `ModalContext` to Zustand store:

```typescript
// src/shared/stores/modal.store.ts
interface ModalState {
  modals: Map<string, ModalConfig>;
  openModal: (id: string, config: ModalConfig) => void;
  closeModal: (id: string) => void;
  updateModal: (id: string, updates: Partial<ModalConfig>) => void;
}

export const useModalStore = create<ModalState>((set) => ({
  modals: new Map(),
  openModal: (id, config) => set((state) => {
    const newModals = new Map(state.modals);
    newModals.set(id, config);
    return { modals: newModals };
  }),
  // ...
}));
```

---

### 8. Improve Error Handling Types

**Current** (`services/api/client.ts`):
```typescript
export interface APIError {
  message: string;
  status?: number;
}
```

**Recommended**:
```typescript
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'AUTH_ERROR'
  | 'NOT_FOUND'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'UNKNOWN';

export interface APIError {
  message: string;
  status?: number;
  code: ErrorCode;
  field?: string;           // For validation errors
  details?: unknown;        // Additional context
  timestamp?: string;
}

export function categorizeError(status: number): ErrorCode {
  if (status === 401 || status === 403) return 'AUTH_ERROR';
  if (status === 404) return 'NOT_FOUND';
  if (status === 422) return 'VALIDATION_ERROR';
  if (status >= 500) return 'SERVER_ERROR';
  return 'UNKNOWN';
}
```

---

### 9. Extract Magic Numbers to Constants

**Create `src/config/constants.ts`**:

```typescript
// Time constants
export const MS_PER_SECOND = 1000;
export const MS_PER_MINUTE = 60 * MS_PER_SECOND;
export const MS_PER_HOUR = 60 * MS_PER_MINUTE;
export const MS_PER_DAY = 24 * MS_PER_HOUR;

// Auth
export const AUTH_REHYDRATE_TIMEOUT_MS = 300;
export const TOKEN_REFRESH_THRESHOLD_MS = 5 * MS_PER_MINUTE;

// Cache
export const STALE_TIME_STATIC = 30 * MS_PER_MINUTE;
export const STALE_TIME_SEMI_STATIC = 5 * MS_PER_MINUTE;
export const STALE_TIME_DYNAMIC = MS_PER_MINUTE;

// UI
export const DEBOUNCE_DELAY_MS = 300;
export const TOAST_DURATION_MS = 5000;
export const MODAL_ANIMATION_MS = 200;
```

---

## Low Priority Improvements

### 10. Consolidate Input Styles

**Current**: `inputStyles.ts` is 320 lines of style string exports

**Recommendation**: Convert to Tailwind `@apply` classes or CSS modules:

```css
/* src/shared/ui/forms/input.css */
.input-base {
  @apply w-full rounded border border-stroke px-3 py-2 text-xs;
  @apply text-fg bg-panel placeholder:text-fg-faint;
  @apply transition-colors duration-200;
  @apply hover:border-stroke-hover;
  @apply focus:outline-none focus:ring-1 focus:ring-brand;
}

.input-error {
  @apply border-stroke-error focus:ring-danger;
}
```

---

### 11. Add Feature Flags System

**Replace commented-out code with feature flags**:

```typescript
// src/config/featureFlags.ts
export const FEATURES = {
  INVOICE_GENERATION: false,
  APPOINTMENT_BOOKING: false,
  MULTI_BRANCH: false,
  ADVANCED_ANALYTICS: false,
} as const;

// Usage
if (FEATURES.INVOICE_GENERATION) {
  // Invoice button
}
```

---

### 12. Create Architecture Documentation

**Create `docs/ARCHITECTURE.md`**:

```markdown
# Architecture Overview

## Data Flow

\`\`\`
User Action → Component → Hook → TanStack Query → API Client → Backend
                                      ↓
                              Cache + State Update
                                      ↓
                              Re-render Components
\`\`\`

## State Management Strategy

| State Type | Tool | Example |
|------------|------|---------|
| Server State | TanStack Query | Patients, Orders, Tests |
| Global UI State | Zustand | Auth, Filters, Theme |
| Local UI State | useState | Form inputs, modals |
| Form State | React Hook Form | Complex forms |

## Folder Conventions

- `components/` - React components
- `hooks/` - Custom hooks
- `types/` - TypeScript interfaces
- `utils/` - Pure utility functions
- `pages/` - Route-level components
```

---

## Detailed Refactoring Guide

### PatientForm.tsx (639 → ~150 lines)

**Step 1**: Create section directory
```bash
mkdir -p src/features/patient/components/form-sections
```

**Step 2**: Extract each section
```typescript
// form-sections/DemographicsSection.tsx
interface DemographicsSectionProps {
  control: Control<PatientFormData>;
  errors: FieldErrors<PatientFormData>;
}

export const DemographicsSection: React.FC<DemographicsSectionProps> = ({
  control,
  errors,
}) => (
  <div className="space-y-4">
    <Controller name="firstName" control={control} render={...} />
    <Controller name="lastName" control={control} render={...} />
    {/* etc */}
  </div>
);
```

**Step 3**: Update main form
```typescript
// PatientForm.tsx
import { DemographicsSection } from './form-sections/DemographicsSection';
import { AddressSection } from './form-sections/AddressSection';
// etc

export const PatientForm = () => {
  const form = useForm<PatientFormData>();

  return (
    <form>
      <DemographicsSection control={form.control} errors={form.errors} />
      <AddressSection control={form.control} errors={form.errors} />
      {/* etc */}
    </form>
  );
};
```

---

### Filter Components Consolidation

**Create shared filter infrastructure**:

```typescript
// src/features/filters/components/BaseFilterLayout.tsx
interface BaseFilterLayoutProps {
  title: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onClear: () => void;
  onApply: () => void;
  children: React.ReactNode;
}

export const BaseFilterLayout: React.FC<BaseFilterLayoutProps> = ({
  title,
  searchValue,
  onSearchChange,
  onClear,
  onApply,
  children,
}) => (
  <div className="flex flex-col h-full">
    <FilterHeader title={title} />
    <FilterSearch value={searchValue} onChange={onSearchChange} />
    <div className="flex-1 overflow-y-auto p-4">
      {children}
    </div>
    <FilterFooter onClear={onClear} onApply={onApply} />
  </div>
);
```

Then use in OrderFilters, PatientFilters, PaymentFilters:
```typescript
export const OrderFilters = () => (
  <BaseFilterLayout
    title="Filter Orders"
    searchValue={search}
    onSearchChange={setSearch}
    onClear={handleClear}
    onApply={handleApply}
  >
    <StatusFilter value={status} onChange={setStatus} />
    <DateFilter value={dateRange} onChange={setDateRange} />
    <PriorityFilter value={priority} onChange={setPriority} />
  </BaseFilterLayout>
);
```

---

## Recommended Actions Timeline

### Week 1: Critical Issues
- [ ] Create `src/utils/dateHelpers.ts` and consolidate date logic
- [ ] Write first 10 unit tests (formatters, validators)
- [ ] Create `README.md`

### Week 2: High Priority
- [ ] Refactor `PatientForm.tsx` into sections
- [ ] Refactor `OrderUpsertModal.tsx`
- [ ] Fix relative imports → aliases

### Week 3: Medium Priority
- [ ] Add `React.memo()` to list components
- [ ] Create `BaseFilterLayout` component
- [ ] Migrate `ModalContext` to Zustand
- [ ] Create `constants.ts` file

### Week 4: Polish
- [ ] Create `docs/ARCHITECTURE.md`
- [ ] Add feature flags system
- [ ] Consolidate input styles
- [ ] Continue adding test coverage

---

## Metrics to Track

After implementing these recommendations, measure:

| Metric | Current | Target |
|--------|---------|--------|
| Test Coverage | 0% | >70% |
| Max File Lines | 639 | <300 |
| Duplicate Code | ~200 LOC | 0 |
| Relative Imports | 175 | <20 |
| Documentation | None | README + ARCHITECTURE |

---

## Conclusion

The Atlas frontend has **solid foundations** with modern tooling and good architecture. The main gaps are:

1. **Testing** - Critical for confidence in refactoring
2. **Code Duplication** - Quick wins available
3. **Documentation** - Important for team scaling
4. **Component Size** - Maintainability concern

Addressing these issues will significantly improve maintainability, reduce bugs, and make the codebase more welcoming for new contributors.

---

*End of Recommendations*
