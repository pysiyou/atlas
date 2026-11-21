/**
 * Modal callbacks for TestDetailModal (keeps component under max-lines-per-function).
 */
import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAsyncAction } from '@/hooks';
import { ModalType, useModal } from '@/lib/context/ModalContext';
import type { OrderTest } from '@/types';
import type { TestDetailInteraction } from '@/lib/context/modalTypes';
import type { QualityIssueResult } from '@/types';
import { invalidateAfterLabMutation } from '@/lib/query';
import { useValidateResults } from '../../api/results';
import { useLabDraftStore } from '../../state/labDraftStore';
import { notify } from '@/feedback';
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
  orderId: string | undefined;
  onClose: () => void;
}) {
  const { openModal } = useModal();
  const queryClient = useQueryClient();
  const validateMutation = useValidateResults();
  const getValidationComments = useLabDraftStore(s => s.getValidationComments);
  const clearValidationComments = useLabDraftStore(s => s.clearValidationComments);
  const [criticalSeen, setCriticalSeen] = useState(false);

  // Reset critical acknowledgement when switching order tests (async to satisfy react-hooks/set-state-in-effect).
  useEffect(() => {
    const id = requestAnimationFrame(() => setCriticalSeen(false));
    return () => cancelAnimationFrame(id);
  }, [orderTestId]);

  const approveHandler = useCallback(
    async (_signal: AbortSignal) => {
      if (interaction !== 'validate') return;
      try {
        await validateMutation.mutateAsync({
          orderId,
          orderTestId,
          validationNotes: getValidationComments(orderTestId) || undefined,
          criticalSeen,
        });
        clearValidationComments(orderTestId);
        onClose();
        notify.show('lab.validation.approve.success');
        if (orderId) {
          openModal({ type: ModalType.REPORT_PREVIEW, orderId });
        }
      } catch (error) {
        logger.error('Error validating results', error instanceof Error ? error : undefined);
        if (isLikelyNetworkOrTimeout(error)) {
          notify.show('lab.validation.approve.networkAmbiguous');
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
      criticalSeen,
      openModal,
    ]
  );
  const { execute: handleApprove, isPending: isApproving } = useAsyncAction(approveHandler, {
    minDisplayMs: 500,
  });

  const handleReject = useCallback(
    (result: QualityIssueResult) => {
      // Toast is already shown by useSubmitQualityIssue; close the modal first so the
      // full-screen scrim does not sit under the toast and swallow sidebar / route clicks.
      clearValidationComments(orderTestId);
      onClose();
      void invalidateAfterLabMutation(queryClient, {
        kind: 'qualityIssue',
        orderId: result.orderId ?? orderId,
        orderTestId: result.orderTestId ?? orderTestId,
        createdTestId: result.createdTestId,
        createdSampleId: result.createdSampleId,
      });
    },
    [orderId, queryClient, clearValidationComments, orderTestId, onClose]
  );

  const handleCriticalValueUpdated = useCallback(() => {
    invalidateAfterLabMutation(queryClient, { kind: 'criticalValue', orderId });
  }, [orderId, queryClient]);

  const openLinkedTest = useCallback(
    (linkedTest: OrderTest) => {
      if (linkedTest.id == null) return;
      openModal({
        type: ModalType.TEST_DETAIL,
        orderTestId: linkedTest.id,
        interaction: 'view',
      });
    },
    [openModal]
  );

  const handleViewFullSample = useCallback(
    (sampleId: string) => {
      openModal({
        type: ModalType.SAMPLE_DETAIL,
        sampleId: String(sampleId),
        readOnly: true,
      });
    },
    [openModal]
  );

  return {
    handleApprove,
    isApproving,
    handleReject,
    handleCriticalValueUpdated,
    openLinkedTest,
    handleViewFullSample,
    criticalSeen,
    setCriticalSeen,
  };
}
