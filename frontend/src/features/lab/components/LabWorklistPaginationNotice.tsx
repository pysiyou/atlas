/**
 * Server-side pager for lab worklists.
 */
import React from 'react';
import type { WorklistPagination } from '../api/worklists';
import { Button } from '@/components/primitives';
import { text } from '@/theme/recipes';

interface LabWorklistPaginationNoticeProps {
  pagination: WorklistPagination | undefined;
  onPageChange?: (page: number) => void;
}

export const LabWorklistPaginationNotice: React.FC<LabWorklistPaginationNoticeProps> = ({
  pagination,
  onPageChange,
}) => {
  if (!pagination || pagination.total <= 0) return null;

  const { total, pageSize, page, totalPages, hasNext, hasPrev } = pagination;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const showPager = totalPages > 1 && typeof onPageChange === 'function';

  return (
    <div
      className={`shrink-0 flex flex-wrap items-center justify-between gap-space-2 px-space-4 py-space-2 ${text({ role: 'caption' })}`}
      role="status"
    >
      <span>
        Showing {start}–{end} of {total}
      </span>
      {showPager ? (
        <div className="flex items-center gap-space-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={!hasPrev}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </Button>
          <span>
            Page {page} of {totalPages}
          </span>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={!hasNext}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
};
