import type { ReactNode } from 'react';

/**
 * Breakpoint type matching Tailwind CSS breakpoints
 */
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

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
  /** Multi-view table configuration with separate column sets and card component */
  viewConfig: TableViewConfig<T>;

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
 * Props for loading skeleton
 */
export interface TableSkeletonProps {
  columns: ColumnConfig<unknown>[];
  rows: number;
  variant: TableVariant;
}

// ============================================
// Multi-View Table Configuration
// ============================================

/**
 * Props for custom card component used in mobile view
 */
export interface CardComponentProps<T> {
  item: T;
  index: number;
  onClick?: () => void;
}

/**
 * Multi-view table configuration
 * Defines separate views for different screen sizes
 */
export interface TableViewConfig<T> {
  /** Full table columns for extra large screens (xl+) */
  fullColumns: ColumnConfig<T>[];
  /** Medium table columns for large screens (lg) */
  mediumColumns: ColumnConfig<T>[];
  /** Compact table columns for medium screens (md) */
  compactColumns: ColumnConfig<T>[];
  /** Custom card component for small screens (sm and below) */
  CardComponent: React.ComponentType<CardComponentProps<T>>;
}
