import React, { useMemo } from 'react';

import { actionButtonPreset, Button, IconButton } from '@/components/primitives';
import { cn } from '@/utils';
import { inputBase } from '@/components/inputs/inputStyles';
import { CONTROL, RADIUS, TYPE } from '@/components/theme/recipes';

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

  return (
    <div className="flex items-center justify-between gap-space-3 px-space-3 py-space-2 border-t border-border-default bg-surface">
      <div className="flex items-center gap-space-3">
        <div className="flex items-center gap-space-1-5 whitespace-nowrap">
          <span className={`${TYPE.caption} text-text-secondary`}>Rows per page</span>
          <select
            value={pageSize}
            onChange={e => onPageSizeChange(Number(e.target.value))}
            className={cn(
              inputBase,
              'cursor-pointer h-6 w-12 min-h-0 pt-space-0-5 pb-0 leading-5 pl-space-5 pr-space-5 text-center text-xxs appearance-none'
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
        <span className={`${TYPE.caption} text-text-secondary tabular-nums`}>
          {startItem}–{endItem} of {totalItems}
        </span>
      </div>

      <div className="flex items-center gap-space-0-5">
        <IconButton
          {...actionButtonPreset('previous')}
          size="sm"
          shape="square"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
        />

        <div className="flex items-center gap-space-0-5 mx-space-0-5">
          {pageNumbers.map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span
                  className="min-w-[20px] text-center text-xxs text-text-disabled"
                  aria-hidden
                >
                  …
                </span>
              ) : (
                <Button
                  type="button"
                  variant={page === currentPage ? 'primary' : 'outline'}
                  size="sm"
                  layout="text"
                  onClick={() => onPageChange(page as number)}
                  className={cn(
                    `min-w-[26px] h-6 px-space-1-5 text-xxs font-normal ${RADIUS.field}`,
                    page !== currentPage && 'border-border-default bg-surface',
                    CONTROL.focusVisibleTight,
                  )}
                  aria-label={page === currentPage ? `Page ${page}, current` : `Go to page ${page}`}
                  aria-current={page === currentPage ? 'page' : undefined}
                >
                  {page}
                </Button>
              )}
            </React.Fragment>
          ))}
        </div>

        <IconButton
          {...actionButtonPreset('next')}
          size="sm"
          shape="square"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
        />
      </div>
    </div>
  );
};
