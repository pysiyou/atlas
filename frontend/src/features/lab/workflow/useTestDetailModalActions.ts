/**
 * Modal callbacks for TestDetailModal (keeps component under max-lines-per-function).
 */
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { ModalType, useModal } from '@/lib/context/ModalContext';
import type { OrderTest } from '@/types';
import type { TestDetailInteraction } from '@/lib/context/modalTypes';
import type { QualityIssueResult } from '@/types/lab-operations';
import { invalidateLabWorkflowQueries, invalidateResultQueries } from '@/lib/query/invalidate';
import { useValidateResults } from '../api/results';
import { useLabDraftStore } from '../state/labDraftStore';
import { notify } from '@/utils/feedback';
import { notifyQualityIssueSuccess } from '../validation/qualityIssueToastMessages';
import { isLikelyNetworkOrTimeout } from '@/utils/errors';
import { logger } from '@/utils/logger';

export function useTestDetailModalActions({
  interaction,
  orderTestId,
  orderId,
  onClose,
}: {
  interaction: TestDetailInteraction;
  orderTestId: number;
  orderId: number | string | undefined;
  onClose: () => void;
}) {
  const { pushModal } = useModal();
  const queryClient = useQueryClient();
  const validateMutation = useValidateResults();
  const getValidationComments = useLabDraftStore(s => s.getValidationComments);
  const clearValidationComments = useLabDraftStore(s => s.clearValidationComments);

  const approveHandler = useCallback(
    async (_signal: AbortSignal) => {
      if (interaction !== 'validate') return;
      const orderIdStr = orderId == null ? undefined : String(orderId);
      try {
        await validateMutation.mutateAsync({
          orderId: orderIdStr,
          orderTestId,
          validationNotes: getValidationComments(orderTestId) || undefined,
        });
        notify.toast('lab.validation.approve.success');
        clearValidationComments(orderTestId);
        onClose();
      } catch (error) {
        logger.error('Error validating results', error instanceof Error ? error : undefined);
        if (isLikelyNetworkOrTimeout(error)) {
          notify.toast('lab.validation.approve.networkAmbiguous');
        } else {
          notify.apiError('lab.validation.approve.error', error);
        }
        throw error;
      }
    },
    [
      interaction,
      orderId,
      orderTestId,
      validateMutation,
      getValidationComments,
      clearValidationComments,
      onClose,
    ]
  );
  const { execute: handleApprove, isPending: isApproving } = useAsyncAction(approveHandler, {
    minDisplayMs: 500,
    scope: 'inline',
  });

  const handleReject = useCallback(
    async (result: QualityIssueResult) => {
      const orderIdStr = orderId == null ? undefined : String(orderId);
      await invalidateResultQueries(queryClient, {
        orderId: orderIdStr,
        samples: true,
        pendingEscalation: true,
      });
      notifyQualityIssueSuccess(result);
      clearValidationComments(orderTestId);
      onClose();
    },
    [orderId, queryClient, clearValidationComments, orderTestId, onClose]
  );

  const handleCriticalValueUpdated = useCallback(() => {
    invalidateLabWorkflowQueries(queryClient, { criticalValues: true });
  }, [queryClient]);

  const openLinkedTest = useCallback(
    (linkedTest: OrderTest) => {
      if (linkedTest.id == null) return;
      pushModal({
        type: ModalType.TEST_DETAIL,
        orderTestId: linkedTest.id,
        interaction: 'view',
      });
    },
    [pushModal]
  );

  const handleViewFullSample = useCallback(
    (sampleId: number) => {
      pushModal({
        type: ModalType.SAMPLE_DETAIL,
        sampleId: String(sampleId),
        readOnly: true,
      });
    },
    [pushModal]
  );

  return {
    handleApprove,
    isApproving,
    handleReject,
    handleCriticalValueUpdated,
    openLinkedTest,
    handleViewFullSample,
  };
}
