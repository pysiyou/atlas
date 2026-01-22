# Table Component Redesign - Implementation Plan

## Overview

Complete redesign of the table component system to support:
- **Responsive column visibility** (hide columns on smaller screens)
- **Configurable column sizing** (fixed, flexible, percentage-based)
- **Mobile card view fallback** (transform table into cards on mobile)
- **Enhanced visual design** (skeleton loading, sticky headers, better hover states)

---

## Project Context

**Codebase location:** `/Users/psiyou/Desktop/Atlas/frontend`
**Styling:** Tailwind CSS (v4.1.18)
**Existing components to leverage:**
- `src/hooks/useBreakpoint.ts` - Already exists, provides breakpoint detection
- `src/shared/ui/Pagination.tsx` - Reuse for table pagination
- `src/shared/ui/Icon.tsx` - Reuse for sort icons
- `src/shared/ui/Skeleton.tsx` - Reuse for loading states
- `src/shared/ui/Badge.tsx` - Used in table cells
- `src/shared/ui/TableActionMenu.tsx` - Keep as-is for row actions

**Files to replace:**
- `src/shared/ui/Table.tsx` - Current implementation (233 lines)

**Files using tables (will need column definition updates):**
- `src/features/catalog/CatalogTableColumns.tsx`
- `src/features/order/OrderTableColumns.tsx`
- `src/features/payment/PaymentTableColumns.tsx`

---

## Phase 1: Core Types and Constants

### Task 1.1: Create Type Definitions

**File:** `src/shared/ui/Table/types.ts`

