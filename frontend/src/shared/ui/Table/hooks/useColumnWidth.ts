import { useMemo, type CSSProperties } from 'react';
import type { ColumnConfig, ColumnWidth, ColumnSizePreset } from '../types';
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
const resolveWidth = <T>(width: ColumnConfig<T>['width']): ColumnWidth => {
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
export const getColumnStyle = <T>(column: ColumnConfig<T>): CSSProperties => {
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
export const useColumnStyles = <T>(columns: ColumnConfig<T>[]): Map<string, CSSProperties> => {
  return useMemo(() => {
    const styleMap = new Map<string, CSSProperties>();

    columns.forEach(column => {
      styleMap.set(column.key, getColumnStyle(column));
    });

    return styleMap;
  }, [columns]);
};
