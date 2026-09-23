/**
 * TableView — presentational table body (header, rows, skeleton, empty).
 */

import { type ReactNode } from 'react';
import { EmptyState, type IconName } from '@/components';
import { PANEL_EMPTY_STATE, DASHBOARD_EMPTY_STATE } from '@/components/display/emptyStatePresets';
import { DEFAULT_EMPTY_TITLE, DEFAULT_EMPTY_DESCRIPTION } from '@/utils/constants';
import type { ColumnConfig, SortConfig, TableVariant } from './types';
import { PANEL } from '@/components/theme/recipes';
import { DEFAULT_LOADING_ROWS } from './constants';
import { TableHeader, TableRow, TableSkeleton } from './TableViewParts';

export interface TableViewProps<T> {
  data: T[];
  columns: ColumnConfig<T>[];
  sort: SortConfig | null;
  onSort: (key: string) => void;
  variant?: TableVariant;
  striped?: boolean;
  stickyHeader?: boolean;
  maxHeight?: string;
  embedded?: boolean;
  showHeader?: boolean;
  onRowClick?: (item: T, index: number) => void;
  rowClassName?: (item: T, index: number) => string;
  getRowKey?: (item: T, index: number) => string | number;
  loading?: boolean;
  loadingRows?: number;
  emptyMessage?: ReactNode;
  emptyDescription?: string;
  emptyIcon?: string;
  emptyVariant?: 'compact' | 'dense';
  caption?: string;
  ariaLabel?: string;
  totalItems?: number;
}

/** Presentational table body — no sort/pagination logic */
export function TableView<T>({
  data,
  columns,
  sort,
  onSort,
  variant = 'default',
  striped = false,
  stickyHeader = false,
  maxHeight,
  embedded = false,
  showHeader = true,
  onRowClick,
  rowClassName,
  getRowKey,
  loading = false,
  loadingRows = DEFAULT_LOADING_ROWS,
  emptyMessage,
  emptyDescription,
  emptyIcon,
  emptyVariant = 'compact',
  caption,
  ariaLabel,
  totalItems,
}: TableViewProps<T>) {
  const containerClasses = embedded
    ? 'flex flex-col flex-1 min-h-0'
    : `${PANEL.raisedShadowSm} flex flex-col h-full`;

  if (loading) {
    return (
      <div className={containerClasses} role="table" aria-busy="true" aria-label={ariaLabel ?? 'Loading'}>
        {caption && <caption className="sr-only">{caption}</caption>}
        <div className="flex-1 min-h-0 overflow-auto" style={maxHeight ? { maxHeight } : undefined} role="rowgroup">
          {showHeader && (
            <TableHeader
              columns={columns}
              visibleColumns={columns}
              sort={null}
              onSort={() => {}}
              variant={variant}
              sticky={stickyHeader}
            />
          )}
          <TableSkeleton columns={columns} rows={loadingRows} variant={variant} />
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    const emptyPreset = emptyVariant === 'dense' ? DASHBOARD_EMPTY_STATE : PANEL_EMPTY_STATE;
    const emptyMinHeight = emptyVariant === 'dense' ? 'min-h-[9rem]' : 'min-h-[12rem]';
    const emptyContent =
      typeof emptyMessage === 'string' ? (
        <EmptyState
          {...emptyPreset}
          icon={(emptyIcon as IconName | undefined) ?? emptyPreset.icon}
          title={emptyMessage}
          description={emptyDescription ?? DEFAULT_EMPTY_DESCRIPTION}
        />
      ) : (
        (emptyMessage ?? (
          <EmptyState
            {...emptyPreset}
            icon={(emptyIcon as IconName | undefined) ?? emptyPreset.icon}
            title={DEFAULT_EMPTY_TITLE}
            description={emptyDescription ?? DEFAULT_EMPTY_DESCRIPTION}
          />
        ))
      );
    return (
      <div className={`${containerClasses} flex flex-1 items-center justify-center ${emptyMinHeight}`}>
        {emptyContent}
      </div>
    );
  }

  return (
    <div
      className={containerClasses}
      role="table"
      aria-label={ariaLabel}
      aria-rowcount={totalItems ?? data.length}
    >
      {caption && <caption className="sr-only">{caption}</caption>}
      <div className="flex-1 min-h-0 overflow-auto" style={maxHeight ? { maxHeight } : undefined} role="rowgroup">
        {showHeader && (
          <div role="rowgroup">
            <TableHeader
              columns={columns}
              visibleColumns={columns}
              sort={sort}
              onSort={onSort}
              variant={variant}
              sticky={stickyHeader}
            />
          </div>
        )}
        <TableRow<T>
          data={data}
          visibleColumns={columns}
          variant={variant}
          striped={striped}
          onRowClick={onRowClick}
          rowClassName={rowClassName}
          getRowKey={getRowKey}
        />
      </div>
    </div>
  );
}