```typescript
import { ReactNode } from 'react';

/**
 * Breakpoint type matching Tailwind CSS breakpoints
 */
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/**
 * Responsive visibility configuration
 * Defines at which breakpoints a column should be visible
 */
export interface ResponsiveVisibility {
  xs?: boolean;   // < 640px (mobile)
  sm?: boolean;   // >= 640px (large mobile)
  md?: boolean;   // >= 768px (tablet)
  lg?: boolean;   // >= 1024px (desktop)
  xl?: boolean;   // >= 1280px (large desktop)
  '2xl'?: boolean; // >= 1536px (extra large)
}

/**
 * Column width configuration
 * Supports fixed, flexible, and percentage-based widths
 */
export interface ColumnWidth {
  /** Base width (e.g., '200px', 200, '15%') */
  base?: string | number;
  /** Minimum width constraint */
  min?: string | number;
  /** Maximum width constraint */
  max?: string | number;
  /** Flex grow factor (0 = fixed, 1+ = flexible) */
  grow?: number;
  /** Flex shrink factor */
  shrink?: number;
}

/**
 * Predefined size presets for common column types
 */
export type ColumnSizePreset = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'auto' | 'fill';

/**
 * Text alignment options
 */
export type ColumnAlign = 'left' | 'center' | 'right';

/**
 * Sticky column position
 */
export type StickyPosition = 'left' | 'right';

/**
 * Enhanced column definition with responsive and sizing features
 */
export interface ColumnConfig<T> {
  /** Unique identifier for the column */
  key: string;
  /** Display header text */
  header: string;

  // === Responsive Visibility ===
  /**
   * Responsive visibility configuration
   * Can be a ResponsiveVisibility object or a preset name
   */
  visible?: ResponsiveVisibility | 'always' | 'desktop' | 'tablet' | 'wide';

  // === Column Sizing ===
  /**
   * Column width - can be a preset or custom configuration
   * Preset: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'auto' | 'fill'
   * Custom: { base, min, max, grow, shrink }
   */
  width?: ColumnWidth | ColumnSizePreset | string | number;

  // === Content Display ===
  /** Custom render function for cell content */
  render?: (item: T, index: number) => ReactNode;
  /** Text alignment within the cell */
  align?: ColumnAlign;
  /** Enable text truncation with ellipsis */
  truncate?: boolean;

  // === Sorting ===
  /** Whether the column is sortable */
  sortable?: boolean;
  /** Custom sort function */
  sortFn?: (a: T, b: T) => number;

  // === Advanced Features ===
  /** Freeze column to left or right edge */
  sticky?: StickyPosition;
  /** Priority for mobile card view (lower = more important, shown first) */
  priority?: number;

  // === Styling ===
  /** Additional CSS classes for cells */
  className?: string;
  /** Additional CSS classes for header */
  headerClassName?: string;
}

/**
 * Sort configuration
 */
export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

/**
 * Pagination configuration (external control)
 */
export interface PaginationConfig {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

/**
 * Table visual variants
 */
export type TableVariant = 'default' | 'compact' | 'comfortable';

/**
 * Main Table component props
 */
export interface TableProps<T> {
  /** Array of data items to display */
  data: T[];
  /** Column definitions with responsive configuration */
  columns: ColumnConfig<T>[];

  // === Pagination ===
  /** External pagination control (if not provided, internal pagination is used) */
  pagination?: PaginationConfig | boolean;
  /** Initial page size for internal pagination */
  initialPageSize?: number;
  /** Page size options for internal pagination */
  pageSizeOptions?: number[];

  // === Sorting ===
  /** Default sort configuration */
  defaultSort?: SortConfig;
  /** Controlled sort state */
  sort?: SortConfig | null;
  /** Sort change handler for controlled mode */
  onSortChange?: (sort: SortConfig | null) => void;

  // === Responsive Behavior ===
  /** Override detected breakpoint (for testing) */
  breakpoint?: Breakpoint;
  /** Enable card view on mobile (default: true) */
  enableCardView?: boolean;
  /** Breakpoint at which to switch to card view (default: 'sm') */
  cardViewBreakpoint?: Breakpoint;
  /** Number of priority fields to show in card view (default: 4) */
  cardPriorityFields?: number;

  // === Visual Options ===
  /** Table density variant */
  variant?: TableVariant;
  /** Show alternating row backgrounds */
  striped?: boolean;
  /** Show cell borders */
  bordered?: boolean;
  /** Sticky header on scroll */
  stickyHeader?: boolean;
  /** Maximum height (enables vertical scroll) */
  maxHeight?: string;
  /** Embedded mode (removes outer border/rounded corners) */
  embedded?: boolean;

  // === Interactions ===
  /** Row click handler */
  onRowClick?: (item: T, index: number) => void;
  /** Dynamic row CSS classes */
  rowClassName?: (item: T, index: number) => string;
  /** Row key extractor (default: uses index) */
  getRowKey?: (item: T, index: number) => string | number;

  // === States ===
  /** Loading state */
  loading?: boolean;
  /** Number of skeleton rows to show while loading */
  loadingRows?: number;
  /** Empty state message */
  emptyMessage?: ReactNode;
  /** Empty state icon name */
  emptyIcon?: string;

  // === Accessibility ===
  /** Table caption for screen readers */
  caption?: string;
  /** aria-label for the table */
  ariaLabel?: string;
}

/**
 * Props for internal TableHeader component
 */
export interface TableHeaderProps<T> {
  columns: ColumnConfig<T>[];
  visibleColumns: ColumnConfig<T>[];
  sort: SortConfig | null;
  onSort: (key: string) => void;
  variant: TableVariant;
  sticky?: boolean;
}

/**
 * Props for internal TableBody component
 */
export interface TableBodyProps<T> {
  data: T[];
  visibleColumns: ColumnConfig<T>[];
  variant: TableVariant;
  striped?: boolean;
  onRowClick?: (item: T, index: number) => void;
  rowClassName?: (item: T, index: number) => string;
  getRowKey?: (item: T, index: number) => string | number;
}

/**
 * Props for internal TableCell component
 */
export interface TableCellProps {
  column: ColumnConfig<unknown>;
  children: ReactNode;
  variant: TableVariant;
  isHeader?: boolean;
}

/**
 * Props for mobile card view
 */
export interface TableCardViewProps<T> {
  data: T[];
  columns: ColumnConfig<T>[];
  priorityFields: number;
  onRowClick?: (item: T, index: number) => void;
  getRowKey?: (item: T, index: number) => string | number;
}

/**
 * Props for loading skeleton
 */
export interface TableSkeletonProps {
  columns: ColumnConfig<unknown>[];
  rows: number;
  variant: TableVariant;
}
```

### Task 1.2: Create Constants and Presets

**File:** `src/shared/ui/Table/constants.ts`

