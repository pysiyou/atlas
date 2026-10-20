import { useCallback } from 'react';
import { useModal, ModalType } from '@/lib/context/ModalContext';
import { notify } from '@/utils/feedback';
import type { TestWithContext } from '@/types';
import { isLabActionAllowed } from '../utils/queueDisplay';

/**
 * Opens the result-entry modal with only the order-test id.
 * Drafts and mutations live inside the modal / lab draft store.
 */
export function useResultEntryDetailModal() {
  const { openModal } = useModal();

  return useCallback(
    (test: TestWithContext) => {
      if (test.id == null) {
        notify.toast('lab.entry.modalUnavailable');
        return;
      }
      if (!isLabActionAllowed(test.allowedActions, 'enterResults')) {
        return;
      }
      openModal({ type: ModalType.RESULT_DETAIL, orderTestId: test.id });
    },
    [openModal]
  );
}
