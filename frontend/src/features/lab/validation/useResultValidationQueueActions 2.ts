import { useCallback } from 'react';
import { useInvalidateOrders } from '@/features/orders';
import { useModal, ModalType } from '@/lib/context/ModalContext';
import type { TestWithContext } from '@/types';
import {
  useApproveRecollectionRequest,
  useDenyRecollectionRequest,
} from '../api/recollectionRequests';
import { notify } from '@/utils/feedback';

interface UseResultValidationQueueActionsParams {
  canResolveEscalation: boolean;
  invalidatePendingEscalation: () => void;
  refetchEscalation: () => Promise<unknown>;
}

export function useResultValidationQueueActions({
  canResolveEscalation,
  invalidatePendingEscalation,
  refetchEscalation,
}: UseResultValidationQueueActionsParams) {
  const approveRecollection = useApproveRecollectionRequest();
  const denyRecollection = useDenyRecollectionRequest();
  const { invalidateAll: invalidateOrders } = useInvalidateOrders();
  const { openModal } = useModal();

  const handleApproveRecollection = useCallback(
    async (requestId: number, reviewNotes?: string) => {
      try {
        await approveRecollection.mutateAsync({ requestId, reviewNotes });
        notify.toast('lab.recollection.approve.success');
        await invalidateOrders();
      } catch (error) {
        notify.apiError('lab.recollection.approve.error', error);
      }
    },
    [approveRecollection, invalidateOrders],
  );

  const handleDenyRecollection = useCallback(
    async (requestId: number, reviewNotes?: string) => {
      try {
        await denyRecollection.mutateAsync({ requestId, reviewNotes });
        notify.toast('lab.recollection.deny.success');
        await invalidateOrders();
      } catch (error) {
        notify.apiError('lab.recollection.deny.error', error);
      }
    },
    [denyRecollection, invalidateOrders],
  );

  const openEscalationModal = useCallback(
    (test: TestWithContext) => {
      openModal(ModalType.ESCALATION_RESOLUTION_DETAIL, {
        test,
        readOnly: !canResolveEscalation,
        onResolved: async () => {
          invalidatePendingEscalation();
          await invalidateOrders();
          await refetchEscalation();
        },
      });
    },
    [
      openModal,
      canResolveEscalation,
      invalidatePendingEscalation,
      invalidateOrders,
      refetchEscalation,
    ],
  );

  return {
    handleApproveRecollection,
    handleDenyRecollection,
    openEscalationModal,
    isApprovingRecollection: approveRecollection.isPending,
    isDenyingRecollection: denyRecollection.isPending,
  };
}
