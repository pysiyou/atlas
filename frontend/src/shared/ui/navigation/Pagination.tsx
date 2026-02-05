import React from 'react';
import { Icon } from '../display/Icon';
import { cn, ICONS } from '@/utils';
import { inputBase } from '../forms/inputStyles';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}) => {
  const totalPages = Math.ceil(totalItems / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers
  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    let l;
    for (const i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  const pageNumbers = getPageNumbers();

  const getPageButtonClasses = (isActive: boolean) => {
    const base = 'min-w-[32px] h-8 px-2 text-xs font-medium rounded transition-colors';
    return isActive
      ? `${base} bg-brand text-on-brand`
      : `${base} text-fg-muted hover:bg-panel-hover`;
  };

  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-stroke bg-panel">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-fg-muted">Rows per page:</span>
          <select
            value={pageSize}
            onChange={e => onPageSizeChange(Number(e.target.value))}
            className={cn(inputBase, 'cursor-pointer h-8 px-2 pr-8')}
          >
            {pageSizeOptions.map(option => (
              <option key={option} value={option} className="text-xs">
                {option}
              </option>
            ))}
          </select>
        </div>
        <span className="text-xs text-fg-muted">
          {startItem}-{endItem} of {totalItems}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="w-8 h-8 flex items-center justify-center rounded transition-colors text-fg-muted hover:bg-panel-hover disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon name={ICONS.actions.chevronLeft} className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-2 text-xs text-fg-disabled">...</span>
              ) : (
                <button
                  onClick={() => onPageChange(page as number)}
                  className={getPageButtonClasses(page === currentPage)}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded transition-colors text-fg-muted hover:bg-panel-hover disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon name={ICONS.actions.chevronRight} className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
