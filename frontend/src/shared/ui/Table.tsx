import React, { useState, useMemo, useEffect } from 'react';
import { Pagination } from './Pagination';
import { ArrowUp, ArrowDown } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  width?: number | string;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  isLoading?: boolean;
  pagination?: boolean;
  initialPageSize?: number;
  pageSizeOptions?: number[];
  defaultSortConfig?: { key: string; direction: "asc" | "desc" };
}

type SortConfig = { key: string; direction: "asc" | "desc" } | null;

export function Table<T extends Record<string, any>>({
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
}: TableProps<T> & { embedded?: boolean }) {
  const [sortConfig, setSortConfig] = useState<SortConfig>(defaultSortConfig || null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Reset page when filters change (data length changes significantly)
  useEffect(() => {
    // Basic heuristic: if current page is out of bounds, reset. 
    // Ideally, the parent should handle filter resets, but BaseTable does some internal management.
    const totalPages = Math.ceil(data.length / pageSize);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [data.length, pageSize, currentPage]);

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
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize, pagination]);

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
    return (
      <div className={`text-center py-12 ${!embedded ? 'border rounded bg-gray-50' : ''}`}>
        <p className="text-gray-500">{emptyMessage}</p>
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
                  {column.render ? column.render(item) : item[column.key]}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {pagination && (
        <Pagination
          currentPage={currentPage}
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
