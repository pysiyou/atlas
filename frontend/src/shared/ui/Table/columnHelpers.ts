/**
 * Column definition helpers for table configs.
 * Reduces duplication when building fullColumns / mediumColumns / compactColumns.
 */

import type { ColumnConfig, ColumnSizePreset } from './types';

export type CreateColumnOptions<T> = Omit<ColumnConfig<T>, 'key' | 'header'>;

/**
 * Create a column config with consistent key/header and optional props.
 * Use in table configs to avoid repeating key/header and to keep column IDs consistent.
 */
export function createColumn<T>(
  key: string,
  header: string,
  options: CreateColumnOptions<T> = {}
): ColumnConfig<T> {
  return { key, header, ...options };
}

/**
 * Build a subset of columns from a column map by key order.
 * Useful for mediumColumns/compactColumns that reuse the same render functions with different widths.
 */
export function pickColumns<T>(
  columnIds: string[],
  columnMap: Record<string, ColumnConfig<T>>,
  widthOverrides?: Partial<Record<string, ColumnSizePreset | string | number>>
): ColumnConfig<T>[] {
  return columnIds.map(id => {
    const col = columnMap[id];
    if (!col) return null;
    const width = widthOverrides?.[id] ?? col.width;
    return width !== undefined ? { ...col, width } : col;
  }).filter((c): c is ColumnConfig<T> => c !== null);
}
