import type { PendingEscalationItem } from '../api/results';
import { ModalType, useModal } from '@/lib/context/ModalContext';
import { useCallback } from 'react';

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
    (item: PendingEscalationItem) => {
      openModal({
        type: ModalType.ESCALATION_RESOLUTION_DETAIL,
        orderTestId: item.id,
        readOnly: !canResolveEscalation,
        escalationSnapshot: item,
      });
    },
    [openModal, canResolveEscalation],
  );

  return {
    openEscalationModal,
  };
}
