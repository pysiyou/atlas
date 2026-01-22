import { useState, useMemo, useCallback } from 'react';
import type { SortConfig, ColumnConfig } from '../types';

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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useTableSort = <T = any>({
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const aValue = (a as any)[sort.key];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bValue = (b as any)[sort.key];

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
