import React, { useState, useMemo } from 'react';
import { Pagination } from './Pagination';
import { ArrowUp, ArrowDown } from 'lucide-react';

/**
 * Column definition for Table component
 * @template T - The type of data items in the table
 */
export interface Column<T> {
  /** Unique key for the column, used for sorting and accessing data */
  key: string;
  /** Header text to display */
  header: string;
  /** Custom render function for cell content */
  render?: (item: T) => React.ReactNode;
  /** Column width (number for pixels, string for CSS value) */
  width?: number | string;
  /** Whether the column is sortable */
  sortable?: boolean;
  /** Additional CSS classes for cells */
  className?: string;
  /** Additional CSS classes for header */
  headerClassName?: string;
}

/**
 * Props for the Table component
 * @template T - The type of data items in the table
 */
interface TableProps<T> {
  /** Array of data items to display */
  data: T[];
  /** Column definitions */
  columns: Column<T>[];
  /** Callback when a row is clicked */
  onRowClick?: (item: T) => void;
  /** Message or component to show when data is empty */
  emptyMessage?: React.ReactNode;
  /** Whether the table is in loading state */
  isLoading?: boolean;
  /** Whether to show pagination */
  pagination?: boolean;
  /** Initial page size */
  initialPageSize?: number;
  /** Available page size options */
  pageSizeOptions?: number[];
  /** Default sort configuration */
  defaultSortConfig?: { key: string; direction: "asc" | "desc" };
  /** Whether the table is embedded (affects styling) */
  embedded?: boolean;
}

type SortConfig = { key: string; direction: "asc" | "desc" } | null;

/**
 * Base type constraint for table data items
 * Items must be objects - using generic constraint instead of strict Record type
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TableDataItem = Record<string, any>;

/**
 * Generic Table Component
 * Displays data in a sortable, paginated table format
 * 
 * @template T - The type of data items, must extend TableDataItem
 * 
 * @example
 * ```tsx
 * interface User {
 *   id: string;
 *   name: string;
 *   email: string;
 * }
 * 
 * const columns: Column<User>[] = [
 *   { key: 'name', header: 'Name', sortable: true },
 *   { key: 'email', header: 'Email' },
 * ];
 * 
 * <Table data={users} columns={columns} onRowClick={(user) => navigate(`/users/${user.id}`)} />
 * ```
 */
export function Table<T extends TableDataItem>({
  data,
  columns,
  onRowClick,
  emptyMessage = 'No data available',
  isLoading = false,
  pagination = true,
  initialPageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  defaultSortConfig,
  embedded = false,
}: TableProps<T>) {
  const [sortConfig, setSortConfig] = useState<SortConfig>(defaultSortConfig || null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Calculate total pages for validation
  const totalPages = Math.ceil(data.length / pageSize);
  
  // Compute the effective current page - reset to 1 if out of bounds
  // This avoids setState in effect which causes cascading renders
  const effectiveCurrentPage = useMemo(() => {
    if (currentPage > totalPages && totalPages > 0) {
      return 1;
    }
    return currentPage;
  }, [currentPage, totalPages]);

  const sortedData = useMemo(() => {
    if (!sortConfig) return data;
    
    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      const comparison = aValue < bValue ? -1 : 1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [data, sortConfig]);

  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    const startIndex = (effectiveCurrentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, effectiveCurrentPage, pageSize, pagination]);

  const handleSort = (columnKey: string) => {
    setSortConfig((current) => {
      if (current?.key === columnKey) {
        return current.direction === 'asc' 
          ? { key: columnKey, direction: 'desc' }
          : null;
      }
      return { key: columnKey, direction: 'asc' };
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    if (typeof emptyMessage === 'string') {
      return (
        <div className={`text-center py-12 ${!embedded ? 'border rounded bg-gray-50' : ''}`}>
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      );
    }
    
    return (
      <div className={`h-full ${!embedded ? 'border rounded bg-gray-50' : ''}`}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-white ${!embedded ? 'rounded border border-gray-200' : ''}`}>
      <div className="flex-1 overflow-hidden flex flex-col min-h-[400px]">
        {/* Header */}
        <div className="flex border-b border-gray-200 bg-gray-50 font-medium text-xs text-gray-500 uppercase tracking-wider">
          {columns.map((column) => (
            <div
              key={column.key}
              className={`px-6 py-3 flex items-center gap-2 ${column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''} ${column.headerClassName || ''}`}
              style={{ width: typeof column.width === 'number' ? column.width : undefined, flex: typeof column.width === 'number' ? 'none' : 1 }}
              onClick={() => column.sortable && handleSort(column.key)}
            >
              <span>{column.header}</span>
              {sortConfig?.key === column.key && (
                sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
              )}
            </div>
          ))}
        </div>

        {/* Rows - Standard Rendering (Virtualization removed due to instability) */}
        <div className="flex-1 overflow-y-auto">
          {paginatedData.map((item, index) => (
            <div
              key={index}
              className={`flex items-center border-b border-gray-100 transition-colors ${onRowClick ? 'hover:bg-gray-50 cursor-pointer' : ''}`}
              onClick={() => onRowClick?.(item)}
              style={{ height: '60px' }} // Keep consistent row height
            >
              {columns.map((column) => (
                <div
                  key={column.key}
                  className={`px-6 py-2 text-sm text-gray-900 whitespace-nowrap ${column.className || 'overflow-hidden text-ellipsis'}`}
                  style={{ width: typeof column.width === 'number' ? column.width : undefined, flex: typeof column.width === 'number' ? 'none' : 1 }}
                >
                  {column.render ? column.render(item) : String(item[column.key] ?? '')}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {pagination && (
        <Pagination
          currentPage={effectiveCurrentPage}
          totalItems={sortedData.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newPageSize) => {
            setPageSize(newPageSize);
            setCurrentPage(1);
          }}
          pageSizeOptions={pageSizeOptions}
        />
      )}
    </div>
  );
}
