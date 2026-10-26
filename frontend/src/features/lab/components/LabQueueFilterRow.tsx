/**
 * LabQueueFilterRow — FilterBar wrapper and optional worklist pagination notice.
 */

import type { ReactNode } from 'react';
import type { WorklistPagination } from '../api/worklists';
import { LabWorklistPaginationNotice } from './LabWorklistPaginationNotice';

export interface LabQueueFilterRowProps {
  pagination?: WorklistPagination;
  onPageChange?: (page: number) => void;
  children: ReactNode;
}

/**
 * Shared filter chrome for collection, entry, and validation queues.
 */
export function LabQueueFilterRow({
  pagination,
  onPageChange,
  children,
}: LabQueueFilterRowProps) {
  return (
    <>
      {children}
      {pagination ? (
        <LabWorklistPaginationNotice pagination={pagination} onPageChange={onPageChange} />
      ) : null}
    </>
  );
}