```typescript
import { ResponsiveVisibility, ColumnWidth, TableVariant } from './types';

/**
 * Tailwind breakpoint values in pixels
 */
export const BREAKPOINT_VALUES = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/**
 * Visibility presets for common responsive patterns
 */
export const VISIBILITY_PRESETS: Record<string, ResponsiveVisibility> = {
  /** Always visible on all screen sizes */
  always: { xs: true, sm: true, md: true, lg: true, xl: true, '2xl': true },
  /** Visible only on desktop and above (lg+) */
  desktop: { xs: false, sm: false, md: false, lg: true, xl: true, '2xl': true },
  /** Visible on tablet and above (md+) */
  tablet: { xs: false, sm: false, md: true, lg: true, xl: true, '2xl': true },
  /** Visible on large mobile and above (sm+) */
  mobile: { xs: false, sm: true, md: true, lg: true, xl: true, '2xl': true },
  /** Visible only on wide screens (xl+) */
  wide: { xs: false, sm: false, md: false, lg: false, xl: true, '2xl': true },
};

/**
 * Size presets for common column types
 */
export const SIZE_PRESETS: Record<string, ColumnWidth> = {
  /** Extra small - icons, checkboxes, actions (60px fixed) */
  xs: { base: 60, min: 50, grow: 0, shrink: 0 },
  /** Small - codes, dates, short values (100px fixed) */
  sm: { base: 100, min: 80, grow: 0, shrink: 0 },
  /** Medium - names, statuses, labels (150px fixed) */
  md: { base: 150, min: 120, grow: 0, shrink: 0 },
  /** Large - descriptions, longer text (200px, can grow) */
  lg: { base: 200, min: 160, grow: 1, shrink: 1 },
  /** Extra large - long text, comments (300px, grows more) */
  xl: { base: 300, min: 200, grow: 2, shrink: 1 },
  /** Auto - content-sized, no flex */
  auto: { grow: 0, shrink: 0 },
  /** Fill - fills remaining space */
  fill: { min: 100, grow: 1, shrink: 1 },
};

/**
 * Row heights for different variants
 */
export const ROW_HEIGHTS: Record<TableVariant, number> = {
  compact: 44,
  default: 56,
  comfortable: 68,
};

/**
 * Padding classes for different variants
 */
export const CELL_PADDING: Record<TableVariant, string> = {
  compact: 'px-3 py-2',
  default: 'px-4 py-3',
  comfortable: 'px-6 py-4',
};

/**
 * Header padding classes for different variants
 */
export const HEADER_PADDING: Record<TableVariant, string> = {
  compact: 'px-3 py-2',
  default: 'px-4 py-3',
  comfortable: 'px-6 py-4',
};

/**
 * Text size classes for different variants
 */
export const TEXT_SIZE: Record<TableVariant, string> = {
  compact: 'text-xs',
  default: 'text-sm',
  comfortable: 'text-sm',
};

/**
 * Default number of skeleton rows to show while loading
 */
export const DEFAULT_LOADING_ROWS = 5;

/**
 * Default pagination options
 */
export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

/**
 * Default card view settings
 */
export const DEFAULT_CARD_PRIORITY_FIELDS = 4;
export const DEFAULT_CARD_VIEW_BREAKPOINT = 'sm';
```

---

## Phase 2: Utility Hooks

### Task 2.1: Create Column Visibility Hook

**File:** `src/shared/ui/Table/hooks/useColumnVisibility.ts`

```typescript
import { useMemo } from 'react';
import { ColumnConfig, Breakpoint, ResponsiveVisibility } from '../types';
import { VISIBILITY_PRESETS } from '../constants';

/**
 * Resolve visibility configuration to a ResponsiveVisibility object
 */
const resolveVisibility = (
  visible: ColumnConfig<unknown>['visible']
): ResponsiveVisibility => {
  if (!visible) {
    // Default: always visible
    return VISIBILITY_PRESETS.always;
  }

  if (typeof visible === 'string') {
    // Preset name
    return VISIBILITY_PRESETS[visible] || VISIBILITY_PRESETS.always;
  }

  // Custom visibility object - fill in missing breakpoints
  return {
    xs: visible.xs ?? true,
    sm: visible.sm ?? visible.xs ?? true,
    md: visible.md ?? visible.sm ?? visible.xs ?? true,
    lg: visible.lg ?? visible.md ?? visible.sm ?? visible.xs ?? true,
    xl: visible.xl ?? visible.lg ?? visible.md ?? visible.sm ?? visible.xs ?? true,
    '2xl': visible['2xl'] ?? visible.xl ?? visible.lg ?? visible.md ?? visible.sm ?? visible.xs ?? true,
  };
};

/**
 * Check if a column should be visible at the given breakpoint
 */
const isColumnVisible = (
  column: ColumnConfig<unknown>,
  breakpoint: Breakpoint
): boolean => {
  const visibility = resolveVisibility(column.visible);
  return visibility[breakpoint] ?? true;
};

/**
 * Hook to filter columns based on current breakpoint
 *
 * @param columns - All column definitions
 * @param breakpoint - Current screen breakpoint
 * @returns Array of visible columns for the current breakpoint
 */
export const useColumnVisibility = <T>(
  columns: ColumnConfig<T>[],
  breakpoint: Breakpoint
): ColumnConfig<T>[] => {
  return useMemo(() => {
    return columns.filter((column) => isColumnVisible(column, breakpoint));
  }, [columns, breakpoint]);
};

/**
 * Get columns sorted by priority for card view
 * Lower priority number = shown first
 */
export const useCardViewColumns = <T>(
  columns: ColumnConfig<T>[],
  maxFields: number
): ColumnConfig<T>[] => {
  return useMemo(() => {
    // Sort by priority (lower = more important)
    // Columns without priority come last
    const sorted = [...columns].sort((a, b) => {
      const priorityA = a.priority ?? 999;
      const priorityB = b.priority ?? 999;
      return priorityA - priorityB;
    });

    return sorted.slice(0, maxFields);
  }, [columns, maxFields]);
};
```

