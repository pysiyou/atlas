import { useMemo } from 'react';
import type { ColumnConfig, Breakpoint, ResponsiveVisibility } from '../types';
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
const isColumnVisible = <T,>(
  column: ColumnConfig<T>,
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
