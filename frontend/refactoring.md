# Atlas Frontend Refactoring Plan

> A comprehensive guide to transform this codebase into production-grade, maintainable software.

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Architecture Principles](#architecture-principles)
3. [Phase 1: Component Decomposition](#phase-1-component-decomposition)
4. [Phase 2: State Management](#phase-2-state-management)
5. [Phase 3: Type Safety](#phase-3-type-safety)
6. [Phase 4: Performance](#phase-4-performance)
7. [Phase 5: Testing Strategy](#phase-5-testing-strategy)
8. [Phase 6: Code Quality](#phase-6-code-quality)
9. [Phase 7: Developer Experience](#phase-7-developer-experience)
10. [Implementation Checklist](#implementation-checklist)

---

## Current State Analysis

### Codebase Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Total Lines | ~38,700 | ~35,000 |
| Files > 250 lines | 37 (13%) | < 5% |
| Max File Size | 988 lines | < 300 lines |
| Test Coverage | ~0% | > 80% |
| TypeScript Strict | Partial | Full |

### Completed Refactoring

- [x] PatientDetail.tsx: 988 → 98 lines
- [x] OrderDetail.tsx: 931 → 100 lines
- [x] Created component extraction pattern for features
- [x] Merged duplicate context folders
- [x] Converted default exports to named exports
- [x] Added index.ts barrels for Lab workflows

### Remaining Large Files

| File | Lines | Priority | Action |
|------|-------|----------|--------|
| `EditPatientModal.tsx` | 546 | High | Extract form sections + useEditPatient hook |
| `PatientForm.tsx` | 505 | High | Split into section components |
| `PatientDetailSections.tsx` | 480 | Medium | Already modular, consider file split |
| `CollectionDetailModal.tsx` | 439 | Medium | Extract footer/header logic |
| `useOrders.ts` | 426 | High | Split query/mutation concerns |
| `DateFilter.tsx` | 421 | Medium | Extract calendar logic |
| `OrderProvider.tsx` | 389 | Medium | Reduce state complexity |
| `RejectionDialog.tsx` | 350 | Low | Well-structured, keep as-is |
| `usePatientForm.ts` | 327 | Medium | Extract validation to separate file |
| `PaymentDetailModal.tsx` | 327 | Medium | Extract sections |
| `StatusBadges.tsx` | 321 | Low | Collection file, acceptable |
| `EntryForm.tsx` | 311 | Medium | Extract parameter input logic |

---

## Architecture Principles

### 1. Flat & Lean Structure

```
src/
├── components/          # Shared UI components (renamed from shared/ui)
│   ├── Button/
│   ├── Modal/
│   ├── Table/
│   └── index.ts
├── features/            # Feature modules (max 3 levels deep)
│   ├── patient/
│   │   ├── components/  # Feature-specific components
│   │   ├── hooks/       # Feature-specific hooks
│   │   ├── utils/       # Feature-specific utilities
│   │   ├── types.ts     # Feature types
│   │   ├── constants.ts # Feature constants
│   │   └── index.ts     # Public API
│   ├── order/
│   ├── lab/
│   └── ...
├── hooks/               # Global hooks only
├── context/             # Global contexts only
├── services/            # API layer
├── types/               # Global types
├── utils/               # Global utilities
├── config/              # App configuration
└── pages/               # Route components (thin wrappers)
```

### 2. Component Design Rules

```typescript
// ✅ GOOD: Single responsibility, < 250 lines
export const PatientCard: React.FC<PatientCardProps> = ({ patient, onEdit }) => {
  const { formatDate } = useFormatters();

  return (
    <Card>
      <PatientCardHeader patient={patient} />
      <PatientCardBody patient={patient} />
      <PatientCardActions onEdit={onEdit} />
    </Card>
  );
};

// ❌ BAD: Multiple responsibilities, complex logic inline
export const PatientCard: React.FC<Props> = ({ patient, onEdit, onDelete, ... }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({...});
  // 200+ lines of mixed logic and JSX
};
```

### 3. Hook Extraction Pattern

```typescript
// Before: Logic mixed in component
const PatientDetail = () => {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPatient(id).then(setPatient).catch(setError).finally(() => setLoading(false));
  }, [id]);

  // ... more logic
};

// After: Logic extracted to hook
const usePatientDetail = (id: string) => {
  const { data: patient, isLoading, error } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => patientService.getById(id),
  });

  return { patient, isLoading, error };
};

const PatientDetail = () => {
  const { patient, isLoading, error } = usePatientDetail(id);

  if (isLoading) return <PatientDetailSkeleton />;
  if (error) return <ErrorState error={error} />;

  return <PatientDetailView patient={patient} />;
};
```

### 4. Named Exports Only

```typescript
// ✅ GOOD: Named exports
export { PatientCard };
export type { PatientCardProps };

// ❌ BAD: Default exports
export default PatientCard;
```

### 5. Colocation Principle

```
features/patient/
├── PatientCard.tsx           # Component
├── PatientCard.test.tsx      # Tests colocated
├── PatientCard.stories.tsx   # Storybook colocated
├── usePatientCard.ts         # Hook used only by PatientCard
└── patientCardUtils.ts       # Utils used only by PatientCard
```

---

## Phase 1: Component Decomposition

### 1.1 EditPatientModal Refactor

**Current:** 546 lines with form logic, payload building, and UI

**Target Structure:**
```
features/patient/
├── components/
│   ├── EditPatientModal.tsx        # ~80 lines (orchestrator)
│   ├── PatientFormSections/
│   │   ├── PersonalInfoSection.tsx
│   │   ├── ContactSection.tsx
│   │   ├── AddressSection.tsx
│   │   ├── EmergencyContactSection.tsx
│   │   ├── MedicalHistorySection.tsx
│   │   ├── VitalsSection.tsx
│   │   ├── AffiliationSection.tsx
│   │   └── index.ts
│   └── PatientFormProgress.tsx
├── hooks/
│   ├── usePatientForm.ts           # Form state
│   ├── usePatientValidation.ts     # Validation logic
│   └── usePatientMutation.ts       # API mutations
└── utils/
    ├── patientPayloadBuilder.ts    # Payload construction
    └── patientValidationRules.ts   # Validation rules
```

### 1.2 PatientForm Refactor

**Current:** 505 lines

**Extract:**
- Each form section → separate component
- Tab logic → `useFormTabs` hook
- Validation → `usePatientValidation` hook

### 1.3 DateFilter Refactor

**Current:** 421 lines with complex calendar logic

**Target Structure:**
```
features/order/
├── components/
│   ├── DateFilter.tsx              # ~100 lines (UI shell)
│   ├── DateFilterCalendar.tsx      # Calendar rendering
│   ├── DateFilterPresets.tsx       # Quick date presets
│   └── DateFilterRange.tsx         # Range selection UI
├── hooks/
│   └── useDateFilter.ts            # Date logic, parsing, formatting
└── utils/
    └── dateFilterPresets.ts        # Preset configurations
```

### 1.4 useOrders Hook Split

**Current:** 426 lines mixing queries and mutations

**Target Structure:**
```
hooks/queries/
├── orders/
│   ├── useOrders.ts           # List query
│   ├── useOrder.ts            # Single order query
│   ├── useOrderMutations.ts   # Create, update, delete
│   ├── useOrderFilters.ts     # Filter state
│   └── index.ts
```

---

## Phase 2: State Management

### 2.1 Context Audit

**Current Issues:**
- Some contexts hold too much state
- Prop drilling in 3+ levels in some areas
- No clear separation between server state and UI state

**Rules:**
1. Server state → React Query (TanStack Query)
2. Global UI state → React Context (minimal)
3. Local UI state → useState/useReducer
4. Form state → React Hook Form or custom hooks

### 2.2 Context Refactor Plan

```typescript
// Before: Fat context
const OrderContext = createContext({
  orders: [],
  filters: {},
  selectedOrder: null,
  isLoading: false,
  error: null,
  fetchOrders: () => {},
  createOrder: () => {},
  updateOrder: () => {},
  // ... 20+ more properties
});

// After: Lean context + hooks
const OrderUIContext = createContext({
  selectedOrderId: null,
  setSelectedOrderId: () => {},
});

// Server state via React Query
const useOrders = (filters) => useQuery({ queryKey: ['orders', filters], ... });
const useOrder = (id) => useQuery({ queryKey: ['order', id], ... });
const useCreateOrder = () => useMutation({ ... });
```

### 2.3 Remove Prop Drilling

**Identify patterns where props pass through 3+ levels:**

```typescript
// Before: Prop drilling
<GrandParent onAction={handleAction}>
  <Parent onAction={onAction}>
    <Child onAction={onAction}>
      <GrandChild onAction={onAction} />  // Finally used here
    </Child>
  </Parent>
</GrandParent>

// After: Component composition or context
<ActionProvider onAction={handleAction}>
  <GrandParent>
    <Parent>
      <Child>
        <GrandChild />  // Uses useAction() hook
      </Child>
    </Parent>
  </GrandParent>
</ActionProvider>
```

---

## Phase 3: Type Safety

### 3.1 Enable Strict TypeScript

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true
  }
}
```

### 3.2 Type Organization

```
types/
├── entities/           # Domain entities
│   ├── patient.ts
│   ├── order.ts
│   ├── test.ts
│   └── index.ts
├── api/                # API request/response types
│   ├── requests.ts
│   ├── responses.ts
│   └── index.ts
├── ui/                 # UI-specific types
│   ├── forms.ts
│   ├── tables.ts
│   └── index.ts
└── index.ts            # Re-exports
```

### 3.3 Branded Types for IDs

```typescript
// types/branded.ts
declare const brand: unique symbol;

type Brand<T, B> = T & { [brand]: B };

export type PatientId = Brand<string, 'PatientId'>;
export type OrderId = Brand<string, 'OrderId'>;
export type TestId = Brand<string, 'TestId'>;

// Usage prevents mixing up IDs
function getPatient(id: PatientId): Patient { ... }
function getOrder(id: OrderId): Order { ... }

// This would be a type error:
getPatient(orderId); // ❌ Type 'OrderId' is not assignable to 'PatientId'
```

### 3.4 Discriminated Unions for States

```typescript
// Instead of multiple boolean flags
type LoadingState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

// Usage
function renderContent(state: LoadingState<Patient>) {
  switch (state.status) {
    case 'idle':
      return null;
    case 'loading':
      return <Skeleton />;
    case 'success':
      return <PatientCard patient={state.data} />;
    case 'error':
      return <ErrorState error={state.error} />;
  }
}
```

---

## Phase 4: Performance

### 4.1 Code Splitting Strategy

```typescript
// Lazy load features
const PatientModule = lazy(() => import('@/features/patient'));
const OrderModule = lazy(() => import('@/features/order'));
const LabModule = lazy(() => import('@/features/lab'));

// Route-based splitting
const routes = [
  { path: '/patients/*', element: <Suspense fallback={<PageSkeleton />}><PatientModule /></Suspense> },
  { path: '/orders/*', element: <Suspense fallback={<PageSkeleton />}><OrderModule /></Suspense> },
  { path: '/lab/*', element: <Suspense fallback={<PageSkeleton />}><LabModule /></Suspense> },
];
```

### 4.2 Memoization Guidelines

```typescript
// ✅ GOOD: Expensive computations
const filteredPatients = useMemo(
  () => patients.filter(p => matchesSearch(p, searchTerm)),
  [patients, searchTerm]
);

// ✅ GOOD: Stable callback references for child components
const handleSelect = useCallback(
  (id: string) => setSelectedId(id),
  []
);

// ❌ BAD: Premature optimization
const name = useMemo(() => `${firstName} ${lastName}`, [firstName, lastName]);
```

### 4.3 Virtual Lists for Large Data

```typescript
// For lists > 100 items, use virtualization
import { useVirtualizer } from '@tanstack/react-virtual';

const VirtualPatientList: React.FC<{ patients: Patient[] }> = ({ patients }) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: patients.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
  });

  return (
    <div ref={parentRef} style={{ height: '100%', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <PatientRow
            key={patients[virtualRow.index].id}
            patient={patients[virtualRow.index]}
            style={{
              position: 'absolute',
              top: virtualRow.start,
              height: virtualRow.size,
            }}
          />
        ))}
      </div>
    </div>
  );
};
```

### 4.4 React Query Optimization

```typescript
// Prefetch on hover
const prefetchPatient = (id: string) => {
  queryClient.prefetchQuery({
    queryKey: ['patient', id],
    queryFn: () => patientService.getById(id),
    staleTime: 5 * 60 * 1000,
  });
};

// Optimistic updates
const updatePatient = useMutation({
  mutationFn: patientService.update,
  onMutate: async (newPatient) => {
    await queryClient.cancelQueries({ queryKey: ['patient', newPatient.id] });
    const previous = queryClient.getQueryData(['patient', newPatient.id]);
    queryClient.setQueryData(['patient', newPatient.id], newPatient);
    return { previous };
  },
  onError: (err, newPatient, context) => {
    queryClient.setQueryData(['patient', newPatient.id], context?.previous);
  },
  onSettled: (data, error, variables) => {
    queryClient.invalidateQueries({ queryKey: ['patient', variables.id] });
  },
});
```

---

## Phase 5: Testing Strategy

### 5.1 Test Pyramid

```
                 /\
                /  \        E2E Tests (5%)
               /----\       - Critical user journeys
              /      \      - Playwright
             /--------\
            /          \    Integration Tests (25%)
           /------------\   - Component + hook interactions
          /              \  - React Testing Library
         /----------------\
        /                  \ Unit Tests (70%)
       /--------------------\ - Pure functions, hooks, utils
                              - Vitest
```

### 5.2 Test File Structure

```
features/patient/
├── PatientCard.tsx
├── PatientCard.test.tsx        # Unit/integration tests
├── __tests__/
│   └── PatientCard.e2e.ts      # E2E tests (if needed)
└── __mocks__/
    └── patientData.ts          # Test fixtures
```

### 5.3 Testing Patterns

```typescript
// Component test with React Testing Library
import { render, screen, userEvent } from '@testing-library/react';
import { PatientCard } from './PatientCard';
import { createMockPatient } from '@/test/factories';

describe('PatientCard', () => {
  it('displays patient information', () => {
    const patient = createMockPatient({ name: 'John Doe' });
    render(<PatientCard patient={patient} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', async () => {
    const patient = createMockPatient();
    const onEdit = vi.fn();
    render(<PatientCard patient={patient} onEdit={onEdit} />);

    await userEvent.click(screen.getByRole('button', { name: /edit/i }));

    expect(onEdit).toHaveBeenCalledWith(patient.id);
  });
});

// Hook test
import { renderHook, waitFor } from '@testing-library/react';
import { usePatient } from './usePatient';
import { QueryClientProvider } from '@tanstack/react-query';

describe('usePatient', () => {
  it('fetches patient data', async () => {
    const { result } = renderHook(() => usePatient('123'), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe('123');
  });
});
```

### 5.4 Test Factories

```typescript
// test/factories/patient.ts
import { faker } from '@faker-js/faker';
import type { Patient } from '@/types';

export const createMockPatient = (overrides?: Partial<Patient>): Patient => ({
  id: faker.string.uuid(),
  fullName: faker.person.fullName(),
  dateOfBirth: faker.date.past({ years: 50 }).toISOString(),
  gender: faker.helpers.arrayElement(['male', 'female']),
  phone: faker.phone.number(),
  email: faker.internet.email(),
  address: {
    street: faker.location.streetAddress(),
    city: faker.location.city(),
    postalCode: faker.location.zipCode(),
  },
  ...overrides,
});
```

---

## Phase 6: Code Quality

### 6.1 ESLint Configuration

```javascript
// eslint.config.js
export default [
  {
    rules: {
      // Enforce named exports
      'import/no-default-export': 'error',

      // Enforce component file size
      'max-lines': ['error', { max: 300, skipComments: true, skipBlankLines: true }],

      // Enforce function size
      'max-lines-per-function': ['warn', { max: 50, skipComments: true }],

      // Prevent deeply nested code
      'max-depth': ['error', 3],

      // Enforce early returns
      'no-else-return': 'error',

      // Prevent magic numbers
      'no-magic-numbers': ['warn', { ignore: [0, 1, -1] }],

      // React specific
      'react/jsx-no-bind': ['warn', { allowArrowFunctions: true }],
      'react/no-array-index-key': 'warn',
      'react-hooks/exhaustive-deps': 'error',
    },
  },
];
```

### 6.2 Prettier Configuration

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

### 6.3 Pre-commit Hooks

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

### 6.4 Code Review Checklist

- [ ] File < 300 lines
- [ ] Component has single responsibility
- [ ] No prop drilling (max 2 levels)
- [ ] Complex logic extracted to hooks
- [ ] Pure functions in utils
- [ ] Named exports only
- [ ] Types are explicit (no `any`)
- [ ] Error states handled
- [ ] Loading states handled
- [ ] Accessible (ARIA labels, keyboard navigation)

---

## Phase 7: Developer Experience

### 7.1 Path Aliases

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/components": ["./src/components"],
      "@/features/*": ["./src/features/*"],
      "@/hooks": ["./src/hooks"],
      "@/types": ["./src/types"],
      "@/utils": ["./src/utils"],
      "@/test/*": ["./src/test/*"]
    }
  }
}
```

### 7.2 VS Code Settings

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },
  "typescript.preferences.importModuleSpecifier": "non-relative",
  "typescript.suggest.autoImports": true
}
```

### 7.3 Component Templates

Create snippets for consistent component creation:

```json
// .vscode/snippets/react.json
{
  "React Functional Component": {
    "prefix": "rfc",
    "body": [
      "import React from 'react';",
      "",
      "export interface ${1:Component}Props {",
      "  $2",
      "}",
      "",
      "export const ${1:Component}: React.FC<${1:Component}Props> = ({ $3 }) => {",
      "  return (",
      "    <div>",
      "      $0",
      "    </div>",
      "  );",
      "};"
    ]
  }
}
```

### 7.4 Documentation Standards

```typescript
/**
 * PatientCard displays a summary of patient information.
 *
 * @example
 * ```tsx
 * <PatientCard
 *   patient={patient}
 *   onEdit={(id) => navigate(`/patients/${id}/edit`)}
 * />
 * ```
 */
export interface PatientCardProps {
  /** The patient data to display */
  patient: Patient;
  /** Called when the edit button is clicked */
  onEdit?: (id: string) => void;
  /** Additional CSS classes */
  className?: string;
}
```

---

## Implementation Checklist

### Week 1-2: Foundation
- [ ] Enable strict TypeScript incrementally
- [ ] Set up ESLint rules
- [ ] Configure pre-commit hooks
- [ ] Set up test infrastructure (Vitest + RTL)
- [ ] Create test factories

### Week 3-4: Component Decomposition
- [ ] Refactor EditPatientModal (546 → ~80 lines)
- [ ] Refactor PatientForm (505 → ~100 lines)
- [ ] Refactor DateFilter (421 → ~100 lines)
- [ ] Split useOrders hook (426 → 3-4 focused hooks)

### Week 5-6: State Management
- [ ] Audit all contexts for size
- [ ] Migrate server state to React Query patterns
- [ ] Remove prop drilling (identify and fix 3+ level cases)
- [ ] Create UI-only contexts for remaining global state

### Week 7-8: Performance
- [ ] Implement route-based code splitting
- [ ] Add virtualization to large lists
- [ ] Optimize React Query caching
- [ ] Add prefetching for common navigation paths

### Week 9-10: Testing
- [ ] Write tests for all utility functions
- [ ] Write tests for all custom hooks
- [ ] Write integration tests for critical flows
- [ ] Set up E2E tests for user journeys

### Week 11-12: Polish
- [ ] Code review all changes
- [ ] Update documentation
- [ ] Performance audit
- [ ] Accessibility audit

---

## Metrics to Track

| Metric | Tool | Target |
|--------|------|--------|
| Bundle Size | `vite-bundle-analyzer` | < 500KB (gzipped) |
| Test Coverage | Vitest | > 80% |
| Lighthouse Score | Lighthouse | > 90 |
| TypeScript Errors | `tsc --noEmit` | 0 |
| ESLint Errors | ESLint | 0 |
| Files > 300 lines | Custom script | < 5 |

---

## Resources

- [React Patterns](https://reactpatterns.com/)
- [Kent C. Dodds Blog](https://kentcdodds.com/blog)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Testing Library Docs](https://testing-library.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)

---

*Last Updated: January 2026*
*Maintainer: Atlas Development Team*
