/**
 * Server-side pager for lab worklists — pinned bottom-right range caption.
 */
import type { WorklistPagination } from '../api/worklists';
import { Button } from '@/components/primitives';
import { TABLE_TYPE } from '@/theme/recipes';

interface LabWorklistPaginationNoticeProps {
  /** Worklist page metadata from the current server response. */
  pagination: WorklistPagination | undefined;
  /** Called when the user clicks Previous/Next (only when more than one page). */
  onPageChange?: (page: number) => void;
}

/**
 * Footer for collection, entry, and validation queues.
 * Shows `Showing 1–1 of 1` on the bottom right; pager buttons appear only when needed.
 *
 * @param pagination - Server page metadata; hidden when total is 0
 * @param onPageChange - Optional page-change handler used when totalPages > 1
 */
export function LabWorklistPaginationNotice({
  pagination,
  onPageChange,
}: LabWorklistPaginationNoticeProps) {
  if (!pagination || pagination.total <= 0) return null;

  const { total, pageSize, page, totalPages, hasNext, hasPrev } = pagination;
  /** Inclusive 1-based index of the first item on this page. */
  const start = (page - 1) * pageSize + 1;
  /** Inclusive 1-based index of the last item on this page. */
  const end = Math.min(page * pageSize, total);
  const showPager = totalPages > 1 && typeof onPageChange === 'function';

  return (
    <div
      className="flex min-h-[2.75rem] shrink-0 flex-wrap items-center justify-end gap-x-space-3 gap-y-space-2 border-t border-border-default bg-surface px-space-3 py-space-2"
      role="status"
    >
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
          <span className={TABLE_TYPE.caption}>
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
      <span
        className={`${TABLE_TYPE.caption} tabular-nums text-text-secondary`}
        aria-live="polite"
        aria-atomic="true"
      >
        Showing {start}–{end} of {total}
      </span>
    </div>
  );
}
