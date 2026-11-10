/**
 * useResultValidationWorkflow
 *
 * Queue-side validation: comments live in the lab draft store; the modal
 * opens with only `{ orderTestId, interaction: 'validate' }`.
 */

import { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { invalidateAfterLabMutation } from '@/lib/query/invalidate';
import { useValidateResults } from '../api/results';
import { notifyQualityIssueSuccess } from './qualityIssueToastMessages';
import { notify } from '@/feedback';
import { logger } from '@/utils/logger';
import { useModal, ModalType } from '@/lib/context/ModalContext';
import { isLikelyNetworkOrTimeout } from '@/utils/errors';
import { orderTestKey } from '../utils/labSearchAndLinks';
import { useLabDraftStore } from '../state/labDraftStore';
import type { ValidationQueueRow } from '../types/validationQueue';
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
  openValidationModal: (row: ValidationQueueRow) => void;
  validateMutation: ReturnType<typeof useValidateResults>;
}

function commentKeyToOrderTestId(commentKey: string): number {
  const parsed = Number(commentKey.replace(/^test-/, ''));
  return Number.isFinite(parsed) ? parsed : NaN;
}

export function useResultValidationWorkflow(queueLoading: boolean): ResultValidationWorkflowController {
  const queryClient = useQueryClient();
  const { openModal } = useModal();
  const validationDrafts = useLabDraftStore(s => s.validationDrafts);
  const setValidationComments = useLabDraftStore(s => s.setValidationComments);
  const clearValidationComments = useLabDraftStore(s => s.clearValidationComments);
  const [pendingValidateKey, setPendingValidateKey] = useState<string | null>(null);

  const validateMutation = useValidateResults();

  const comments = useMemo(() => {
    const mapped: Record<string, string> = {};
    for (const [id, draft] of Object.entries(validationDrafts)) {
      mapped[orderTestKey(Number(id))] = draft.text;
    }
    return mapped;
  }, [validationDrafts]);

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
          notify.show('lab.validation.approve.success');
          clearValidationComments(orderTestId);
        } catch (error) {
          logger.error('Error validating results', error instanceof Error ? error : undefined);
          if (isLikelyNetworkOrTimeout(error)) {
            notify.show('lab.validation.approve.networkAmbiguous');
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
        await invalidateAfterLabMutation(queryClient, {
          kind: 'qualityIssue',
          orderId: orderIdStr,
          orderTestId,
        });
      }
      notifyQualityIssueSuccess(rejectionResult);
      clearValidationComments(orderTestId);
    },
    [queueLoading, validateMutation, clearValidationComments, queryClient]
  );

  const openValidationModal = useCallback(
    (row: ValidationQueueRow) => {
      openModal({
        type: ModalType.TEST_DETAIL,
        orderTestId: row.orderTestId,
        interaction: 'validate',
        worklistRow: row,
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
