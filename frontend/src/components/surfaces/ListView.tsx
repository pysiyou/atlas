/**
 * ListView — unified list/table/grid view (max-depth-1).
 */

import { type ReactNode } from 'react';
import { Table, type TableViewConfig } from '@/components/data-table';
import { DEFAULT_PAGE_SIZE_OPTIONS_WITH_ALL } from '@/components/data-table';
import { EmptyState, PageHeaderBar, SkeletonCard, SkeletonList } from '@/components';
import { ErrorAlert } from '@/components/loaders/ErrorAlert';
import { ICONS } from '@/utils';
import { DEFAULT_EMPTY_DESCRIPTION_SEARCH, EMPTY_ICON_SEARCH } from '@/utils/constants';

type TableDataItem = Record<string, unknown> | object;

export type ListViewMode = 'table' | 'grid' | 'list';

export interface ListViewProps<T extends TableDataItem = TableDataItem> {
  items: T[];
  loading?: boolean;
  error?: { message: string; operation?: string } | null;
  mode?: ListViewMode;
  viewConfig: TableViewConfig<T>;
  onRowClick?: (item: T, index?: number) => void;
  renderItem?: (item: T, index: number) => ReactNode;
  gridColumns?: 1 | 2 | 3 | 4;
  title?: string;
  subtitle?: string;
  headerActions?: ReactNode;
  filters?: ReactNode;
  emptyState?: ReactNode;
  onRetry?: () => void;
  onDismissError?: () => void;
  pagination?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  className?: string;
}

const GRID_COLUMN_CLASSES = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
} as const;

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

function renderConfigError() {
  return (
    <div className="h-full flex items-center justify-center">
      <EmptyState
        icon={ICONS.actions.alertCircle}
        title="Configuration Error"
        description="Invalid ListView configuration. Please check your props."
      />
    </div>
  );
}

function renderTableContent<T extends TableDataItem>({
  items,
  viewConfig,
  emptyState,
  title,
  loading,
  pagination,
  pageSize,
  pageSizeOptions,
  onRowClick,
}: {
  items: T[];
  viewConfig: TableViewConfig<T>;
  emptyState: ReactNode | undefined;
  title: string | undefined;
  loading: boolean;
  pagination: boolean;
  pageSize: number;
  pageSizeOptions: number[];
  onRowClick: ((item: T, index?: number) => void) | undefined;
}) {
  return (
    <Table
      data={items}
      viewConfig={viewConfig}
      striped
      emptyMessage={renderDefaultEmptyState(title, emptyState)}
      loading={loading}
      pagination={pagination}
      initialPageSize={pageSize}
      pageSizeOptions={pageSizeOptions}
      onRowClick={onRowClick ? (item, index) => onRowClick(item, index) : undefined}
      embedded={true}
    />
  );
}

function renderGridContent<T extends TableDataItem>({
  items,
  loading,
  renderItem,
  gridColumns,
  emptyState,
  title,
}: {
  items: T[];
  loading: boolean;
  renderItem: (item: T, index: number) => ReactNode;
  gridColumns: 1 | 2 | 3 | 4;
  emptyState: ReactNode | undefined;
  title: string | undefined;
}) {
  if (loading && items.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className={`grid ${GRID_COLUMN_CLASSES[gridColumns ?? 2]} gap-4`}>
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        {renderDefaultEmptyState(title, emptyState)}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6">
        <div className={`grid ${GRID_COLUMN_CLASSES[gridColumns]} gap-4`}>
          {items.map((item, index) => (
            <div key={index}>{renderItem(item, index)}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function renderListContent<T extends TableDataItem>({
  items,
  loading,
  renderItem,
  emptyState,
  title,
}: {
  items: T[];
  loading: boolean;
  renderItem: (item: T, index: number) => ReactNode;
  emptyState: ReactNode | undefined;
  title: string | undefined;
}) {
  if (loading && items.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <SkeletonList rows={5} />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        {renderDefaultEmptyState(title, emptyState)}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {items.map((item, index) => (
        <div key={index}>{renderItem(item, index)}</div>
      ))}
    </div>
  );
}

function renderListViewBody<T extends TableDataItem>({
  mode,
  items,
  loading,
  viewConfig,
  renderItem,
  gridColumns,
  emptyState,
  title,
  pagination,
  pageSize,
  pageSizeOptions,
  onRowClick,
}: {
  mode: ListViewMode;
  items: T[];
  loading: boolean;
  viewConfig: TableViewConfig<T>;
  renderItem: ((item: T, index: number) => ReactNode) | undefined;
  gridColumns: 1 | 2 | 3 | 4;
  emptyState: ReactNode | undefined;
  title: string | undefined;
  pagination: boolean;
  pageSize: number;
  pageSizeOptions: number[];
  onRowClick: ((item: T, index?: number) => void) | undefined;
}) {
  if (mode === 'table' && viewConfig) {
    return renderTableContent({
      items,
      viewConfig,
      emptyState,
      title,
      loading,
      pagination,
      pageSize,
      pageSizeOptions,
      onRowClick,
    });
  }

  if (mode === 'grid' && renderItem) {
    return renderGridContent({
      items,
      loading,
      renderItem,
      gridColumns,
      emptyState,
      title,
    });
  }

  if (mode === 'list' && renderItem) {
    return renderListContent({
      items,
      loading,
      renderItem,
      emptyState,
      title,
    });
  }

  return renderConfigError();
}

export function ListView<T extends TableDataItem = TableDataItem>({
  items,
  loading = false,
  error = null,
  mode = 'table',
  viewConfig,
  onRowClick,
  renderItem,
  gridColumns = 3,
  title,
  subtitle,
  headerActions,
  filters,
  emptyState,
  onRetry,
  onDismissError,
  pagination = true,
  pageSize = 20,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS_WITH_ALL,
  className = '',
}: ListViewProps<T>) {
  return (
    <div className={`min-h-0 flex-1 flex flex-col p-2 gap-2 overflow-hidden ${className}`}>
      {(title != null || headerActions != null) && (
        <PageHeaderBar title={title ?? ''} subtitle={subtitle}>
          {headerActions}
        </PageHeaderBar>
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
          {renderListViewBody({
            mode,
            items,
            loading,
            viewConfig,
            renderItem,
            gridColumns,
            emptyState,
            title,
            pagination,
            pageSize,
            pageSizeOptions,
            onRowClick,
          })}
        </div>
      </div>
    </div>
  );
}
