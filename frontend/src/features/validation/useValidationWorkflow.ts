/**
 * useValidationWorkflow
 *
 * Encapsulates all mutation logic, toast orchestration, comment state,
 * and modal opening for the result validation workflow.
 *
 * Extracted from ValidationView.tsx to separate data/action logic from rendering.
 */

import { useState, useCallback } from 'react';
import { useInvalidateOrders } from '@/features/orders/utils/useOrderUtils';
import { useValidateResults, useValidateBulk } from '@/features/validation/api/useResultMutations';
import { toast } from '@/app/AppToastBar';
import { logger } from '@/utils/logger';
import { useModal, ModalType } from '@/lib/context/ModalContext';
import { getErrorMessage, isLikelyNetworkOrTimeout } from '@/utils/errors';
import type { TestWithContext } from '@/types';

export interface ValidationWorkflow {
  comments: Record<string, string>;
  pendingValidateKey: string | null;
  handleCommentsChange: (commentKey: string, value: string) => void;
  handleValidate: (orderId: number | string, testCode: string, approve: boolean) => Promise<void>;
  handleBulkApprove: (testIds: number[], allTests: TestWithContext[]) => Promise<void>;
  openValidationModal: (test: TestWithContext) => void;
  validateMutation: ReturnType<typeof useValidateResults>;
  bulkMutation: ReturnType<typeof useValidateBulk>;
}

// eslint-disable-next-line max-lines-per-function
export function useValidationWorkflow(ordersLoading: boolean): ValidationWorkflow {
  const { invalidateAll: invalidateOrders } = useInvalidateOrders();
  const { openModal } = useModal();
  const [comments, setComments] = useState<Record<string, string>>({});
  const [pendingValidateKey, setPendingValidateKey] = useState<string | null>(null);

  const validateMutation = useValidateResults();
  const bulkMutation = useValidateBulk();

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
    async (orderId: number | string, testCode: string, approve: boolean): Promise<void> => {
      if (ordersLoading) return;

      const orderIdStr = typeof orderId === 'string' ? orderId : orderId.toString();
      const commentKey = `${orderIdStr}-${testCode}`;
      const clearPending = () => setPendingValidateKey(null);

      if (approve) {
        setPendingValidateKey(commentKey);
        try {
          await validateMutation.mutateAsync({
            orderId: orderIdStr,
            testCode,
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

      // RejectionDialog already called the API; refresh cache and notify.
      await invalidateOrders();
      toast.success({
        title: 'Results rejected',
        subtitle:
          'These results have been rejected. A re-test or new sample may have been requested.',
      });
      clearComment(commentKey);
    },
    [comments, ordersLoading, invalidateOrders, validateMutation, clearComment]
  );

  const handleBulkApprove = useCallback(
    async (testIds: number[], allTests: TestWithContext[]): Promise<void> => {
      if (testIds.length === 0) return;

      const items = testIds
        .map(testId => {
          const test = allTests.find(t => t.id === testId);
          return test ? { orderId: test.orderId, testCode: test.testCode } : null;
        })
        .filter((item): item is { orderId: number; testCode: string } => item !== null);

      if (items.length === 0) {
        toast.error({
          title: 'No valid tests selected',
          subtitle: 'Select at least one test from the list before running bulk approval.',
        });
        return;
      }

      try {
        const response = await bulkMutation.mutateAsync({
          items,
          validationNotes: 'Bulk approved',
        });
        const results = response?.results ?? [];
        const successCount = response?.successCount ?? 0;
        const failureCount = response?.failureCount ?? 0;
        if (failureCount === 0) {
          toast.success({
            title: `Successfully approved ${successCount} result(s)`,
            subtitle: 'All selected results have been approved and the orders have been updated.',
          });
        } else {
          const failedItems = results
            .filter(r => !r.success)
            .map(r => `${r.testCode} (Order ${r.orderId})`)
            .join(', ');
          toast.error({
            title: `Approved ${successCount}, failed ${failureCount}${failedItems ? `: ${failedItems}` : ''}`,
            subtitle:
              'Some results could not be approved. Check the failed items and try again if needed.',
          });
        }
      } catch (error) {
        logger.error('Error in bulk validation', error instanceof Error ? error : undefined);
        toast.error({
          title: 'Failed to approve results. Please try again.',
          subtitle: 'The bulk approval request failed. Check your connection and try again.',
        });
      }
    },
    [bulkMutation]
  );

  const openValidationModal = useCallback(
    (test: TestWithContext) => {
      const commentKey = `${test.orderId}-${test.testCode}`;

      openModal(ModalType.VALIDATION_DETAIL, {
        test,
        commentKey,
        comments: comments[commentKey] || '',
        onCommentsChange: handleCommentsChange,
        onApprove: () => handleValidate(test.orderId, test.testCode, true),
        onReject: () => handleValidate(test.orderId, test.testCode, false),
      });
    },
    [comments, handleCommentsChange, handleValidate, openModal]
  );

  return {
    comments,
    pendingValidateKey,
    handleCommentsChange,
    handleValidate,
    handleBulkApprove,
    openValidationModal,
    validateMutation,
    bulkMutation,
  };
}