### Task 2.2: Create Column Width Hook

**File:** `src/shared/ui/Table/hooks/useColumnWidth.ts`

```typescript
import { useMemo, CSSProperties } from 'react';
import { ColumnConfig, ColumnWidth, ColumnSizePreset } from '../types';
import { SIZE_PRESETS } from '../constants';

/**
 * Convert a width value to CSS-compatible string
 */
const toCssValue = (value: string | number | undefined): string | undefined => {
  if (value === undefined) return undefined;
  if (typeof value === 'number') return `${value}px`;
  return value;
};

/**
 * Resolve width configuration to a ColumnWidth object
 */
const resolveWidth = (width: ColumnConfig<unknown>['width']): ColumnWidth => {
  if (!width) {
    // Default: flexible column
    return { grow: 1, shrink: 1, min: 100 };
  }

  if (typeof width === 'string') {
    // Check if it's a preset name
    if (width in SIZE_PRESETS) {
      return SIZE_PRESETS[width as ColumnSizePreset];
    }
    // Otherwise treat as CSS value
    return { base: width, grow: 0, shrink: 0 };
  }

  if (typeof width === 'number') {
    // Fixed pixel width
    return { base: width, grow: 0, shrink: 0 };
  }

  // Custom ColumnWidth object
  return width;
};

/**
 * Generate CSS styles for a column based on its width configuration
 */
export const getColumnStyle = (column: ColumnConfig<unknown>): CSSProperties => {
  const width = resolveWidth(column.width);

  const style: CSSProperties = {};

  // Base width
  if (width.base !== undefined) {
    style.width = toCssValue(width.base);
  }

  // Min/max constraints
  if (width.min !== undefined) {
    style.minWidth = toCssValue(width.min);
  }
  if (width.max !== undefined) {
    style.maxWidth = toCssValue(width.max);
  }

  // Flex properties
  style.flexGrow = width.grow ?? 0;
  style.flexShrink = width.shrink ?? 0;

  // If no base width but has grow, use flex basis auto
  if (width.base === undefined && (width.grow ?? 0) > 0) {
    style.flexBasis = 'auto';
  } else if (width.base !== undefined) {
    style.flexBasis = toCssValue(width.base);
  }

  return style;
};

/**
 * Hook to compute column styles for all columns
 */
export const useColumnStyles = <T>(
  columns: ColumnConfig<T>[]
): Map<string, CSSProperties> => {
  return useMemo(() => {
    const styleMap = new Map<string, CSSProperties>();

    columns.forEach((column) => {
      styleMap.set(column.key, getColumnStyle(column));
    });

    return styleMap;
  }, [columns]);
};
```

### Task 2.3: Create Table Sort Hook

**File:** `src/shared/ui/Table/hooks/useTableSort.ts`

