/**
 * ListView — page shell for data tables.
 */

import { type ReactNode } from 'react';
import { DataTable, type TableViewConfig } from '@/components/data-table';
import { DEFAULT_PAGE_SIZE_OPTIONS_WITH_ALL } from '@/components/data-table';
import { EmptyState, PageHeader } from '@/components';
import { ErrorAlert } from '@/components/loaders/ErrorAlert';
import { emptyTitle } from '@/components/display/emptyStateCopy';
import { DEFAULT_EMPTY_DESCRIPTION_SEARCH } from '@/utils/constants';
import type { ListViewPaginationConfig, PaginationConfig, SortConfig } from '@/utils/table';
import { PANEL, WORKSPACE } from '@/components/theme/recipes';

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
  /** Use {@link ListViewPaginationConfig} (`mode: 'client' | 'server' | 'none'`). */
  pagination?: PaginationConfig | ListViewPaginationConfig;
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
        title={emptyTitle(`matching ${(title || 'items').toLowerCase()}`)}
        description={DEFAULT_EMPTY_DESCRIPTION_SEARCH}
      />
    )
  );
}

function normalizePagination(
  pagination: ListViewProps<TableDataItem>['pagination'],
  pageSize: number,
  pageSizeOptions: number[]
): PaginationConfig | ListViewPaginationConfig {
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
    <div className={`${WORKSPACE.page} ${className}`.trim()}>
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
      <div className={`${PANEL.raisedShadowSm} flex flex-col flex-1 min-h-0 overflow-hidden`}>
        {filters}
        <div className="flex-1 min-h-0 flex flex-col">
          <DataTable
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
