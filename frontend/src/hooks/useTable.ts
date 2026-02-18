/**
 * Table hooks: pagination, sort, column width.
 * Extracted from components for max-depth-1 structure.
 */

import { useState, useMemo, useCallback, type CSSProperties } from 'react';
import type {
  PaginationConfig,
  SortConfig,
  ColumnConfig,
  ColumnWidth,
  ColumnSizePreset,
} from '@/utils/table';
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE_SIZE_OPTIONS,
  SHOW_ALL_PAGE_SIZE,
  SIZE_PRESETS,
} from '@/utils/table';

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

export const useTablePagination = <T = Record<string, unknown>>({
  data,
  externalPagination,
  enabled = true,
  initialPageSize = DEFAULT_PAGE_SIZE,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
}: UseTablePaginationOptions<T>): UseTablePaginationResult<T> => {
  const [internalPage, setInternalPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState(initialPageSize);
  const isExternallyControlled = !!externalPagination;
  const pageSize = isExternallyControlled ? externalPagination.pageSize : internalPageSize;
  const totalItems = isExternallyControlled ? externalPagination.totalItems : data.length;
  const showAll = !isExternallyControlled && pageSize === SHOW_ALL_PAGE_SIZE;
  const totalPages = showAll || pageSize <= 0 ? 1 : Math.ceil(totalItems / pageSize) || 1;
  const effectiveInternalPage = useMemo(() => {
    if (!isExternallyControlled && internalPage > totalPages && totalPages > 0) return 1;
    return internalPage;
  }, [internalPage, totalPages, isExternallyControlled]);
  const currentPage = isExternallyControlled
    ? externalPagination.currentPage
    : effectiveInternalPage;

  const setCurrentPage = useCallback(
    (page: number) => {
      if (isExternallyControlled) externalPagination.onPageChange(page);
      else setInternalPage(page);
    },
    [isExternallyControlled, externalPagination]
  );

  const setPageSize = useCallback(
    (size: number) => {
      if (isExternallyControlled) {
        externalPagination.onPageSizeChange?.(size);
      } else {
        setInternalPageSize(size);
        setInternalPage(1);
      }
    },
    [isExternallyControlled, externalPagination]
  );

  const paginatedData = useMemo(() => {
    if (!enabled || isExternallyControlled) return data;
    if (pageSize === SHOW_ALL_PAGE_SIZE) return data;
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

export const useTableSort = <T = Record<string, unknown>>({
  data,
  columns,
  defaultSort,
  controlledSort,
  onSortChange,
}: UseTableSortOptions<T>): UseTableSortResult<T> => {
  const [internalSort, setInternalSort] = useState<SortConfig | null>(defaultSort || null);
  const isControlled = controlledSort !== undefined;
  const sort = isControlled ? controlledSort : internalSort;

  const handleSort = useCallback(
    (columnKey: string) => {
      const column = columns.find(c => c.key === columnKey);
      if (!column?.sortable) return;
      const newSort: SortConfig | null = (() => {
        if (sort?.key !== columnKey) return { key: columnKey, direction: 'asc' };
        if (sort.direction === 'asc') return { key: columnKey, direction: 'desc' };
        return null;
      })();
      if (isControlled) onSortChange?.(newSort);
      else setInternalSort(newSort);
    },
    [sort, columns, isControlled, onSortChange]
  );

  const sortedData = useMemo(() => {
    if (!sort) return data;
    const column = columns.find(c => c.key === sort.key);
    return [...data].sort((a, b) => {
      if (column?.sortFn) {
        const result = column.sortFn(a, b);
        return sort.direction === 'asc' ? result : -result;
      }
      const aValue = (a as Record<string, unknown>)[sort.key];
      const bValue = (b as Record<string, unknown>)[sort.key];
      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sort.direction === 'asc' ? comparison : -comparison;
      }
      const comparison = aValue < bValue ? -1 : 1;
      return sort.direction === 'asc' ? comparison : -comparison;
    });
  }, [data, sort, columns]);

  return { sortedData, sort, handleSort };
};

const toCssValue = (value: string | number | undefined): string | undefined => {
  if (value === undefined) return undefined;
  if (typeof value === 'number') return `${value}px`;
  return value;
};

const resolveWidth = <T>(width: ColumnConfig<T>['width']): ColumnWidth => {
  if (!width) return { grow: 1, shrink: 1, min: 100 };
  if (typeof width === 'string') {
    if (width in SIZE_PRESETS) return SIZE_PRESETS[width as ColumnSizePreset];
    return { base: width, grow: 0, shrink: 0 };
  }
  if (typeof width === 'number') return { base: width, grow: 0, shrink: 0 };
  return width;
};

export const getColumnStyle = <T>(column: ColumnConfig<T>): CSSProperties => {
  const width = resolveWidth(column.width);
  const style: CSSProperties = {};
  if (width.base !== undefined) style.width = toCssValue(width.base);
  if (width.min !== undefined) style.minWidth = toCssValue(width.min);
  if (width.max !== undefined) style.maxWidth = toCssValue(width.max);
  style.flexGrow = width.grow ?? 0;
  style.flexShrink = width.shrink ?? 0;
  if (width.base === undefined && (width.grow ?? 0) > 0) style.flexBasis = 'auto';
  else if (width.base !== undefined) style.flexBasis = toCssValue(width.base);
  return style;
};

export const useColumnStyles = <T>(
  columns: ColumnConfig<T>[]
): Map<string, CSSProperties> => {
  return useMemo(() => {
    const styleMap = new Map<string, CSSProperties>();
    columns.forEach(column => styleMap.set(column.key, getColumnStyle(column)));
    return styleMap;
  }, [columns]);
};