```typescript
import { useState, useMemo, useCallback } from 'react';
import { SortConfig, ColumnConfig } from '../types';

interface UseTableSortOptions<T> {
  data: T[];
  columns: ColumnConfig<T>[];
  defaultSort?: SortConfig;
  controlledSort?: SortConfig | null;
  onSortChange?: (sort: SortConfig | null) => void;
}

interface UseTableSortResult<T> {
  sortedData: T[];
  sort: SortConfig | null;
  handleSort: (columnKey: string) => void;
}

/**
 * Hook to manage table sorting
 * Supports both controlled and uncontrolled modes
 */
export const useTableSort = <T extends Record<string, unknown>>({
  data,
  columns,
  defaultSort,
  controlledSort,
  onSortChange,
}: UseTableSortOptions<T>): UseTableSortResult<T> => {
  // Internal state for uncontrolled mode
  const [internalSort, setInternalSort] = useState<SortConfig | null>(
    defaultSort || null
  );

  // Use controlled sort if provided, otherwise use internal
  const isControlled = controlledSort !== undefined;
  const sort = isControlled ? controlledSort : internalSort;

  /**
   * Handle sort column click
   * Cycles through: asc -> desc -> none
   */
  const handleSort = useCallback(
    (columnKey: string) => {
      // Find the column to check if it's sortable
      const column = columns.find((c) => c.key === columnKey);
      if (!column?.sortable) return;

      const newSort: SortConfig | null = (() => {
        if (sort?.key !== columnKey) {
          // New column - start with ascending
          return { key: columnKey, direction: 'asc' };
        }
        if (sort.direction === 'asc') {
          // Currently ascending - switch to descending
          return { key: columnKey, direction: 'desc' };
        }
        // Currently descending - clear sort
        return null;
      })();

      if (isControlled) {
        onSortChange?.(newSort);
      } else {
        setInternalSort(newSort);
      }
    },
    [sort, columns, isControlled, onSortChange]
  );

  /**
   * Sort the data based on current sort configuration
   */
  const sortedData = useMemo(() => {
    if (!sort) return data;

    const column = columns.find((c) => c.key === sort.key);

    return [...data].sort((a, b) => {
      // Use custom sort function if provided
      if (column?.sortFn) {
        const result = column.sortFn(a, b);
        return sort.direction === 'asc' ? result : -result;
      }

      // Default comparison
      const aValue = a[sort.key];
      const bValue = b[sort.key];

      // Handle null/undefined
      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      // String comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sort.direction === 'asc' ? comparison : -comparison;
      }

      // Numeric/default comparison
      const comparison = aValue < bValue ? -1 : 1;
      return sort.direction === 'asc' ? comparison : -comparison;
    });
  }, [data, sort, columns]);

  return {
    sortedData,
    sort,
    handleSort,
  };
};
```

### Task 2.4: Create Table Pagination Hook

**File:** `src/shared/ui/Table/hooks/useTablePagination.ts`

```typescript
import { useState, useMemo, useCallback, useEffect } from 'react';
import { PaginationConfig } from '../types';
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE_OPTIONS } from '../constants';

interface UseTablePaginationOptions<T> {
  data: T[];
  externalPagination?: PaginationConfig;
  enabled?: boolean;
  initialPageSize?: number;
  pageSizeOptions?: number[];
}

interface UseTablePaginationResult<T> {
  paginatedData: T[];
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  pageSizeOptions: number[];
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  isExternallyControlled: boolean;
}

/**
 * Hook to manage table pagination
 * Supports both internal and external (server-side) pagination
 */
export const useTablePagination = <T>({
  data,
  externalPagination,
  enabled = true,
  initialPageSize = DEFAULT_PAGE_SIZE,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
}: UseTablePaginationOptions<T>): UseTablePaginationResult<T> => {
  // Internal state for client-side pagination
  const [internalPage, setInternalPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState(initialPageSize);

  const isExternallyControlled = !!externalPagination;

  // Use external values if provided
  const currentPage = isExternallyControlled
    ? externalPagination.currentPage
    : internalPage;
  const pageSize = isExternallyControlled
    ? externalPagination.pageSize
    : internalPageSize;
  const totalItems = isExternallyControlled
    ? externalPagination.totalItems
    : data.length;

  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  // Reset to page 1 if current page is out of bounds
  useEffect(() => {
    if (!isExternallyControlled && currentPage > totalPages) {
      setInternalPage(1);
    }
  }, [currentPage, totalPages, isExternallyControlled]);

  /**
   * Set current page
   */
  const setCurrentPage = useCallback(
    (page: number) => {
      if (isExternallyControlled) {
        externalPagination.onPageChange(page);
      } else {
        setInternalPage(page);
      }
    },
    [isExternallyControlled, externalPagination]
  );

  /**
   * Set page size
   */
  const setPageSize = useCallback(
    (size: number) => {
      if (isExternallyControlled) {
        externalPagination.onPageSizeChange?.(size);
      } else {
        setInternalPageSize(size);
        setInternalPage(1); // Reset to first page
      }
    },
    [isExternallyControlled, externalPagination]
  );

  /**
   * Paginate data for client-side pagination
   */
  const paginatedData = useMemo(() => {
    if (!enabled || isExternallyControlled) {
      return data;
    }

    const startIndex = (currentPage - 1) * pageSize;
    return data.slice(startIndex, startIndex + pageSize);
  }, [data, enabled, isExternallyControlled, currentPage, pageSize]);

  return {
    paginatedData,
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    pageSizeOptions: externalPagination?.pageSizeOptions || pageSizeOptions,
    setCurrentPage,
    setPageSize,
    isExternallyControlled,
  };
};
```

