import React from 'react';
import { Icon } from './Icon';
import { cn, ICONS } from '@/utils';
import { inputBase } from './inputStyles';

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
      'min-w-[26px] h-6 px-1.5 text-[11px] font-normal rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 focus-visible:ring-offset-surface';
    return isActive
      ? `${base} bg-brand text-on-brand`
      : `${base} text-text-primary border border-border-default bg-surface hover:border-border-hover hover:bg-surface-hover`;
  };

  const navButtonClass =
    'w-6 h-6 flex items-center justify-center rounded border border-transparent text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 focus-visible:ring-offset-surface disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-text-secondary';

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 border-t border-border-default bg-surface">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="text-[11px] text-text-secondary">Rows per page</span>
          <select
            value={pageSize}
            onChange={e => onPageSizeChange(Number(e.target.value))}
            className={cn(
              inputBase,
              'cursor-pointer h-6 w-12 min-h-0 pt-0.5 pb-0 leading-5 pl-5 pr-5 text-center text-xxs appearance-none'
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
        <span className="text-[11px] text-text-secondary tabular-nums">
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
          <Icon name={ICONS.actions.chevronLeft} className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-0.5 mx-0.5">
          {pageNumbers.map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="min-w-[20px] text-center text-[11px] text-text-disabled" aria-hidden>
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
          <Icon name={ICONS.actions.chevronRight} className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
