/**
 * Data table type definitions.
 */

import type { ReactNode } from 'react';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface ColumnWidth {
  base?: string | number;
  min?: string | number;
  max?: string | number;
  grow?: number;
  shrink?: number;
}

export type ColumnSizePreset = 'xs' | 'sm' | 'id' | 'md' | 'lg' | 'xl' | 'auto' | 'fill';
export type ColumnAlign = 'left' | 'center' | 'right';
export type StickyPosition = 'left' | 'right';

export interface ColumnConfig<T> {
  key: string;
  header: string;
  width?: ColumnWidth | ColumnSizePreset | string | number;
  render?: (item: T, index: number) => ReactNode;
  /** Value extractor for sorting when key does not map to a top-level field */
  accessor?: (item: T) => unknown;
  align?: ColumnAlign;
  truncate?: boolean;
  sortable?: boolean;
  sortFn?: (a: T, b: T) => number;
  sticky?: StickyPosition;
  className?: string;
  headerClassName?: string;
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export interface PaginationConfig {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

export type TableVariant = 'default' | 'compact' | 'comfortable';

export type DataTableMode = 'client' | 'server';

/** Unified pagination config for ListView / DataTable */
export type ListViewPaginationConfig =
  | { mode: 'none' }
  | { mode: 'client'; pageSize?: number; pageSizeOptions?: number[] }
  | (PaginationConfig & { mode: 'server' });

export interface TableProps<T> {
  data: T[];
  viewConfig: TableViewConfig<T>;
  pagination?: PaginationConfig | boolean | ListViewPaginationConfig;
  initialPageSize?: number;
  pageSizeOptions?: number[];
  defaultSort?: SortConfig;
  sort?: SortConfig | null;
  onSortChange?: (sort: SortConfig | null) => void;
  breakpoint?: Breakpoint;
  variant?: TableVariant;
  striped?: boolean;
  stickyHeader?: boolean;
  maxHeight?: string;
  embedded?: boolean;
  onRowClick?: (item: T, index: number) => void;
  rowClassName?: (item: T, index: number) => string;
  getRowKey?: (item: T, index: number) => string | number;
  loading?: boolean;
  loadingRows?: number;
  emptyMessage?: ReactNode;
  /** Subtitle when emptyMessage is a string */
  emptyDescription?: string;
  /** Passed to EmptyState when set */
  emptyIcon?: string;
  caption?: string;
  ariaLabel?: string;
}

export interface TableHeaderProps<T> {
  columns: ColumnConfig<T>[];
  visibleColumns: ColumnConfig<T>[];
  sort: SortConfig | null;
  onSort: (key: string) => void;
  variant: TableVariant;
  sticky?: boolean;
}

export interface TableBodyProps<T> {
  data: T[];
  visibleColumns: ColumnConfig<T>[];
  variant: TableVariant;
  striped?: boolean;
  onRowClick?: (item: T, index: number) => void;
  rowClassName?: (item: T, index: number) => string;
  getRowKey?: (item: T, index: number) => string | number;
}

export interface TableCellProps {
  column: ColumnConfig<unknown>;
  children: ReactNode;
  variant: TableVariant;
  isHeader?: boolean;
}

export interface TableSkeletonProps<T = unknown> {
  columns: ColumnConfig<T>[];
  rows: number;
  variant: TableVariant;
}

export interface CardComponentProps<T> {
  item: T;
  index: number;
  onClick?: () => void;
}

export interface TableViewConfig<T> {
  fullColumns: ColumnConfig<T>[];
  mediumColumns: ColumnConfig<T>[];
  compactColumns: ColumnConfig<T>[];
  CardComponent: React.ComponentType<CardComponentProps<T>>;
}

export type CreateColumnOptions<T> = Omit<ColumnConfig<T>, 'key' | 'header'>;

export type ColumnViewPreset = 'full' | 'medium' | 'compact';
