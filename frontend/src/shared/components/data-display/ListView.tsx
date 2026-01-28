/**
 * ListView - Unified list view component
 *
 * Provides a consistent list/grid/table view with integrated filtering,
 * pagination, and state management. Used across all features.
 */

import { type ReactNode } from 'react';
import { Table, EmptyState } from '@/shared/ui';
import { LoadingState } from '../feedback/LoadingState';
import { ErrorAlert } from '../feedback/ErrorAlert';
import type { TableViewConfig } from '@/shared/ui/Table';
import { ICONS } from '@/utils/icon-mappings';

// TableDataItem accepts any object-like type (interfaces, types, classes)
// Using a union type to accept both Record types and regular object types
type TableDataItem = Record<string, unknown> | object;

export type ListViewMode = 'table' | 'grid' | 'list';

// Generic constraint accepts any object type without requiring index signatures
export interface ListViewProps<T extends TableDataItem = TableDataItem> {
  // Data
  /** Items to display */
  items: T[];
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: { message: string; operation?: string } | null;

  // Display mode
  /** View mode (table, grid, or list) */
  mode?: ListViewMode;

  // Table mode configuration
  /** Multi-view table configuration for table mode */
  viewConfig: TableViewConfig<T>;
  /** Row click handler for table mode */
  onRowClick?: (item: T, index?: number) => void;

  // Grid/List mode configuration
  /** Render function for card/list items */
  renderItem?: (item: T, index: number) => ReactNode;
  /** Number of columns for grid mode (1-4) */
  gridColumns?: 1 | 2 | 3 | 4;

  // Header
  /** Page title */
  title?: string;
  /** Page subtitle/description */
  subtitle?: string;
  /** Header action buttons */
  headerActions?: ReactNode;

  // Filters
  /** Filter components */
  filters?: ReactNode;

  // Empty/Error states
  /** Custom empty state */
  emptyState?: ReactNode;
  /** Error retry handler */
  onRetry?: () => void;
  /** Error dismiss handler */
  onDismissError?: () => void;

  // Pagination
  /** Enable pagination */
  pagination?: boolean;
  /** Initial page size */
  pageSize?: number;
  /** Page size options */
  pageSizeOptions?: number[];

  // Additional props
  /** Additional CSS classes */
  className?: string;
}

const GRID_COLUMN_CLASSES = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
} as const;

/**
 * ListView component
 *
 * @example
 * ```tsx
 * // Table mode
 * <ListView
 *   mode="table"
 *   items={patients}
 *   columns={patientColumns}
 *   onRowClick={handleRowClick}
 *   title="Patients"
 *   headerActions={<Button>New Patient</Button>}
 *   filters={<PatientFilters />}
 * />
 *
 * // Grid mode
 * <ListView
 *   mode="grid"
 *   items={samples}
 *   renderItem={(sample) => <SampleCard sample={sample} />}
 *   gridColumns={3}
 *   title="Sample Collection"
 * />
 * ```
 */
// High complexity is necessary for comprehensive list view component supporting table/grid/list modes with filtering, pagination, and error handling
// eslint-disable-next-line complexity
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
  pageSizeOptions = [10, 20, 50, 100],
  className = '',
}: ListViewProps<T>) {
  // Show loading state on initial load
  if (loading && items.length === 0) {
    return <LoadingState message={`Loading ${title?.toLowerCase() || 'items'}...`} fullScreen />;
  }

  return (
    <div className={`min-h-0 flex-1 flex flex-col p-4 gap-6 overflow-hidden ${className}`}>
      {/* Header */}
      {(title || headerActions) && (
        <div className="flex items-center justify-between shrink-0">
          {title && (
            <div>
              <h1 className="text-2xl font-semibold text-text-primary">{title}</h1>
              {subtitle && <p className="text-sm text-text-tertiary mt-1">{subtitle}</p>}
            </div>
          )}
          {headerActions}
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <ErrorAlert
          error={error}
          onDismiss={onDismissError}
          onRetry={onRetry}
          className="shrink-0"
        />
      )}

      {/* Main Content */}
      <div className="bg-surface rounded-lg border border-border shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Filters */}
        {filters}

        {/* Content Area - Table scrolls internally */}
        <div className="flex-1 min-h-0 flex flex-col">
          {mode === 'table' && viewConfig ? (
            <Table
              data={items}
              viewConfig={viewConfig}
              emptyMessage={
                emptyState || (
                  <EmptyState
                    icon={ICONS.actions.search}
                    title={`No ${title || 'Items'} Found`}
                    description="Try adjusting your search or filters to find what you're looking for."
                  />
                )
              }
              loading={loading}
              pagination={pagination}
              initialPageSize={pageSize}
              pageSizeOptions={pageSizeOptions}
              onRowClick={onRowClick ? (item, index) => onRowClick(item, index) : undefined}
              embedded={true}
            />
          ) : mode === 'grid' && renderItem ? (
            items.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                {emptyState || (
                  <EmptyState
                    icon={ICONS.actions.search}
                    title={`No ${title || 'Items'} Found`}
                    description="Try adjusting your search or filters to find what you're looking for."
                  />
                )}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <div className="p-6">
                  <div className={`grid ${GRID_COLUMN_CLASSES[gridColumns]} gap-4`}>
                    {items.map((item, index) => (
                      <div key={index}>{renderItem(item, index)}</div>
                    ))}
                  </div>
                </div>
              </div>
            )
          ) : mode === 'list' && renderItem ? (
            items.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                {emptyState || (
                  <EmptyState
                    icon={ICONS.actions.search}
                    title={`No ${title || 'Items'} Found`}
                    description="Try adjusting your search or filters to find what you're looking for."
                  />
                )}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                {items.map((item, index) => (
                  <div key={index}>{renderItem(item, index)}</div>
                ))}
              </div>
            )
          ) : (
            <div className="h-full flex items-center justify-center">
              <EmptyState
                icon={ICONS.actions.alertCircle}
                title="Configuration Error"
                description="Invalid ListView configuration. Please check your props."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