---

## Phase 3: Sub-Components

### Task 3.1: Create TableHeader Component

**File:** `src/shared/ui/Table/TableHeader.tsx`

Implement a table header component with:
- Render visible columns only
- Display sort indicators (arrow-up/arrow-down icons)
- Click handler for sortable columns
- Sticky positioning support
- Apply column width styles from `useColumnWidth`
- Apply alignment based on `column.align`
- Support variant styling (compact/default/comfortable)

**Key classes:**
- Header container: `flex border-b border-gray-200 bg-gray-50`
- Sticky: `sticky top-0 z-10`
- Sortable: `cursor-pointer hover:bg-gray-100 select-none`
- Active sort: `text-gray-900 bg-gray-100`

### Task 3.2: Create TableRow Component

**File:** `src/shared/ui/Table/TableRow.tsx`

Implement a table row component with:
- Render cells for visible columns only
- Apply column width styles
- Apply alignment and truncation
- Hover state for clickable rows
- Striped background support
- Handle row click

**Key classes:**
- Row: `flex items-center border-b border-gray-100 transition-colors`
- Clickable: `cursor-pointer hover:bg-gray-50`
- Striped (odd): `bg-gray-50/50`

### Task 3.3: Create TableCell Component

**File:** `src/shared/ui/Table/TableCell.tsx`

Implement a table cell component with:
- Apply column-specific styles
- Handle text truncation with ellipsis
- Apply text alignment
- Support sticky columns (left/right)

**Key classes:**
- Cell base: `overflow-hidden`
- Truncate: `truncate`
- Align left: `text-left`
- Align center: `text-center`
- Align right: `text-right`
- Sticky left: `sticky left-0 bg-white z-[1]`
- Sticky right: `sticky right-0 bg-white z-[1]`

### Task 3.4: Create TableSkeleton Component

**File:** `src/shared/ui/Table/TableSkeleton.tsx`

Implement a loading skeleton that:
- Renders skeleton rows matching the number specified
- Each row has skeleton cells matching visible columns
- Skeleton widths vary based on column width config
- Uses existing `Skeleton` component from `src/shared/ui/Skeleton.tsx`
- Animates with pulse effect

### Task 3.5: Create TableEmpty Component

**File:** `src/shared/ui/Table/TableEmpty.tsx`

Implement an empty state component with:
- Centered layout
- Optional icon (use Icon component)
- Customizable message
- Subtle background

**Default message:** "No data available"
**Default icon:** "inbox" or similar

### Task 3.6: Create TableCardView Component

**File:** `src/shared/ui/Table/TableCardView.tsx`

Implement a mobile card view that:
- Renders each data item as a card
- Shows priority fields based on `column.priority`
- First priority field as card title
- Remaining fields as label-value pairs
- Supports row click
- Responsive grid: 1 column on xs, 2 columns on sm

**Card structure:**
```
┌─────────────────────────────────────┐
│ [Primary Field Value]        [Badge]│
│ ─────────────────────────────────── │
│ Label 1: Value 1                    │
│ Label 2: Value 2                    │
│ Label 3: Value 3                    │
└─────────────────────────────────────┘
```

**Key classes:**
- Container: `grid gap-4 grid-cols-1 sm:grid-cols-2`
- Card: `bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow`
- Clickable card: `cursor-pointer`

---

## Phase 4: Main Table Component

### Task 4.1: Create Main Table Component

**File:** `src/shared/ui/Table/Table.tsx`

Implement the main Table component that:

1. **Uses hooks:**
   - `useBreakpoint()` - from existing `src/hooks/useBreakpoint.ts`
   - `useColumnVisibility()` - filter columns by breakpoint
   - `useColumnStyles()` - compute CSS styles for columns
   - `useTableSort()` - manage sorting
   - `useTablePagination()` - manage pagination

