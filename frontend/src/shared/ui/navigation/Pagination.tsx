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

/** Sentinel for "show all" rows; must match Table constants SHOW_ALL_PAGE_SIZE */
const SHOW_ALL = -1;

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}) => {
  const showAll = pageSize === SHOW_ALL;
  const totalPages = showAll ? 1 : Math.ceil(totalItems / pageSize) || 1;
  const startItem = showAll ? 1 : (currentPage - 1) * pageSize + 1;
  const endItem = showAll ? totalItems : Math.min(currentPage * pageSize, totalItems);

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
    const base =
      'min-w-[32px] h-8 px-2.5 text-xs font-medium rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-panel';
    return isActive
      ? `${base} bg-brand text-on-brand`
      : `${base} text-fg border border-stroke bg-panel hover:border-stroke-hover hover:bg-panel-hover`;
  };

  const navButtonClass =
    'w-8 h-8 flex items-center justify-center rounded-md border border-transparent text-fg-muted transition-colors hover:bg-panel-hover hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-panel disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-fg-muted';

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 border-t border-stroke bg-panel">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="text-xs text-fg-muted">Rows per page</span>
          <select
            value={pageSize}
            onChange={e => onPageSizeChange(Number(e.target.value))}
            className={cn(
              inputBase,
              'cursor-pointer h-8 w-14 pl-2.5 pr-7 text-center appearance-none'
            )}
            aria-label="Rows per page"
          >
            {pageSizeOptions.map(option => (
              <option key={option} value={option}>
                {option === SHOW_ALL ? 'All' : option}
              </option>
            ))}
          </select>
        </div>
        <span className="text-xs text-fg-muted tabular-nums">
          {startItem}–{endItem} of {totalItems}
        </span>
      </div>

      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={navButtonClass}
          aria-label="Previous page"
        >
          <Icon name={ICONS.actions.chevronLeft} className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-0.5 mx-0.5">
          {pageNumbers.map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="min-w-[24px] text-center text-xs text-fg-disabled" aria-hidden>
                  …
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onPageChange(page as number)}
                  className={getPageButtonClasses(page === currentPage)}
                  aria-label={page === currentPage ? `Page ${page}, current` : `Go to page ${page}`}
                  aria-current={page === currentPage ? 'page' : undefined}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={navButtonClass}
          aria-label="Next page"
        >
          <Icon name={ICONS.actions.chevronRight} className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
