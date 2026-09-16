/**
 * useResultValidationWorkflow
 *
 * Encapsulates mutation logic, toast orchestration, comment state,
 * and modal opening for the result validation workflow.
 */

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { invalidateResultQueries } from '@/lib/query/invalidate';
import { useValidateResults } from '../api/results.api';
import { notifyQualityIssueSuccess } from '@/features/lab/validation/qualityIssueToastMessages';
import { notify } from '@/utils/feedback';
import { logger } from '@/utils/logger';
import { useModal, ModalType } from '@/lib/context/ModalContext';
import { isLikelyNetworkOrTimeout } from '@/utils/errors';
import { orderTestKey } from '../utils/orderTestKey';
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

export function useResultValidationWorkflow(ordersLoading: boolean): ResultValidationWorkflowController {
  const queryClient = useQueryClient();
  const { openModal } = useModal();
  const [comments, setComments] = useState<Record<string, string>>({});
  const [pendingValidateKey, setPendingValidateKey] = useState<string | null>(null);

  const validateMutation = useValidateResults();

  const handleCommentsChange = useCallback((commentKey: string, value: string) => {
    setComments(prev => ({ ...prev, [commentKey]: value }));
  }, []);

  const clearComment = useCallback((commentKey: string) => {
    setComments(prev => {
      const n = { ...prev };
      delete n[commentKey];
      return n;
    });
  }, []);

  const handleValidate = useCallback(
    async (
      orderTestId: number,
      orderId: number | string,
      approve: boolean,
      rejectionResult?: QualityIssueResult
    ): Promise<void> => {
      if (ordersLoading) return;

      const orderIdStr = typeof orderId === 'string' ? orderId : orderId.toString();
      const commentKey = orderTestKey(orderTestId);
      const clearPending = () => setPendingValidateKey(null);

      if (approve) {
        setPendingValidateKey(commentKey);
        try {
          await validateMutation.mutateAsync({
            orderId: orderIdStr,
            orderTestId,
            validationNotes: comments[commentKey] || undefined,
          });
          notify.toast('lab.validation.approve.success');
          clearComment(commentKey);
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
      clearComment(commentKey);
    },
    [comments, ordersLoading, validateMutation, clearComment, queryClient]
  );

  const openValidationModal = useCallback(
    (test: TestWithContext) => {
      if (test.id == null) {
        notify.toast('lab.validation.testUnavailable');
        return;
      }

      const commentKey = orderTestKey(test.id);

      openModal(ModalType.VALIDATION_DETAIL, {
        test,
        commentKey,
        comments: comments[commentKey] || '',
        onCommentsChange: handleCommentsChange,
        onApprove: () => handleValidate(test.id!, test.orderId, true),
        onReject: result => handleValidate(test.id!, test.orderId, false, result),
      });
    },
    [comments, handleCommentsChange, handleValidate, openModal]
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
