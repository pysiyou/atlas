import React from 'react';
import { Icon } from './Icon';
import { ICONS } from '@/utils/icon-mappings';
import {
  paginationContainer,
  paginationSelect,
  paginationPageButton,
  paginationNavButton,
  paginationText,
  getPageButtonClasses,
} from '@/shared/design-system/tokens/components/pagination';

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

  return (
    <div className={paginationContainer.base}>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className={paginationText.label}>Rows per page:</span>
          <select
            value={pageSize}
            onChange={e => onPageSizeChange(Number(e.target.value))}
            className={paginationSelect.combined}
          >
            {pageSizeOptions.map(option => (
              <option key={option} value={option} className="text-xs">
                {option}
              </option>
            ))}
          </select>
        </div>
        <span className={paginationText.info}>
          {startItem}-{endItem} of {totalItems}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={paginationNavButton.base}
        >
          <Icon name={ICONS.actions.chevronLeft} className={paginationNavButton.icon} />
        </button>

        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className={paginationText.ellipsis}>...</span>
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
          className={paginationNavButton.base}
        >
          <Icon name={ICONS.actions.chevronRight} className={paginationNavButton.icon} />
        </button>
      </div>
    </div>
  );
};
