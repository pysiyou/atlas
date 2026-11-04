import { useCallback } from 'react';
import { useModal, ModalType } from '@/lib/context/ModalContext';
import type { TestWithContext } from '@/types';

interface UseResultValidationQueueActionsParams {
  canResolveEscalation: boolean;
  invalidatePendingEscalation: () => void;
  refetchEscalation: () => Promise<unknown>;
}

export function useResultValidationQueueActions({
  canResolveEscalation,
}: UseResultValidationQueueActionsParams) {
  const { openModal } = useModal();

  const openEscalationModal = useCallback(
    (test: TestWithContext) => {
      if (test.id == null) return;
      openModal({
        type: ModalType.ESCALATION_RESOLUTION_DETAIL,
        orderTestId: test.id,
        readOnly: !canResolveEscalation,
      });
    },
    [openModal, canResolveEscalation],
  );

  return {
    openEscalationModal,
  };
}