2. **Renders conditionally:**
   - If loading: render `TableSkeleton`
   - If no data: render `TableEmpty`
   - If mobile + `enableCardView`: render `TableCardView`
   - Otherwise: render table with header and rows

3. **Table structure:**
   ```
   <div className="flex flex-col h-full bg-white rounded border">
     <!-- Scrollable area -->
     <div className="flex-1 overflow-auto">
       <TableHeader />
       <TableBody>
         {rows.map(row => <TableRow />)}
       </TableBody>
     </div>

     <!-- Pagination (if enabled) -->
     <Pagination />
   </div>
   ```

4. **Features:**
   - Sticky header when `stickyHeader` is true
   - Sticky columns (left/right) for frozen columns
   - Horizontal scroll for overflow
   - Max height constraint with vertical scroll

### Task 4.2: Create Index Export

**File:** `src/shared/ui/Table/index.ts`

```typescript
// Main component
export { Table } from './Table';

// Types
export type {
  ColumnConfig,
  ColumnWidth,
  ColumnSizePreset,
  ColumnAlign,
  StickyPosition,
  ResponsiveVisibility,
  SortConfig,
  PaginationConfig,
  TableProps,
  TableVariant,
  Breakpoint,
} from './types';

// Constants (for use in column definitions)
export { VISIBILITY_PRESETS, SIZE_PRESETS } from './constants';

// Hooks (for advanced use cases)
export { useColumnVisibility, useCardViewColumns } from './hooks/useColumnVisibility';
export { useColumnStyles, getColumnStyle } from './hooks/useColumnWidth';
export { useTableSort } from './hooks/useTableSort';
export { useTablePagination } from './hooks/useTablePagination';
```

---

## Phase 5: Update Existing UI Exports

### Task 5.1: Update Shared UI Index

**File:** `src/shared/ui/index.ts` (if exists, otherwise skip)

Add export for new Table:
```typescript
export * from './Table';
```

### Task 5.2: Remove Old Table.tsx

**File:** `src/shared/ui/Table.tsx`

Delete this file after the new Table is complete and tested.

---

## Phase 6: Migrate Existing Column Definitions

### Task 6.1: Update CatalogTableColumns

**File:** `src/features/catalog/CatalogTableColumns.tsx`

Update to use new column config format:

```typescript
import { ColumnConfig, VISIBILITY_PRESETS } from '@/shared/ui/Table';
import { TestCatalog } from '@/types';

export const catalogColumns: ColumnConfig<TestCatalog>[] = [
  {
    key: 'code',
    header: 'Code',
    width: 'sm',
    sortable: true,
    visible: 'always',
    priority: 1,
    render: (item) => (
      <span className="font-mono text-sky-600 text-xs">{item.code}</span>
    ),
  },
  {
    key: 'name',
    header: 'Test Name',
    width: 'fill',
    sortable: true,
    truncate: true,
    visible: 'always',
    priority: 2,
  },
  {
    key: 'category',
    header: 'Category',
    width: 'md',
    sortable: true,
    visible: 'tablet',
    priority: 3,
    render: (item) => <Badge variant={item.category}>{item.category}</Badge>,
  },
  {
    key: 'sampleType',
    header: 'Sample Type',
    width: 'sm',
    sortable: true,
    visible: 'desktop',
    priority: 5,
  },
  {
    key: 'tat',
    header: 'TAT',
    width: 'xs',
    align: 'center',
    visible: 'wide',
    priority: 6,
  },
  {
    key: 'price',
    header: 'Price',
    width: 'sm',
    align: 'right',
    sortable: true,
    visible: 'tablet',
    priority: 4,
    render: (item) => formatCurrency(item.price),
  },
  {
    key: 'status',
    header: 'Status',
    width: 'sm',
    visible: 'desktop',
    render: (item) => <Badge variant={item.status}>{item.status}</Badge>,
  },
  {
    key: 'actions',
    header: '',
    width: 'xs',
    visible: 'always',
    sticky: 'right',
    render: (item) => <CatalogActionMenu item={item} />,
  },
];
```

### Task 6.2: Update OrderTableColumns

**File:** `src/features/order/OrderTableColumns.tsx`

Apply same pattern as Task 6.1 with appropriate visibility and priorities for order fields.

### Task 6.3: Update PaymentTableColumns

**File:** `src/features/payment/PaymentTableColumns.tsx`

Apply same pattern as Task 6.1 with appropriate visibility and priorities for payment fields.

---

## Phase 7: Update Components Using Table

