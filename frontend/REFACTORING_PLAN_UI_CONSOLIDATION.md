# UI Component Consolidation & Standardization Plan

> **Generated:** January 2026
> **Scope:** Patient, Order, Laboratory, Payment components
> **Goal:** Unified patterns, consistent standards, production-ready UI

---

## Executive Summary

This plan addresses UI inconsistencies across the Atlas frontend by establishing:
1. **Shared layout components** for list pages and detail pages
2. **Standardized styling constants** for colors, spacing, typography
3. **Unified filter bar component** replacing 4 different implementations
4. **Consistent card patterns** across all features
5. **Standardized modal/popover patterns**

### Issue Count by Category

| Category | Issues | Priority |
|----------|--------|----------|
| Layout Inconsistencies | 8 | HIGH |
| Styling Variations | 12 | MEDIUM |
| Component Duplication | 6 | HIGH |
| Missing Standards | 10 | MEDIUM |
| Props Interface Gaps | 5 | LOW |

---

## Table of Contents

1. [Shared Layout Components](#1-shared-layout-components)
2. [Styling Constants & Design Tokens](#2-styling-constants--design-tokens)
3. [Filter Bar Consolidation](#3-filter-bar-consolidation)
4. [Card Component Standardization](#4-card-component-standardization)
5. [Modal & Popover Standards](#5-modal--popover-standards)
6. [Table Column Standards](#6-table-column-standards)
7. [Form Input Standards](#7-form-input-standards)
8. [Error & Loading States](#8-error--loading-states)
9. [Badge & Status Standards](#9-badge--status-standards)
10. [Implementation Checklist](#10-implementation-checklist)

---

## 1. Shared Layout Components

### 1.1 Create ListPageLayout Component

**Problem:** Each list page (PatientList, OrderList, PaymentList) has similar but inconsistent layout code.

**Current Variations:**
```typescript
// PatientList.tsx
<div className="h-full flex flex-col p-4 space-y-6">
  <div className="flex items-center justify-between shrink-0">
    <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
    ...
  </div>
</div>

// OrderList.tsx
<div className="h-full flex flex-col p-4 space-y-6">
  <div className="flex items-center justify-between shrink-0">
    <h1 className="text-2xl font-bold text-gray-900">Test Orders</h1>
    ...
  </div>
</div>

// PaymentList.tsx (has subtitle)
<div className="h-full flex flex-col p-4 space-y-4">  // Different spacing!
  <div className="flex items-center justify-between shrink-0">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Payments & Billing</h1>
      <p className="text-sm text-gray-500 mt-1">View and manage...</p>
    </div>
    ...
  </div>
</div>
```

**Solution:** Create `src/shared/layout/ListPageLayout.tsx`:

```typescript
interface ListPageLayoutProps {
  title: string;
  subtitle?: string;
  headerActions?: ReactNode;
  statsCards?: ReactNode;
  errorAlert?: ReactNode;
  filters: ReactNode;
  children: ReactNode; // Table or grid content
}

export const ListPageLayout: React.FC<ListPageLayoutProps> = ({
  title,
  subtitle,
  headerActions,
  statsCards,
  errorAlert,
  filters,
  children,
}) => (
  <div className="h-full flex flex-col p-4 space-y-4">
    {/* Header */}
    <div className="flex items-center justify-between shrink-0">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {headerActions && <div className="flex items-center gap-3">{headerActions}</div>}
    </div>

    {/* Stats Cards (optional) */}
    {statsCards}

    {/* Error Alert (optional) */}
    {errorAlert}

    {/* Main Content */}
    <div className="flex-1 flex flex-col bg-white rounded border border-gray-200 overflow-hidden min-h-0">
      {filters}
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  </div>
);
```

**Files to Update:**
- `src/features/patient/PatientList.tsx`
- `src/features/order/OrderList.tsx`
- `src/features/payment/PaymentList.tsx`

---

### 1.2 Create DetailPageLayout Component

**Problem:** Detail pages have inconsistent header and section arrangements.

**Solution:** Create `src/shared/layout/DetailPageLayout.tsx`:

```typescript
interface DetailPageLayoutProps {
  header: ReactNode;
  headerActions?: ReactNode;
  children: ReactNode;
  sidebar?: ReactNode;
  sidebarPosition?: 'left' | 'right';
}

export const DetailPageLayout: React.FC<DetailPageLayoutProps> = ({
  header,
  headerActions,
  children,
  sidebar,
  sidebarPosition = 'right',
}) => (
  <div className="h-full flex flex-col p-6">
    {/* Header */}
    <div className="flex items-center justify-between mb-4 shrink-0">
      {header}
      {headerActions && <div className="flex items-center gap-3">{headerActions}</div>}
    </div>

    {/* Main Content Grid */}
    <div className="flex-1 grid gap-4 min-h-0" style={{
      gridTemplateColumns: sidebar
        ? sidebarPosition === 'right' ? '2fr 1fr' : '1fr 2fr'
        : '1fr'
    }}>
      <div className="flex flex-col gap-4 min-h-0 overflow-auto">
        {children}
      </div>
      {sidebar && (
        <div className="flex flex-col gap-4 min-h-0 overflow-auto">
          {sidebar}
        </div>
      )}
    </div>
  </div>
);
```

**Files to Update:**
- `src/features/patient/PatientDetail.tsx`
- `src/features/order/OrderDetail.tsx`

---

### 1.3 Standardize LabWorkflowView Usage

**Current:** Lab uses `LabWorkflowView` for grid-based card layouts.

**Action:** Keep `LabWorkflowView` for card grids, but ensure it follows same header pattern as `ListPageLayout`.

**Update** `src/features/lab/shared/LabWorkflowView.tsx`:

```typescript
// Align header structure with ListPageLayout
<div className="flex items-center justify-between shrink-0 mb-4">
  <div>
    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
  </div>
  <div className="flex items-center gap-3">
    {filters}
    <SearchBar ... />
  </div>
</div>
```

---

## 2. Styling Constants & Design Tokens

### 2.1 Create Design Tokens File

**Problem:** Colors, spacing, and typography are hardcoded throughout.

**Solution:** Create `src/shared/styles/tokens.ts`:

```typescript
// =====================
// COLOR TOKENS
// =====================
export const COLORS = {
  // Primary Actions
  primary: {
    50: 'sky-50',
    100: 'sky-100',
    500: 'sky-500',
    600: 'sky-600',
    700: 'sky-700',
  },
  // Status Colors
  success: {
    50: 'emerald-50',
    100: 'emerald-100',
    500: 'emerald-500',
    600: 'emerald-600',
  },
  danger: {
    50: 'red-50',
    100: 'red-100',
    500: 'red-500',
    600: 'red-600',
  },
  warning: {
    50: 'amber-50',
    100: 'amber-100',
    500: 'amber-500',
    600: 'amber-600',
  },
  // Neutral
  neutral: {
    50: 'gray-50',
    100: 'gray-100',
    200: 'gray-200',
    300: 'gray-300',
    400: 'gray-400',
    500: 'gray-500',
    600: 'gray-600',
    700: 'gray-700',
    800: 'gray-800',
    900: 'gray-900',
  },
} as const;

// =====================
// TYPOGRAPHY TOKENS
// =====================
export const TYPOGRAPHY = {
  // Page Titles
  pageTitle: 'text-2xl font-bold text-gray-900',
  pageSubtitle: 'text-sm text-gray-500',

  // Section Titles
  sectionTitle: 'text-lg font-semibold text-gray-900',
  sectionSubtitle: 'text-sm text-gray-600',

  // Card Titles
  cardTitle: 'text-sm font-medium text-gray-900',
  cardSubtitle: 'text-xs text-gray-500',

  // Labels & Values
  label: 'text-xs font-medium text-gray-500',
  value: 'text-sm font-medium text-gray-900',
  valueSmall: 'text-xs font-medium text-gray-900',

  // Meta/Helper Text
  meta: 'text-xs text-gray-500',
  helper: 'text-xs text-gray-400',

  // Table Text
  tableHeader: 'text-xs font-medium text-gray-500 uppercase tracking-wider',
  tableCell: 'text-xs text-gray-900',
  tableCellSecondary: 'text-xs text-gray-500',

  // Monospace (IDs, codes)
  mono: 'font-mono',
  id: 'text-xs font-medium font-mono text-sky-600',
} as const;

// =====================
// SPACING TOKENS
// =====================
export const SPACING = {
  // Page Layout
  pagePadding: 'p-4',
  pageGap: 'space-y-4',

  // Section Spacing
  sectionGap: 'gap-4',
  sectionPadding: 'p-4',

  // Card Spacing
  cardPadding: 'p-4',
  cardGap: 'gap-3',

  // Form Spacing
  formGap: 'space-y-4',
  fieldGap: 'gap-2',

  // List Spacing
  listGap: 'gap-2',
  listItemPadding: 'p-3',
} as const;

// =====================
// CONTAINER TOKENS
// =====================
export const CONTAINERS = {
  // Cards
  card: 'bg-white rounded border border-gray-200',
  cardHover: 'hover:border-gray-300 hover:shadow-sm transition-all',
  cardActive: 'border-sky-500 ring-2 ring-sky-500/20',

  // Sections
  section: 'bg-gray-50 rounded p-4 border border-gray-100',

  // Filter Bar
  filterBar: 'p-4 border-b border-gray-200 bg-gray-50/50 shrink-0',

  // Content Area
  contentArea: 'flex-1 flex flex-col bg-white rounded border border-gray-200 overflow-hidden min-h-0',

  // Modal
  modalBody: 'flex-1 overflow-y-auto p-6',
  modalFooter: 'border-t border-gray-200 bg-white px-6 py-4 shrink-0',
} as const;

// =====================
// INTERACTIVE TOKENS
// =====================
export const INTERACTIVE = {
  // Focus States
  focusRing: 'focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent',
  focusRingDanger: 'focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent',

  // Hover States
  hoverBg: 'hover:bg-gray-50',
  hoverBgPrimary: 'hover:bg-sky-50',
  hoverBgDanger: 'hover:bg-red-50',

  // Transitions
  transition: 'transition-all duration-200',
  transitionFast: 'transition-all duration-150',

  // Disabled
  disabled: 'opacity-50 cursor-not-allowed',
} as const;
```

---

### 2.2 Update Existing Style Constants

**Action:** Merge `src/features/lab/shared/labCardStyles.ts` into the new tokens file and update imports.

**Files to Update:**
- `src/features/lab/shared/labCardStyles.ts` → Refactor to use tokens
- `src/features/lab/shared/LabCard.tsx` → Import from tokens
- All lab components using LAB_CARD_* constants

---

## 3. Filter Bar Consolidation

### 3.1 Create Unified FilterBar Component

**Problem:** 4 different filter bar implementations with slight variations.

**Current Implementations:**
- `PatientFilters.tsx` - Search + AgeFilter + MultiSelect (Gender)
- `OrderFilters.tsx` - DateFilter + MultiSelect (Status) + MultiSelect (Payment) + Search
- `PaymentFilters.tsx` - MultiSelect (Status) + MultiSelect (Method) + Search
- Lab views - Search only (via LabWorkflowView)

**Solution:** Create `src/shared/components/FilterBar.tsx`:

```typescript
interface FilterBarProps {
  // Search
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  searchWidth?: string; // Default: 'w-full md:w-72'

  // Filters (left side)
  filters?: ReactNode;

  // Optional divider between filter groups
  showDividers?: boolean;

  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search...',
  searchWidth = 'w-full md:w-72',
  filters,
  showDividers = true,
  className,
}) => (
  <div className={cn(CONTAINERS.filterBar, className)}>
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Left: Filters */}
      {filters && (
        <div className="flex flex-wrap items-center gap-3">
          {filters}
        </div>
      )}

      {/* Right: Search */}
      {onSearchChange && (
        <div className={searchWidth}>
          <SearchBar
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            size="sm"
          />
        </div>
      )}
    </div>
  </div>
);

// Helper: Divider between filter groups
export const FilterDivider: React.FC = () => (
  <div className="h-6 w-px bg-gray-300 hidden md:block" />
);
```

**Usage Example:**
```typescript
<FilterBar
  searchQuery={searchQuery}
  onSearchChange={setSearchQuery}
  searchPlaceholder="Search by name, ID, or phone..."
  filters={
    <>
      <AgeFilter value={ageRange} onChange={setAgeRange} />
      <FilterDivider />
      <MultiSelectFilter
        label="Gender"
        options={genderOptions}
        selected={genderFilters}
        onChange={setGenderFilters}
      />
    </>
  }
/>
```

**Files to Update:**
- `src/features/patient/PatientFilters.tsx` → Use FilterBar
- `src/features/order/OrderFilters.tsx` → Use FilterBar
- `src/features/payment/PaymentFilters.tsx` → Use FilterBar

---

### 3.2 Standardize Search Placeholder Text

**Current Inconsistencies:**
| Component | Placeholder |
|-----------|------------|
| PatientFilters | "Search by name, ID, or phone..." |
| OrderFilters | "Search by order ID or patient..." |
| PaymentFilters | "Search payments..." |
| LabWorkflowView | "Search by order ID, patient name..." |

**Standard Format:** `"Search by {primary field}, {secondary field}..."`

**Updated Placeholders:**
| Component | New Placeholder |
|-----------|----------------|
| PatientFilters | "Search by name, ID, or phone..." ✓ (keep) |
| OrderFilters | "Search by order ID, patient, or test..." |
| PaymentFilters | "Search by order ID or patient..." |
| LabWorkflowView | "Search by order ID, patient, or sample..." |

---

## 4. Card Component Standardization

### 4.1 Create Unified EntityCard Component

**Problem:** Different card patterns for different entities.

**Current State:**
- **LabCard:** Comprehensive shared card with badges/actions/context/content/flags
- **OrderCard:** Simple wrapper for OrderHeader + OrderMetadata
- **Patient/Payment:** No card component (table rows only)

**Solution:** Extend LabCard pattern for all entities. Create `src/shared/components/EntityCard.tsx`:

```typescript
interface EntityCardProps {
  // Identity
  id: string;
  idLabel?: string; // "Order", "Patient", "Sample"

  // Header
  badges?: ReactNode;
  actions?: ReactNode;

  // Context (who/what)
  primaryText: string; // Patient name, Order ID
  secondaryText?: string; // Patient ID, Date
  tertiaryText?: string; // Phone, Referring physician
  avatar?: ReactNode;

  // Content
  content?: ReactNode;
  contentTitle?: string;

  // Alerts/Warnings
  alert?: ReactNode;

  // Interaction
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;

  className?: string;
}

export const EntityCard: React.FC<EntityCardProps> = ({
  id,
  idLabel,
  badges,
  actions,
  primaryText,
  secondaryText,
  tertiaryText,
  avatar,
  content,
  contentTitle,
  alert,
  onClick,
  selected,
  disabled,
  className,
}) => (
  <Card
    className={cn(
      CONTAINERS.card,
      onClick && !disabled && CONTAINERS.cardHover,
      selected && CONTAINERS.cardActive,
      disabled && INTERACTIVE.disabled,
      'cursor-pointer',
      className
    )}
    onClick={disabled ? undefined : onClick}
  >
    {/* Row 1: Badges + Actions */}
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">{badges}</div>
      {actions && (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {actions}
        </div>
      )}
    </div>

    {/* Row 2: Context */}
    <div className="flex items-center gap-3 mb-3">
      {avatar}
      <div className="min-w-0 flex-1">
        <div className={TYPOGRAPHY.cardTitle}>{primaryText}</div>
        {secondaryText && <div className={TYPOGRAPHY.meta}>{secondaryText}</div>}
        {tertiaryText && <div className={TYPOGRAPHY.helper}>{tertiaryText}</div>}
      </div>
    </div>

    {/* Alert Banner */}
    {alert}

    {/* Content Section */}
    {content && (
      <div className={CONTAINERS.section}>
        {contentTitle && (
          <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-2">
            {contentTitle}
          </div>
        )}
        {content}
      </div>
    )}
  </Card>
);
```

---

### 4.2 Refactor Existing Card Components

**LabCard:** Keep as-is (most comprehensive), but ensure it uses design tokens.

**OrderCard:** Refactor to use EntityCard:

```typescript
// Before (OrderCard.tsx)
export const OrderCard = ({ order, children, className }) => {
  const patientName = getPatientName(order.patientId);
  return (
    <Card className={className}>
      <div className="space-y-4">
        <OrderHeader ... />
        <OrderMetadata ... />
        {children}
      </div>
    </Card>
  );
};

// After
export const OrderCard = ({ order, children, className }) => {
  const patientName = getPatientName(order.patientId);
  return (
    <EntityCard
      id={order.orderId}
      idLabel="Order"
      badges={
        <>
          <Badge variant={order.priority}>{order.priority}</Badge>
          <Badge variant={order.overallStatus}>{order.overallStatus}</Badge>
        </>
      }
      primaryText={patientName}
      secondaryText={`${order.orderId} • ${formatDate(order.orderDate)}`}
      tertiaryText={order.referringPhysician}
      content={children}
      className={className}
    />
  );
};
```

---

## 5. Modal & Popover Standards

### 5.1 Standardize Modal Sizes

**Current Inconsistencies:**
| Modal | Size | Width |
|-------|------|-------|
| EditPatientModal | max-w-4xl | ~896px |
| LabDetailModal | 3xl | ~768px |
| Generic Modal | varies | varies |

**Standard Sizes:**
```typescript
export const MODAL_SIZES = {
  sm: 'max-w-md',    // ~448px - Simple confirmations
  md: 'max-w-lg',    // ~512px - Forms with few fields
  lg: 'max-w-2xl',   // ~672px - Complex forms
  xl: 'max-w-3xl',   // ~768px - Detail views (DEFAULT)
  '2xl': 'max-w-4xl', // ~896px - Multi-section forms
  full: 'max-w-6xl',  // ~1152px - Full detail pages
} as const;
```

**Standard Modal Structure:**
```typescript
<Modal size="xl" isOpen={isOpen} onClose={onClose} title={title}>
  {/* Scrollable Body */}
  <div className={CONTAINERS.modalBody}>
    {children}
  </div>

  {/* Fixed Footer */}
  <div className={CONTAINERS.modalFooter}>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        {statusIcon}
        {statusMessage}
      </div>
      <div className="flex items-center gap-3">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={onSubmit}>Submit</Button>
      </div>
    </div>
  </div>
</Modal>
```

---

### 5.2 Standardize Popover Configuration

**Current Inconsistencies:**
| Popover | Placement | Offset |
|---------|-----------|--------|
| SampleCollectionPopover | bottom-end | 8 |
| SampleRejectionPopover | bottom-end | 8 |
| PaymentPopover | bottom-end | 8 |
| AgeFilter | (uses Popover defaults) | default |
| DateFilter | (uses Popover defaults) | default |

**Standard Configuration:**
```typescript
export const POPOVER_CONFIG = {
  // Form Popovers (collection, rejection, payment)
  form: {
    placement: 'bottom-end' as const,
    offset: 8,
    width: 'w-80 md:w-96', // 320px / 384px
  },
  // Filter Popovers (date, multi-select)
  filter: {
    placement: 'bottom-start' as const,
    offset: 4,
    width: 'w-64', // 256px
  },
  // Tooltip-like Popovers
  tooltip: {
    placement: 'top' as const,
    offset: 4,
    width: 'w-48', // 192px
  },
} as const;
```

---

### 5.3 Create PopoverForm Usage Standard

**Problem:** PopoverForm is in lab/shared but should be in shared/ui.

**Action:** Move `src/features/lab/shared/PopoverForm.tsx` to `src/shared/ui/PopoverForm.tsx`

**Also move helper components:**
- `RadioCard` → `src/shared/ui/RadioCard.tsx`
- `CheckboxCard` → `src/shared/ui/CheckboxCard.tsx`

**Update imports in:**
- `src/features/lab/sample-collection/SampleCollectionPopover.tsx`
- `src/features/lab/sample-collection/SampleRejectionPopover.tsx`
- `src/features/lab/result-validation/ResultRejectionPopover.tsx`
- `src/features/payment/PaymentPopover.tsx`

---

## 6. Table Column Standards

### 6.1 Standardize Column Widths

**Current Inconsistencies:**
| Column Type | PatientList | OrderList | PaymentList |
|-------------|-------------|-----------|-------------|
| ID | 12% | 14% | 14% |
| Name | 18% | 17% | 16% |
| Status | - | 10% | 10% |
| Amount | - | 10% | 10% |
| Date | 11% | 10% | 10% |
| Actions | 4% | 3% | 12% |

**Standard Column Widths:**
```typescript
export const TABLE_COLUMN_WIDTHS = {
  // Fixed columns
  id: '12%',
  name: '18%',
  status: '10%',
  amount: '10%',
  date: '10%',
  actions: '8%',

  // Variable columns
  small: '8%',
  medium: '12%',
  large: '16%',
  xlarge: '20%',
} as const;
```

---

### 6.2 Standardize Column Render Patterns

**Create column factory functions in `src/shared/utils/tableColumns.ts`:**

```typescript
// ID Column (clickable, monospace, sky-600)
export const createIdColumn = (
  key: string,
  header: string,
  onClick: (id: string) => void
): ColumnDefinition => ({
  key,
  header,
  width: TABLE_COLUMN_WIDTHS.id,
  sortable: true,
  render: (row) => (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(row[key]); }}
      className={cn(TYPOGRAPHY.id, 'hover:underline truncate block max-w-full')}
    >
      {row[key]}
    </button>
  ),
});

// Name Column (two-line: name + subtitle)
export const createNameColumn = (
  key: string,
  header: string,
  getSubtitle?: (row: any) => string
): ColumnDefinition => ({
  key,
  header,
  width: TABLE_COLUMN_WIDTHS.name,
  sortable: true,
  render: (row) => (
    <div className="min-w-0">
      <div className={cn(TYPOGRAPHY.cardTitle, 'truncate')}>{row[key]}</div>
      {getSubtitle && (
        <div className={cn(TYPOGRAPHY.meta, 'truncate')}>{getSubtitle(row)}</div>
      )}
    </div>
  ),
});

// Badge Column
export const createBadgeColumn = (
  key: string,
  header: string,
  getVariant: (value: string) => string
): ColumnDefinition => ({
  key,
  header,
  width: TABLE_COLUMN_WIDTHS.status,
  sortable: true,
  render: (row) => (
    <Badge variant={getVariant(row[key])} size="sm">
      {row[key]}
    </Badge>
  ),
});

// Amount Column
export const createAmountColumn = (
  key: string,
  header: string
): ColumnDefinition => ({
  key,
  header,
  width: TABLE_COLUMN_WIDTHS.amount,
  sortable: true,
  render: (row) => (
    <span className="font-medium text-sky-600 truncate block">
      {formatCurrency(row[key])}
    </span>
  ),
});

// Date Column
export const createDateColumn = (
  key: string,
  header: string
): ColumnDefinition => ({
  key,
  header,
  width: TABLE_COLUMN_WIDTHS.date,
  sortable: true,
  render: (row) => (
    <span className={cn(TYPOGRAPHY.meta, 'truncate block')}>
      {formatDate(row[key])}
    </span>
  ),
});

// Actions Column
export const createActionsColumn = (
  renderActions: (row: any) => ReactNode
): ColumnDefinition => ({
  key: 'actions',
  header: '',
  width: TABLE_COLUMN_WIDTHS.actions,
  sortable: false,
  render: (row) => (
    <div onClick={(e) => e.stopPropagation()}>
      {renderActions(row)}
    </div>
  ),
});
```

**Update existing column files:**
- `src/features/order/OrderTableColumns.tsx` → Use factory functions
- `src/features/payment/PaymentTableColumns.tsx` → Use factory functions
- `src/features/patient/PatientList.tsx` (inline columns) → Use factory functions

---

## 7. Form Input Standards

### 7.1 Standardize Input Styling

**Problem:** Inputs across popovers and forms use inconsistent classes.

**Current Variations:**
```typescript
// SampleCollectionPopover
"w-full pl-3 pr-8 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-sky-500"

// SampleRejectionPopover
"w-full px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-500"

// PaymentPopover
"w-full px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
```

**Standard Input Classes:**
```typescript
export const INPUT_CLASSES = {
  // Base input (all sizes)
  base: 'w-full border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-colors',

  // Size variants
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-3 py-2 text-sm',
  lg: 'px-4 py-2.5 text-base',

  // State variants
  error: 'border-red-500 focus:ring-red-500',
  warning: 'border-yellow-500 focus:ring-yellow-500',
  disabled: 'bg-gray-100 cursor-not-allowed opacity-50',

  // Combined presets
  default: 'w-full px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent',

  // Textarea specific
  textarea: 'resize-none',
} as const;
```

**Update** `src/shared/ui/Input.tsx` and `src/shared/ui/Textarea.tsx` to use these constants.

---

### 7.2 Standardize Form Field Layout

**Problem:** Label + input + error layout varies.

**Standard Pattern:**
```typescript
export const FormField: React.FC<FormFieldProps> = ({
  label,
  required,
  error,
  helper,
  children, // Input element
}) => (
  <div className={SPACING.fieldGap}>
    {label && (
      <label className={TYPOGRAPHY.label}>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
    )}
    {children}
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    {helper && !error && <p className="text-xs text-gray-400 mt-1">{helper}</p>}
  </div>
);
```

---

## 8. Error & Loading States

### 8.1 Standardize Error Display

**Problem:** Errors displayed differently across components.

**Current Variations:**
1. ErrorAlert component (PatientList, OrderList)
2. Inline div with red styling (PaymentList)
3. Alert component (PaymentPopover)
4. Toast only (lab popovers)

**Standard Error Patterns:**

```typescript
// 1. Page-level errors (dismissible)
<ErrorAlert
  message={error.message}
  onDismiss={clearError}
  onRetry={refresh}
/>

// 2. Form-level errors (non-dismissible)
<Alert variant="danger" className="mb-4">
  <p className="text-sm">{error}</p>
</Alert>

// 3. Field-level errors
<p className="text-xs text-red-500 mt-1">{fieldError}</p>

// 4. Toast notifications (transient)
toast.error('Operation failed');
```

**Decision Matrix:**
| Context | Error Type |
|---------|-----------|
| List page data fetch failed | ErrorAlert (page-level) |
| Form submission failed | Alert (form-level) + Toast |
| Field validation failed | Field-level error |
| Inline action failed | Toast only |

---

### 8.2 Standardize Loading States

**Problem:** Different loading indicators used.

**Standard Loading Patterns:**

```typescript
// 1. Full page loading (initial load)
<div className="h-full flex items-center justify-center">
  <div className="text-center">
    <LoadingSpinner size="lg" />
    <p className="mt-2 text-gray-600">Loading {entityName}...</p>
  </div>
</div>

// 2. Section loading (partial refresh)
<div className="flex items-center justify-center p-8">
  <LoadingSpinner size="md" />
</div>

// 3. Button loading
<Button isLoading={isSubmitting} disabled={isSubmitting}>
  {isSubmitting ? 'Processing...' : 'Submit'}
</Button>

// 4. Inline loading (next to content)
<span className="flex items-center gap-2">
  <LoadingSpinner size="sm" />
  <span className="text-sm text-gray-500">Loading...</span>
</span>
```

**Loading Text Standards:**
| Context | Text |
|---------|------|
| Patients | "Loading patients..." |
| Orders | "Loading orders..." |
| Samples | "Loading samples..." |
| Payments | "Loading payments..." |
| Form submit | "Saving..." / "Processing..." / "Creating..." |

---

## 9. Badge & Status Standards

### 9.1 Consolidate Badge Variants

**Problem:** Badge variants defined in multiple places with inconsistent naming.

**Create unified variant map in `src/shared/ui/Badge.tsx`:**

```typescript
export const BADGE_VARIANTS = {
  // Status Variants
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  validated: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',

  // Payment Status
  paid: 'bg-green-100 text-green-800 border-green-200',
  unpaid: 'bg-orange-100 text-orange-800 border-orange-200',
  partial: 'bg-yellow-100 text-yellow-800 border-yellow-200',

  // Priority
  routine: 'bg-gray-100 text-gray-800 border-gray-200',
  urgent: 'bg-orange-100 text-orange-800 border-orange-200',
  stat: 'bg-red-100 text-red-800 border-red-200',

  // Sample Types
  blood: 'bg-red-100 text-red-800 border-red-200',
  urine: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  serum: 'bg-amber-100 text-amber-800 border-amber-200',
  plasma: 'bg-orange-100 text-orange-800 border-orange-200',

  // Gender
  male: 'bg-blue-100 text-blue-800 border-blue-200',
  female: 'bg-pink-100 text-pink-800 border-pink-200',
  other: 'bg-purple-100 text-purple-800 border-purple-200',

  // Payment Methods
  cash: 'bg-green-100 text-green-800 border-green-200',
  'mobile-money': 'bg-purple-100 text-purple-800 border-purple-200',

  // Result Status
  normal: 'bg-green-100 text-green-800 border-green-200',
  high: 'bg-amber-100 text-amber-800 border-amber-200',
  low: 'bg-amber-100 text-amber-800 border-amber-200',
  critical: 'bg-red-100 text-red-800 border-red-200',

  // Generic
  default: 'bg-gray-100 text-gray-800 border-gray-200',
  primary: 'bg-sky-100 text-sky-800 border-sky-200',
  success: 'bg-green-100 text-green-800 border-green-200',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  danger: 'bg-red-100 text-red-800 border-red-200',
  info: 'bg-blue-100 text-blue-800 border-blue-200',
} as const;
```

---

### 9.2 Remove Duplicate Variant Definitions

**Files with duplicate definitions to consolidate:**
- `src/types/enums/order-status.ts` (ORDER_STATUS_CONFIG)
- `src/types/enums/test-status.ts` (TEST_STATUS_CONFIG)
- `src/types/enums/sample-status.ts` (SAMPLE_STATUS_CONFIG)
- `src/types/enums/payment-status.ts` (PAYMENT_STATUS_CONFIG)
- `src/types/enums/priority-level.ts` (PRIORITY_LEVEL_CONFIG)

**Action:** Keep enum configs for labels/options, but reference BADGE_VARIANTS for colors.

```typescript
// Before (in order-status.ts)
export const ORDER_STATUS_CONFIG = {
  ordered: { label: 'Ordered', color: 'yellow', variant: 'warning' },
  // ...
};

// After
export const ORDER_STATUS_CONFIG = {
  ordered: { label: 'Ordered', badgeVariant: 'pending' }, // References BADGE_VARIANTS
  // ...
};
```

---

## 10. Implementation Checklist

### Phase 1: Foundation (Do First)
- [ ] Create `src/shared/styles/tokens.ts` with design tokens
- [ ] Update Badge component with unified BADGE_VARIANTS
- [ ] Create `src/shared/utils/tableColumns.ts` with column factories
- [ ] Move PopoverForm, RadioCard, CheckboxCard to shared/ui

### Phase 2: Layout Components
- [ ] Create `ListPageLayout` component
- [ ] Create `DetailPageLayout` component
- [ ] Create unified `FilterBar` component
- [ ] Create `FilterDivider` helper

### Phase 3: Update List Pages
- [ ] Refactor PatientList to use ListPageLayout + FilterBar
- [ ] Refactor OrderList to use ListPageLayout + FilterBar
- [ ] Refactor PaymentList to use ListPageLayout + FilterBar
- [ ] Update LabWorkflowView header to match standard

### Phase 4: Update Detail Pages
- [ ] Refactor PatientDetail to use DetailPageLayout
- [ ] Refactor OrderDetail to use DetailPageLayout

### Phase 5: Standardize Cards
- [ ] Create EntityCard component (if needed beyond LabCard)
- [ ] Refactor OrderCard to use standardized pattern
- [ ] Update LabCard to use design tokens

### Phase 6: Form & Input Standards
- [ ] Create INPUT_CLASSES constants
- [ ] Create FormField wrapper component
- [ ] Update all popover forms to use standardized inputs
- [ ] Standardize keyboard shortcuts hints

### Phase 7: Error & Loading
- [ ] Standardize error display patterns
- [ ] Standardize loading state patterns
- [ ] Update all loading text to follow convention

### Phase 8: Final Cleanup
- [ ] Remove duplicate style definitions
- [ ] Update all imports to use new shared components
- [ ] Run build and fix any TypeScript errors
- [ ] Visual regression testing

---

## Summary

| Change | Files Affected | Effort |
|--------|----------------|--------|
| Design Tokens | 1 new + ~30 updates | Medium |
| ListPageLayout | 1 new + 3 updates | Low |
| DetailPageLayout | 1 new + 2 updates | Low |
| FilterBar | 1 new + 3 updates | Medium |
| Table Column Utils | 1 new + 3 updates | Medium |
| Badge Variants | 1 update + ~10 updates | Medium |
| PopoverForm Move | 3 moves + ~5 updates | Low |
| Input Standards | 1 new + ~10 updates | Medium |

**Total Estimated Files:** ~50 files
**New Components:** 5
**Moved Components:** 3

---

*End of UI Consolidation Plan*
