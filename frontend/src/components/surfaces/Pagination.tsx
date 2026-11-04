import React, { useMemo, useCallback } from 'react';

import { Icon } from '@/components/primitives/Icon';
import { SHOW_ALL_PAGE_SIZE } from '@/components/data-table/constants';
import { cn } from '@/utils';
import { IconKeys } from '@/config/icons';
import { CONTROL, PAGINATION_TYPE, RADIUS, TABLE_TYPE } from '@/theme/recipes';

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

function clampPage(page: number, totalPages: number): number {
  if (totalPages < 1) return 1;
  return Math.min(Math.max(1, page), totalPages);
}

function itemRange(totalItems: number, pageSize: number, currentPage: number, showAll: boolean) {
  if (totalItems <= 0) {
    return { start: 0, end: 0 };
  }
  if (showAll) {
    return { start: 1, end: totalItems };
  }
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);
  return { start, end };
}

function buildPageNumbers(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 1) return [1];

  const delta = 2;
  const range: number[] = [];

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
      range.push(i);
    }
  }

  const out: (number | 'ellipsis')[] = [];
  let prev: number | undefined;

  for (const page of range) {
    if (prev !== undefined) {
      if (page - prev === 2) {
        out.push(prev + 1);
      } else if (page - prev !== 1) {
        out.push('ellipsis');
      }
    }
    out.push(page);
    prev = page;
  }

  return out;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}) => {
  const showAll = pageSize === SHOW_ALL_PAGE_SIZE;
  const totalPages = showAll ? 1 : Math.max(1, Math.ceil(totalItems / pageSize) || 1);
  const activePage = clampPage(currentPage, totalPages);
  const { start, end } = itemRange(totalItems, pageSize, activePage, showAll);

  const selectOptions = useMemo(() => {
    if (pageSizeOptions.includes(pageSize)) return pageSizeOptions;
    return [...pageSizeOptions, pageSize].sort((a, b) => {
      if (a === SHOW_ALL_PAGE_SIZE) return 1;
      if (b === SHOW_ALL_PAGE_SIZE) return -1;
      return a - b;
    });
  }, [pageSize, pageSizeOptions]);

  const pageNumbers = useMemo(
    () => buildPageNumbers(activePage, totalPages),
    [activePage, totalPages]
  );

  const goToPage = useCallback(
    (page: number) => {
      onPageChange(clampPage(page, totalPages));
    },
    [onPageChange, totalPages]
  );

  const pageButtonClass = (page: number, isActive: boolean) =>
    cn(
      `inline-flex shrink-0 cursor-pointer items-center justify-center leading-none tabular-nums ${PAGINATION_TYPE.pageButtonBase} ${RADIUS.field} transition-colors ${CONTROL.focusVisibleTight}`,
      page < 10 ? 'h-6 w-6' : 'h-6 min-w-6 px-space-1',
      isActive
        ? 'bg-brand text-on-brand'
        : 'text-text-primary border border-border-default bg-surface hover:border-border-hover hover:bg-surface-hover'
    );

  const navButtonClass = cn(
    'w-6 h-6 flex shrink-0 cursor-pointer items-center justify-center',
    RADIUS.field,
    'border border-transparent text-text-secondary transition-colors',
    'hover:bg-surface-hover hover:text-text-primary',
    CONTROL.focusVisibleTight,
    'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-text-secondary'
  );

  const showPageList = totalPages > 1;

  return (
    <nav
      className="flex min-h-[2.75rem] shrink-0 flex-wrap items-center justify-between gap-x-space-3 gap-y-space-2 border-t border-border-default bg-surface px-space-3 py-space-2"
      aria-label="Table pagination"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-x-space-3 gap-y-space-1">
        <label className="flex items-center gap-space-1-5 whitespace-nowrap">
          <span className={`${TABLE_TYPE.caption} text-text-secondary`}>Rows per page</span>
          <select
            value={pageSize}
            onChange={e => onPageSizeChange(Number(e.target.value))}
            className={cn(
              PAGINATION_TYPE.selectField,
              PAGINATION_TYPE.selectCompact,
              'cursor-pointer appearance-none py-0 px-space-1 text-center text-text-primary leading-7'
            )}
          >
            {selectOptions.map(option => (
              <option key={option} value={option}>
                {option === SHOW_ALL_PAGE_SIZE ? 'All' : option}
              </option>
            ))}
          </select>
        </label>
        <span
          className={`${TABLE_TYPE.caption} tabular-nums text-text-secondary`}
          aria-live="polite"
          aria-atomic="true"
        >
          {start}–{end} of {totalItems}
        </span>
      </div>

      <div className="flex min-w-0 shrink-0 items-center gap-space-0-5">
        <button
          type="button"
          onClick={() => goToPage(activePage - 1)}
          disabled={activePage <= 1}
          className={navButtonClass}
          aria-label="Previous page"
        >
          <Icon iconKey={IconKeys.actions.chevronLeft} className="h-3.5 w-3.5" />
        </button>

        {showPageList ? (
          <div className="mx-space-0-5 flex max-w-[min(100%,14rem)] items-center gap-space-0-5 overflow-x-auto">
            {pageNumbers.map((page, index) =>
              page === 'ellipsis' ? (
                <span
                  key={`ellipsis-${index}`}
                  className={`min-w-[1.25rem] text-center ${PAGINATION_TYPE.ellipsis}`}
                  aria-hidden
                >
                  …
                </span>
              ) : (
                <button
                  key={page}
                  type="button"
                  onClick={() => goToPage(page)}
                  className={pageButtonClass(page, page === activePage)}
                  aria-label={page === activePage ? `Page ${page}, current` : `Go to page ${page}`}
                  aria-current={page === activePage ? 'page' : undefined}
                >
                  {page}
                </button>
              )
            )}
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => goToPage(activePage + 1)}
          disabled={activePage >= totalPages}
          className={navButtonClass}
          aria-label="Next page"
        >
          <Icon iconKey={IconKeys.actions.chevronRight} className="h-3.5 w-3.5" />
        </button>
      </div>
    </nav>
  );
};