### Task 7.1: Update CatalogList

**File:** `src/features/catalog/CatalogList.tsx`

Update to use new Table import and props:
- Import from `@/shared/ui/Table`
- Update any props that changed names
- Add `enableCardView={true}` if mobile card view is desired

### Task 7.2: Update OrderList

**File:** `src/features/order/OrderList.tsx`

Same updates as Task 7.1.

### Task 7.3: Update PaymentList

**File:** `src/features/payment/PaymentList.tsx`

Same updates as Task 7.1.

### Task 7.4: Update ListView

**File:** `src/shared/components/data-display/ListView.tsx`

Update the table mode rendering to pass through new Table props.

---

## Phase 8: Testing & Polish

### Task 8.1: Manual Testing Checklist

Test the following scenarios:
- [ ] Desktop view (lg+): All columns visible
- [ ] Tablet view (md): Desktop-only columns hidden
- [ ] Mobile view (sm): Tablet-only columns hidden
- [ ] Extra small view (xs): Card view displayed
- [ ] Column sorting works (asc/desc/clear cycle)
- [ ] Pagination works (page change, page size change)
- [ ] Row click navigates correctly
- [ ] Loading state shows skeleton
- [ ] Empty state shows message
- [ ] Sticky header scrolls correctly
- [ ] Sticky columns work with horizontal scroll
- [ ] Striped rows alternate correctly
- [ ] Hover states work

### Task 8.2: Responsive Testing

Test at these breakpoints:
- 375px (iPhone SE)
- 428px (iPhone 14 Pro Max)
- 768px (iPad Mini)
- 1024px (iPad Pro)
- 1280px (Desktop)
- 1536px (Large Desktop)

---

## File Structure Summary

After implementation, the new structure will be:

```
src/
├── hooks/
│   └── useBreakpoint.ts          # Already exists - reuse
│
└── shared/
    └── ui/
        ├── Table/                 # NEW FOLDER
        │   ├── index.ts
        │   ├── types.ts
        │   ├── constants.ts
        │   ├── Table.tsx
        │   ├── TableHeader.tsx
        │   ├── TableRow.tsx
        │   ├── TableCell.tsx
        │   ├── TableSkeleton.tsx
        │   ├── TableEmpty.tsx
        │   ├── TableCardView.tsx
        │   └── hooks/
        │       ├── useColumnVisibility.ts
        │       ├── useColumnWidth.ts
        │       ├── useTableSort.ts
        │       └── useTablePagination.ts
        │
        ├── Table.tsx              # DELETE after migration
        ├── Pagination.tsx         # Keep - reused
        ├── Skeleton.tsx           # Keep - reused
        ├── Icon.tsx               # Keep - reused
        ├── Badge.tsx              # Keep - reused
        └── TableActionMenu.tsx    # Keep - reused
```

---

## Implementation Order

Execute tasks in this order:

1. **Phase 1:** Types and constants (1.1, 1.2)
2. **Phase 2:** Hooks (2.1, 2.2, 2.3, 2.4)
3. **Phase 3:** Sub-components (3.1 through 3.6)
4. **Phase 4:** Main component (4.1, 4.2)
5. **Phase 5:** Update exports (5.1)
6. **Phase 6:** Migrate column definitions (6.1, 6.2, 6.3)
7. **Phase 7:** Update consuming components (7.1, 7.2, 7.3, 7.4)
8. **Phase 5.2:** Delete old Table.tsx (after all migrations complete)
9. **Phase 8:** Testing

---

## Notes for Implementer

1. **Import paths:** Use `@/` alias for imports (e.g., `@/shared/ui/Table`)

2. **Existing hook:** Reuse `src/hooks/useBreakpoint.ts` - it already exists and works

3. **Tailwind classes:** All styling uses Tailwind CSS utility classes

4. **TypeScript:** Maintain strict typing throughout. Use generics for data types.

5. **Backwards compatibility:** The new Table should accept the old `Column<T>` interface as a subset of `ColumnConfig<T>` to minimize migration friction.

6. **Performance:**
   - Use `useMemo` for expensive computations
   - Avoid re-renders by stabilizing callbacks with `useCallback`
   - Consider virtualization for large datasets (future enhancement)

7. **Accessibility:**
   - Use semantic elements where possible
   - Add `aria-sort` to sortable headers
   - Ensure keyboard navigation works
   - Provide `aria-label` for the table

8. **Testing:** Run `npm run lint` and `npm run build` after each phase to catch errors early
