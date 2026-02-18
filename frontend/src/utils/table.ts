/**
 * Table utilities: types, constants, column helpers.
 * Extracted from components for max-depth-1 structure.
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

export type ColumnSizePreset = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'auto' | 'fill';
export type ColumnAlign = 'left' | 'center' | 'right';
export type StickyPosition = 'left' | 'right';

export interface ColumnConfig<T> {
  key: string;
  header: string;
  width?: ColumnWidth | ColumnSizePreset | string | number;
  render?: (item: T, index: number) => ReactNode;
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

export interface TableProps<T> {
  data: T[];
  viewConfig: TableViewConfig<T>;
  pagination?: PaginationConfig | boolean;
  initialPageSize?: number;
  pageSizeOptions?: number[];
  defaultSort?: SortConfig;
  sort?: SortConfig | null;
  onSortChange?: (sort: SortConfig | null) => void;
  breakpoint?: Breakpoint;
  variant?: TableVariant;
  striped?: boolean;
  bordered?: boolean;
  stickyHeader?: boolean;
  maxHeight?: string;
  embedded?: boolean;
  onRowClick?: (item: T, index: number) => void;
  rowClassName?: (item: T, index: number) => string;
  getRowKey?: (item: T, index: number) => string | number;
  loading?: boolean;
  loadingRows?: number;
  emptyMessage?: ReactNode;
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

export const SIZE_PRESETS: Record<string, ColumnWidth> = {
  xs: { base: 60, min: 50, grow: 0, shrink: 0 },
  sm: { base: 100, min: 80, grow: 0, shrink: 0 },
  md: { base: 120, min: 100, grow: 0, shrink: 0 },
  lg: { base: 160, min: 140, grow: 0, shrink: 0 },
  xl: { base: 200, min: 160, grow: 2, shrink: 1 },
  auto: { grow: 0, shrink: 0 },
  fill: { base: 0, min: 200, grow: 1, shrink: 1 },
};

export const ROW_HEIGHTS: Record<TableVariant, number> = {
  compact: 40,
  default: 48,
  comfortable: 56,
};

export const CELL_PADDING: Record<TableVariant, string> = {
  compact: 'px-4 py-2',
  default: 'px-6 py-3',
  comfortable: 'px-6 py-4',
};

export const HEADER_PADDING: Record<TableVariant, string> = {
  compact: 'px-4 py-2',
  default: 'px-6 py-3',
  comfortable: 'px-6 py-4',
};

export const TEXT_SIZE: Record<TableVariant, string> = {
  compact: 'text-xs',
  default: 'text-sm',
  comfortable: 'text-sm',
};

export const DEFAULT_LOADING_ROWS = 5;
export const SHOW_ALL_PAGE_SIZE = -1;
export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
export const DEFAULT_PAGE_SIZE_OPTIONS_WITH_ALL = [
  ...DEFAULT_PAGE_SIZE_OPTIONS,
  SHOW_ALL_PAGE_SIZE,
];

export type CreateColumnOptions<T> = Omit<ColumnConfig<T>, 'key' | 'header'>;

export function createColumn<T>(
  key: string,
  header: string,
  options: CreateColumnOptions<T> = {}
): ColumnConfig<T> {
  return { key, header, ...options };
}

export function pickColumns<T>(
  columnIds: string[],
  columnMap: Record<string, ColumnConfig<T>>,
  widthOverrides?: Partial<Record<string, ColumnSizePreset | string | number>>
): ColumnConfig<T>[] {
  return columnIds
    .map(id => {
      const col = columnMap[id];
      if (!col) return null;
      const width = widthOverrides?.[id] ?? col.width;
      return width !== undefined ? { ...col, width } : col;
    })
    .filter((c): c is ColumnConfig<T> => c !== null);
}
