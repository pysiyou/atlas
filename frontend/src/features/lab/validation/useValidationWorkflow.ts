/**
 * useValidationWorkflow
 *
 * Encapsulates mutation logic, toast orchestration, comment state,
 * and modal opening for the result validation workflow.
 */

import { useState, useCallback } from 'react';
import { useValidateResults } from '@/features/lab/validation/results.api';
import { getRejectionToast } from '@/features/lab/validation/rejectionToastMessages';
import { toast } from '@/app/AppToastBar';
import { logger } from '@/utils/logger';
import { useModal, ModalType } from '@/lib/context/ModalContext';
import { getErrorMessage, isLikelyNetworkOrTimeout } from '@/utils/errors';
import { orderTestKey } from '@/features/lab/utils/orderTestKey';
import type { TestWithContext } from '@/types';
import type { QualityIssueResult } from '@/types/lab-operations';

export interface ValidationWorkflow {
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

export function useValidationWorkflow(ordersLoading: boolean): ValidationWorkflow {
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
          toast.success({
            title: 'Results approved',
            subtitle:
              'These results have been approved and are now final. The order status has been updated.',
          });
          clearComment(commentKey);
        } catch (error) {
          logger.error('Error validating results', error instanceof Error ? error : undefined);
          if (isLikelyNetworkOrTimeout(error)) {
            toast.error({
              title: 'Action may have completed',
              subtitle:
                'The request did not complete. Please refresh the page to see the latest status.',
            });
          } else {
            toast.error({
              title: `Failed to validate results: ${getErrorMessage(error, 'Unknown error')}`,
              subtitle:
                'The validation request failed. Please try again or contact support if the issue persists.',
            });
          }
          throw error;
        } finally {
          clearPending();
        }
        return;
      }

      const toastMessage = getRejectionToast(rejectionResult);
      toast.success(toastMessage);
      clearComment(commentKey);
    },
    [comments, ordersLoading, validateMutation, clearComment]
  );

  const openValidationModal = useCallback(
    (test: TestWithContext) => {
      if (test.id == null) {
        toast.error({
          title: 'Test record unavailable',
          subtitle: 'Refresh the page and try again.',
        });
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
