import { useCallback } from 'react';
import { useModal, ModalType } from '@/lib/context/ModalContext';
import type { PendingEscalationItem } from '../api/results';

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
