/**
 * useResultValidationWorkflow
 *
 * Queue-side validation: comments live in the lab draft store; the modal
 * opens with only `{ orderTestId, interaction: 'validate' }`.
 */

import { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { invalidateResultQueries } from '@/lib/query/invalidate';
import { useValidateResults } from '../api/results';
import { notifyQualityIssueSuccess } from './qualityIssueToastMessages';
import { notify } from '@/utils/feedback';
import { logger } from '@/utils/logger';
import { useModal, ModalType } from '@/lib/context/ModalContext';
import { isLikelyNetworkOrTimeout } from '@/utils/errors';
import { orderTestKey } from '../utils/labSearchAndLinks';
import { useLabDraftStore } from '../state/labDraftStore';
import type { TestWithContext } from '@/types';
import type { QualityIssueResult } from '@/types/lab-operations';

export interface ResultValidationWorkflowController {
  comments: Record<string, string>;
  pendingValidateKey: string | null;
  handleCommentsChange: (commentKey: string, value: string) => void;
  handleValidate: (
    orderTestId: number,
    orderId: number | string,
    approve: boolean,
    rejectionResult?: QualityIssueResult
  ) => Promise<void>;
  openValidationModal: (test: TestWithContext) => void;
  validateMutation: ReturnType<typeof useValidateResults>;
}

function commentKeyToOrderTestId(commentKey: string): number {
  const parsed = Number(commentKey.replace(/^test-/, ''));
  return Number.isFinite(parsed) ? parsed : NaN;
}

export function useResultValidationWorkflow(queueLoading: boolean): ResultValidationWorkflowController {
  const queryClient = useQueryClient();
  const { openModal } = useModal();
  const validationComments = useLabDraftStore(s => s.validationComments);
  const setValidationComments = useLabDraftStore(s => s.setValidationComments);
  const clearValidationComments = useLabDraftStore(s => s.clearValidationComments);
  const [pendingValidateKey, setPendingValidateKey] = useState<string | null>(null);

  const validateMutation = useValidateResults();

  const comments = useMemo(() => {
    const mapped: Record<string, string> = {};
    for (const [id, text] of Object.entries(validationComments)) {
      mapped[orderTestKey(Number(id))] = text;
    }
    return mapped;
  }, [validationComments]);

  const handleCommentsChange = useCallback(
    (commentKey: string, value: string) => {
      const orderTestId = commentKeyToOrderTestId(commentKey);
      if (!Number.isFinite(orderTestId)) return;
      setValidationComments(orderTestId, value);
    },
    [setValidationComments]
  );

  const handleValidate = useCallback(
    async (
      orderTestId: number,
      orderId: number | string,
      approve: boolean,
      rejectionResult?: QualityIssueResult
    ): Promise<void> => {
      if (queueLoading) return;

      const orderIdStr = typeof orderId === 'string' ? orderId : orderId.toString();
      const commentKey = orderTestKey(orderTestId);
      const clearPending = () => setPendingValidateKey(null);

      if (approve) {
        setPendingValidateKey(commentKey);
        try {
          await validateMutation.mutateAsync({
            orderId: orderIdStr,
            orderTestId,
            validationNotes: useLabDraftStore.getState().getValidationComments(orderTestId) || undefined,
          });
          notify.toast('lab.validation.approve.success');
          clearValidationComments(orderTestId);
        } catch (error) {
          logger.error('Error validating results', error instanceof Error ? error : undefined);
          if (isLikelyNetworkOrTimeout(error)) {
            notify.toast('lab.validation.approve.networkAmbiguous');
          } else {
            notify.apiError('lab.validation.approve.error', error);
          }
          throw error;
        } finally {
          clearPending();
        }
        return;
      }

      if (rejectionResult) {
        await invalidateResultQueries(queryClient, {
          orderId: orderIdStr,
          samples: true,
          pendingEscalation: true,
        });
      }
      notifyQualityIssueSuccess(rejectionResult);
      clearValidationComments(orderTestId);
    },
    [queueLoading, validateMutation, clearValidationComments, queryClient]
  );

  const openValidationModal = useCallback(
    (test: TestWithContext) => {
      if (test.id == null) {
        notify.toast('lab.validation.testUnavailable');
        return;
      }
      openModal({
        type: ModalType.TEST_DETAIL,
        orderTestId: test.id,
        interaction: 'validate',
      });
    },
    [openModal]
  );

  return {
    comments,
    pendingValidateKey,
    handleCommentsChange,
    handleValidate,
    openValidationModal,
    validateMutation,
  };
}
