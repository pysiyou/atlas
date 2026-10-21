/**
 * TableView — presentational table body (header, virtualized rows, skeleton, empty).
 */

import { type ReactNode, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { EmptyState } from '@/components/display';
import type { IconName } from '@/components/primitives';
import { PANEL_EMPTY_STATE, DENSE_EMPTY_STATE } from '@/components/display/emptyStatePresets';
import { DEFAULT_EMPTY_TITLE, DEFAULT_EMPTY_DESCRIPTION } from '@/utils/constants';
import type { ColumnConfig, SortConfig, TableVariant } from './types';
import { PANEL } from '@/theme/recipes';
import { DEFAULT_LOADING_ROWS, ROW_HEIGHTS } from './constants';
import { TableHeader, TableDataRow, TableSkeleton } from './TableViewParts';
import { useGridTemplateColumns } from '@/hooks/useTable';

const TABLE_ROW_OVERSCAN = 8;

function resolveTableContainerClasses(embedded: boolean): string {
  return embedded ? 'flex flex-col flex-1 min-h-0' : `${PANEL.raisedShadowSm} flex flex-col h-full`;
}

function resolveEmptyMinHeight(embedded: boolean, emptyVariant: 'compact' | 'dense'): string {
  if (embedded) return 'min-h-0';
  return emptyVariant === 'dense' ? 'min-h-[9rem]' : 'min-h-[12rem]';
}

/**
 * Visually hidden table name. A real `<caption>` is invalid inside `div role="table"`.
 */
function TableAccessibleName({ caption }: { caption?: string }) {
  if (!caption) return null;
  return <span className="sr-only">{caption}</span>;
}

function TableViewLoading<T>({
  containerClasses,
  caption,
  ariaLabel,
  maxHeight,
  showHeader,
  columns,
  variant,
  loadingRows,
}: {
  containerClasses: string;
  caption?: string;
  ariaLabel?: string;
  maxHeight?: string;
  showHeader: boolean;
  columns: ColumnConfig<T>[];
  variant: TableVariant;
  loadingRows: number;
}) {
  return (
    <div
      className={containerClasses}
      role="table"
      aria-busy="true"
      aria-label={ariaLabel ?? caption ?? 'Loading'}
    >
      <TableAccessibleName caption={caption} />
      {showHeader && (
        <div className="shrink-0" role="rowgroup">
          <TableHeader
            columns={columns}
            visibleColumns={columns}
            sort={null}
            onSort={() => {}}
            variant={variant}
          />
        </div>
      )}
      <div
        className="flex-1 min-h-0 overflow-auto"
        style={maxHeight ? { maxHeight } : undefined}
        role="rowgroup"
      >
        <TableSkeleton columns={columns} rows={loadingRows} variant={variant} />
      </div>
    </div>
  );
}

function TableViewEmpty({
  containerClasses,
  emptyMinHeight,
  emptyContent,
}: {
  containerClasses: string;
  emptyMinHeight: string;
  emptyContent: ReactNode;
}) {
  return (
    <div
      className={`${containerClasses} flex flex-1 items-center justify-center ${emptyMinHeight}`}
    >
      {emptyContent}
    </div>
  );
}

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

/**
 * Presentational table body. Rows are virtualized against the overflow scroller;
 * the header stays pinned outside that region.
 */
export function TableView<T>({
  data,
  columns,
  sort,
  onSort,
  variant = 'default',
  striped = false,
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
  const containerClasses = resolveTableContainerClasses(embedded);
  const scrollParentRef = useRef<HTMLDivElement>(null);
  const gridTemplateColumns = useGridTemplateColumns(columns);
  const rowHeight = ROW_HEIGHTS[variant];
  const hasRows = data.length > 0;

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: () => rowHeight,
    overscan: TABLE_ROW_OVERSCAN,
    enabled: hasRows,
  });

  const showSkeleton = loading && !hasRows;

  if (showSkeleton) {
    return (
      <TableViewLoading
        containerClasses={containerClasses}
        caption={caption}
        ariaLabel={ariaLabel}
        maxHeight={maxHeight}
        showHeader={showHeader}
        columns={columns}
        variant={variant}
        loadingRows={loadingRows}
      />
    );
  }

  if (data.length === 0) {
    const emptyPreset = emptyVariant === 'dense' ? DENSE_EMPTY_STATE : PANEL_EMPTY_STATE;
    const emptyMinHeight = resolveEmptyMinHeight(embedded, emptyVariant);
    const resolvedIcon = (emptyIcon as IconName | undefined) ?? emptyPreset.icon;
    const emptyContent =
      typeof emptyMessage === 'string' ? (
        <EmptyState
          {...emptyPreset}
          icon={resolvedIcon}
          title={emptyMessage}
          description={emptyDescription ?? DEFAULT_EMPTY_DESCRIPTION}
        />
      ) : (
        (emptyMessage ?? (
          <EmptyState
            {...emptyPreset}
            icon={resolvedIcon}
            title={DEFAULT_EMPTY_TITLE}
            description={emptyDescription ?? DEFAULT_EMPTY_DESCRIPTION}
          />
        ))
      );
    return (
      <TableViewEmpty
        containerClasses={containerClasses}
        emptyMinHeight={emptyMinHeight}
        emptyContent={emptyContent}
      />
    );
  }

  const headerRowCount = showHeader ? 1 : 0;

  return (
    <div
      className={containerClasses}
      role="table"
      aria-label={ariaLabel ?? caption}
      aria-rowcount={totalItems ?? data.length}
      aria-busy={loading || undefined}
    >
      <TableAccessibleName caption={caption} />
      {showHeader && (
        <div className="shrink-0" role="rowgroup">
          <TableHeader
            columns={columns}
            visibleColumns={columns}
            sort={sort}
            onSort={onSort}
            variant={variant}
          />
        </div>
      )}
      <div
        ref={scrollParentRef}
        className="flex-1 min-h-0 overflow-auto"
        style={maxHeight ? { maxHeight } : undefined}
        role="rowgroup"
      >
        <div
          className="relative w-full"
          style={{ height: virtualizer.getTotalSize() }}
        >
          {virtualizer.getVirtualItems().map(virtualRow => {
            const item = data[virtualRow.index];
            if (item === undefined) return null;
            const rowKey = getRowKey ? getRowKey(item, virtualRow.index) : virtualRow.index;
            return (
              <div
                key={rowKey}
                className="absolute left-0 top-0 w-full"
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <TableDataRow
                  item={item}
                  index={virtualRow.index}
                  visibleColumns={columns}
                  variant={variant}
                  striped={striped}
                  onRowClick={onRowClick}
                  rowClassName={rowClassName}
                  gridTemplateColumns={gridTemplateColumns}
                  ariaRowIndex={virtualRow.index + 1 + headerRowCount}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
