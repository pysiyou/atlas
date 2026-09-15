/**
 * ListView — page shell for data tables.
 */

import { type ReactNode } from 'react';
import { Table, type TableViewConfig } from '@/components/data-table';
import { DEFAULT_PAGE_SIZE_OPTIONS_WITH_ALL } from '@/components/data-table';
import { EmptyState, PageHeader } from '@/components';
import { ErrorAlert } from '@/components/loaders/ErrorAlert';
import { EMPTY_ICON_SEARCH, DEFAULT_EMPTY_DESCRIPTION_SEARCH } from '@/utils/constants';
import type { ListViewPaginationConfig, PaginationConfig, SortConfig } from '@/utils/table';

type TableDataItem = Record<string, unknown> | object;

export interface ListViewProps<T extends TableDataItem = TableDataItem> {
  items: T[];
  loading?: boolean;
  error?: { message: string; operation?: string } | null;
  viewConfig: TableViewConfig<T>;
  onRowClick?: (item: T, index?: number) => void;
  title?: string;
  subtitle?: string;
  headerActions?: ReactNode;
  filters?: ReactNode;
  emptyState?: ReactNode;
  onRetry?: () => void;
  onDismissError?: () => void;
  /** @deprecated Use pagination={{ mode: 'client' }} or pagination={{ mode: 'server', ... }} */
  pagination?: boolean | PaginationConfig | ListViewPaginationConfig;
  pageSize?: number;
  pageSizeOptions?: number[];
  defaultSort?: SortConfig;
  sort?: SortConfig | null;
  onSortChange?: (sort: SortConfig | null) => void;
  className?: string;
}

function renderDefaultEmptyState(title: string | undefined, emptyState: ReactNode | undefined) {
  return (
    emptyState || (
      <EmptyState
        icon={EMPTY_ICON_SEARCH}
        title={`No ${title || 'Items'} Found`}
        description={DEFAULT_EMPTY_DESCRIPTION_SEARCH}
      />
    )
  );
}

function normalizePagination(
  pagination: ListViewProps<TableDataItem>['pagination'],
  pageSize: number,
  pageSizeOptions: number[]
): boolean | PaginationConfig | ListViewPaginationConfig {
  if (pagination === false) return { mode: 'none' };
  if (pagination === true) return { mode: 'client', pageSize, pageSizeOptions };
  if (pagination === undefined) return { mode: 'client', pageSize, pageSizeOptions };
  return pagination;
}

export function ListView<T extends TableDataItem = TableDataItem>({
  items,
  loading = false,
  error = null,
  viewConfig,
  onRowClick,
  title,
  subtitle,
  headerActions,
  filters,
  emptyState,
  onRetry,
  onDismissError,
  pagination,
  pageSize = 20,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS_WITH_ALL,
  defaultSort,
  sort,
  onSortChange,
  className = '',
}: ListViewProps<T>) {
  const resolvedPagination = normalizePagination(pagination, pageSize, pageSizeOptions);

  return (
    <div className={`min-h-0 flex-1 flex flex-col p-2 gap-2 overflow-hidden ${className}`}>
      {(title != null || headerActions != null) && (
        <PageHeader variant="bar" title={title ?? ''} subtitle={subtitle} actions={headerActions} />
      )}
      {error && (
        <ErrorAlert
          error={error}
          onDismiss={onDismissError}
          onRetry={onRetry}
          className="shrink-0"
        />
      )}
      <div className="bg-surface rounded-lg border border-border-default shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden">
        {filters}
        <div className="flex-1 min-h-0 flex flex-col">
          <Table
            data={items}
            viewConfig={viewConfig}
            striped
            emptyMessage={renderDefaultEmptyState(title, emptyState)}
            loading={loading}
            pagination={resolvedPagination}
            initialPageSize={pageSize}
            pageSizeOptions={pageSizeOptions}
            defaultSort={defaultSort}
            sort={sort}
            onSortChange={onSortChange}
            onRowClick={onRowClick ? (item, index) => onRowClick(item, index) : undefined}
            embedded={true}
          />
        </div>
      </div>
    </div>
  );
}
