/**
 * DataTable — responsive orchestrator with single sort → paginate pipeline.
 */

import { useMemo } from 'react';
import { useBreakpoint, isBreakpointAtMost, type Breakpoint } from '@/hooks/useBreakpoint';
import { useDataTable } from '@/hooks/useDataTable';
import { Pagination } from '@/components';
import { DEFAULT_LOADING_ROWS } from './constants';
import type { TableProps } from './types';
import { CardGridView } from './CardGridView';
import { TableView } from './TableView';

export function DataTable<T = Record<string, unknown>>({
  data,
  viewConfig,
  pagination = true,
  initialPageSize,
  pageSizeOptions,
  defaultSort,
  sort: controlledSort,
  onSortChange,
  breakpoint: overrideBreakpoint,
  variant = 'default',
  striped = false,
  stickyHeader = false,
  maxHeight,
  embedded = false,
  onRowClick,
  rowClassName,
  getRowKey,
  loading = false,
  loadingRows = DEFAULT_LOADING_ROWS,
  emptyMessage,
  emptyIcon,
  caption,
  ariaLabel,
}: TableProps<T>) {
  const detectedBreakpoint = useBreakpoint();
  const breakpoint: Breakpoint = overrideBreakpoint || detectedBreakpoint;

  const shouldShowCard = useMemo(() => isBreakpointAtMost(breakpoint, 'sm'), [breakpoint]);
  const shouldShowCompact = useMemo(() => breakpoint === 'md', [breakpoint]);
  const shouldShowMedium = useMemo(() => breakpoint === 'lg', [breakpoint]);

  const activeColumns = shouldShowCard
    ? viewConfig.fullColumns
    : shouldShowCompact
      ? viewConfig.compactColumns
      : shouldShowMedium
        ? viewConfig.mediumColumns
        : viewConfig.fullColumns;

  const {
    rows,
    sort,
    handleSort,
    currentPage,
    pageSize,
    totalItems,
    pageSizeOptions: effectivePageSizeOptions,
    setCurrentPage,
    setPageSize,
    paginationEnabled,
  } = useDataTable({
    data,
    columns: activeColumns,
    pagination,
    initialPageSize,
    pageSizeOptions,
    defaultSort,
    sort: controlledSort,
    onSortChange,
  });

  const wrapperClass = embedded
    ? 'flex flex-col h-full min-h-0'
    : 'bg-surface rounded-lg border border-border-default shadow-sm flex flex-col h-full min-h-0';

  const paginationFooter =
    paginationEnabled && !loading ? (
      <div className="shrink-0">
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={effectivePageSizeOptions}
        />
      </div>
    ) : null;

  if (shouldShowCard) {
    if (loading || rows.length === 0) {
      return (
        <div className={wrapperClass}>
          <TableView<T>
            data={[]}
            columns={viewConfig.fullColumns}
            sort={sort}
            onSort={handleSort}
            variant={variant}
            embedded={true}
            loading={loading}
            loadingRows={loadingRows}
            emptyMessage={emptyMessage}
            emptyIcon={emptyIcon}
            totalItems={totalItems}
          />
          {paginationFooter}
        </div>
      );
    }

    return (
      <div className={wrapperClass}>
        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          <CardGridView<T>
            data={rows}
            CardComponent={viewConfig.CardComponent}
            onRowClick={onRowClick}
            getRowKey={getRowKey}
          />
        </div>
        {paginationFooter}
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      <TableView<T>
        data={rows}
        columns={activeColumns}
        sort={sort}
        onSort={handleSort}
        variant={variant}
        striped={striped}
        stickyHeader={stickyHeader}
        maxHeight={maxHeight}
        embedded={true}
        onRowClick={onRowClick}
        rowClassName={rowClassName}
        getRowKey={getRowKey}
        loading={loading}
        loadingRows={loadingRows}
        emptyMessage={emptyMessage}
        emptyIcon={emptyIcon}
        caption={caption}
        ariaLabel={ariaLabel}
        totalItems={totalItems}
      />
      {paginationFooter}
    </div>
  );
}

export { CardGridView };
