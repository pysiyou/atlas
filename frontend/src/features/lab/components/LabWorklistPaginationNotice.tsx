/**
 * Warns when the server returned a partial page and more items exist.
 */
import React from 'react';
import type { WorklistPagination } from '../api/worklists';
import { TYPE, TONE } from '@/components/theme/recipes';

interface LabWorklistPaginationNoticeProps {
  pagination: WorklistPagination | undefined;
}

export const LabWorklistPaginationNotice: React.FC<LabWorklistPaginationNoticeProps> = ({
  pagination,
}) => {
  if (!pagination?.hasNext) return null;

  const { total, pageSize, page } = pagination;
  const shown = Math.min(page * pageSize, total);

  return (
    <div
      className={`shrink-0 px-space-4 py-space-2 ${TONE.warning.well} ${TYPE.caption}`}
      role="status"
    >
      Showing {shown} of {total} items. Narrow your search or filters to find other work, or load the
      next page when available.
    </div>
  );
};
