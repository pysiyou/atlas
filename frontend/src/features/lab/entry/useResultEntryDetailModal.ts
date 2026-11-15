import type { EntryQueueRow } from '../types/queues';
import { isLabActionAllowed } from '../utils/queueDisplay';
import { ModalType, useModal } from '@/lib/context/ModalContext';
import { useCallback } from 'react';

/**
 * Opens the result-entry modal with only the order-test id.
 * Drafts and mutations live inside the modal / lab draft store.
 */
export function useResultEntryDetailModal() {
  const { openModal } = useModal();

  return useCallback(
    (row: EntryQueueRow) => {
      if (!isLabActionAllowed(row.allowedActions, 'enterResults')) {
        return;
      }
      openModal({
        type: ModalType.RESULT_DETAIL,
        orderTestId: row.orderTestId,
        worklistRow: row,
      });
    },
    [openModal]
  );
}
