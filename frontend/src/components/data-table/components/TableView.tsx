import { type ReactNode } from 'react';
import { EmptyState } from '@/components';
import type { IconName } from '@/components';
import { ICONS } from '@/config/icons';
import { DEFAULT_EMPTY_TITLE, DEFAULT_EMPTY_DESCRIPTION } from '@/utils/constants';
import type { ColumnConfig, SortConfig, TableVariant } from '../types';
import { DEFAULT_LOADING_ROWS } from '../constants';
import { TableHeader } from './TableHeader';
import { TableRow } from './TableRow';
import { TableSkeleton } from './TableSkeleton';

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
  emptyIcon?: string;
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
  emptyIcon,
  caption,
  ariaLabel,
  totalItems,
}: TableViewProps<T>) {
  const containerClasses = embedded
    ? 'flex flex-col flex-1 min-h-0'
    : 'bg-surface rounded-lg border border-border-default shadow-sm flex flex-col h-full';

  if (loading) {
    return (
      <div className={containerClasses} role="table" aria-busy="true" aria-label={ariaLabel ?? 'Loading'}>
        {caption && <caption className="sr-only">{caption}</caption>}
        <div className="flex-1 overflow-auto" style={maxHeight ? { maxHeight } : undefined}>
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
    const emptyContent =
      typeof emptyMessage === 'string' ? (
        <EmptyState
          icon={(emptyIcon || ICONS.dataFields.document) as IconName}
          title={emptyMessage}
          description={DEFAULT_EMPTY_DESCRIPTION}
        />
      ) : (
        (emptyMessage ?? (
          <EmptyState
            icon={(emptyIcon || ICONS.dataFields.document) as IconName}
            title={DEFAULT_EMPTY_TITLE}
            description={DEFAULT_EMPTY_DESCRIPTION}
          />
        ))
      );
    return <div className={containerClasses}>{emptyContent}</div>;
  }

  return (
    <div
      className={containerClasses}
      role="table"
      aria-label={ariaLabel}
      aria-rowcount={totalItems ?? data.length}
    >
      {caption && <caption className="sr-only">{caption}</caption>}
      <div className="flex-1 overflow-auto" style={maxHeight ? { maxHeight } : undefined}>
        {showHeader && (
          <TableHeader
            columns={columns}
            visibleColumns={columns}
            sort={sort}
            onSort={onSort}
            variant={variant}
            sticky={stickyHeader}
          />
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
