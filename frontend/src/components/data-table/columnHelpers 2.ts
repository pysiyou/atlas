/**
 * Column registry helpers and pagination normalization.
 */

import type { ReactNode } from 'react';
import type {
  ColumnConfig,
  ColumnSizePreset,
  ColumnViewPreset,
  CreateColumnOptions,
  ListViewPaginationConfig,
  PaginationConfig,
  TableViewConfig,
} from './types';

export function createColumn<T>(
  key: string,
  header: string,
  options: CreateColumnOptions<T> = {}
): ColumnConfig<T> {
  return { key, header, ...options };
}

/** Id column with standard width; pass a render that returns the id node (e.g. displayId.order). */
export function createIdColumn<T>(
  key: string,
  header: string,
  renderId: (item: T) => ReactNode,
  options: Omit<CreateColumnOptions<T>, 'render'> = {}
): ColumnConfig<T> {
  return createColumn(key, header, {
    ...options,
    width: options.width ?? 'id',
    render: item => renderId(item),
  });
}

/** Badge column; pass a render that returns the badge node (e.g. <Badge variant={item.status} />). */
export function createBadgeColumn<T>(
  key: string,
  header: string,
  renderBadge: (item: T) => ReactNode,
  options: Omit<CreateColumnOptions<T>, 'render'> = {}
): ColumnConfig<T> {
  return createColumn(key, header, {
    ...options,
    width: options.width ?? 'sm',
    render: item => renderBadge(item),
  });
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

/** Build responsive column sets from a single column registry */
export function buildViews<T>(
  columnMap: Record<string, ColumnConfig<T>>,
  views: Record<ColumnViewPreset, readonly string[]>,
  widthOverrides?: Partial<
    Record<ColumnViewPreset, Partial<Record<string, ColumnSizePreset | string | number>>>
  >
): Pick<TableViewConfig<T>, 'fullColumns' | 'mediumColumns' | 'compactColumns'> {
  return {
    fullColumns: pickColumns([...views.full], columnMap, widthOverrides?.full),
    mediumColumns: pickColumns([...views.medium], columnMap, widthOverrides?.medium),
    compactColumns: pickColumns([...views.compact], columnMap, widthOverrides?.compact),
  };
}

/** Normalize pagination prop to PaginationConfig | false | undefined */
export function resolvePaginationConfig(
  pagination: PaginationConfig | boolean | ListViewPaginationConfig | undefined
): PaginationConfig | undefined | false {
  if (pagination === false || pagination === undefined) {
    return pagination === false ? false : undefined;
  }
  if (pagination === true) return undefined;
  if (typeof pagination === 'object' && 'mode' in pagination) {
    if (pagination.mode === 'none') return false;
    if (pagination.mode === 'client') return undefined;
    const { mode: _mode, ...rest } = pagination;
    return rest;
  }
  return pagination;
}

export function isPaginationEnabled(
  pagination: PaginationConfig | boolean | ListViewPaginationConfig | undefined
): boolean {
  if (pagination === false) return false;
  if (pagination === undefined) return true;
  if (pagination === true) return true;
  if (typeof pagination === 'object' && 'mode' in pagination) {
    return pagination.mode !== 'none';
  }
  return true;
}
