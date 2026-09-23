import React, { useMemo } from 'react';

import { Icon } from '@/components/primitives/Icon';
import { cn } from '@/utils';
import { ICONS } from '@/config/icons';
import { inputBase } from '@/components/inputs/inputStyles';
import { CONTROL, PAGINATION_TYPE, RADIUS, TABLE_TYPE } from '@/components/theme/recipes';

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

  const pageNumbers = useMemo((): (number | string)[] => {
    const delta = 2;
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    let l: number | undefined;
    for (const i of range) {
      if (l !== undefined) {
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
  }, [currentPage, totalPages]);

  const getPageButtonClasses = (isActive: boolean) => {
    const base = `min-w-[26px] h-6 px-space-1-5 ${PAGINATION_TYPE.pageButtonBase} ${RADIUS.field} transition-colors ${CONTROL.focusVisibleTight}`;
    return isActive
      ? `${base} bg-brand text-on-brand`
      : `${base} text-text-primary border border-border-default bg-surface hover:border-border-hover hover:bg-surface-hover`;
  };

  const navButtonClass = `w-6 h-6 flex shrink-0 items-center justify-center ${RADIUS.field} border border-transparent text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary ${CONTROL.focusVisibleTight} disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-text-secondary`;

  return (
    <div className="flex min-h-[2.75rem] shrink-0 flex-wrap items-center justify-between gap-x-space-3 gap-y-space-2 border-t border-border-default bg-surface px-space-3 py-space-2">
      <div className="flex min-w-0 flex-wrap items-center gap-x-space-3 gap-y-space-1">
        <div className="flex items-center gap-space-1-5 whitespace-nowrap">
          <span className={`${TABLE_TYPE.caption} text-text-secondary`}>Rows per page</span>
          <select
            value={pageSize}
            onChange={e => onPageSizeChange(Number(e.target.value))}
            className={cn(
              inputBase,
              `h-6 w-12 min-h-0 cursor-pointer appearance-none pt-space-0-5 pb-0 pl-space-5 pr-space-5 text-center ${PAGINATION_TYPE.selectCompact}`
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
        <span className={`${TABLE_TYPE.caption} tabular-nums text-text-secondary`}>
          {startItem}–{endItem} of {totalItems}
        </span>
      </div>

      <div className="flex min-w-0 shrink-0 items-center gap-space-0-5">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={navButtonClass}
          aria-label="Previous page"
        >
          <Icon name={ICONS.actions.chevronLeft} className="h-3.5 w-3.5" />
        </button>

        <div className="mx-space-0-5 flex max-w-full items-center gap-space-0-5 overflow-x-auto">
          {pageNumbers.map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className={`min-w-[20px] text-center ${PAGINATION_TYPE.ellipsis}`} aria-hidden>
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
          <Icon name={ICONS.actions.chevronRight} className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
