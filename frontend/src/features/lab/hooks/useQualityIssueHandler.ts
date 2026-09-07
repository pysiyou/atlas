/**
 * Shared quality issue handler for collection and validation.
 */
import { useCallback } from 'react';
import { toast } from '@/app/AppToastBar';
import { logger } from '@/utils/logger';
import { useReportQualityIssue } from '@/features/lab/api/quality-issues.api';
import type { QualityIssueResult, QualityIssueTargetType } from '@/types/lab-operations';
import { getRejectionToast } from '@/features/lab/validation/rejectionToastMessages';

interface UseQualityIssueHandlerOptions {
  onSuccess?: (result: QualityIssueResult) => void;
}

function collectionSuccessToast(result: QualityIssueResult) {
  const toastMessage = getRejectionToast(result);
  return toastMessage;
}

export function useQualityIssueHandler(options?: UseQualityIssueHandlerOptions) {
  const reportMutation = useReportQualityIssue();
  const { onSuccess } = options ?? {};

  const reportIssue = useCallback(
    async (
      targetType: QualityIssueTargetType,
      targetId: number,
      reason: string,
      notes?: string,
    ) => {
      try {
        const result = await reportMutation.mutateAsync({
          target: { type: targetType, id: targetId },
          reason,
          notes: notes?.trim() || undefined,
        });
        const toastMessage = collectionSuccessToast(result);
        toast.success(toastMessage);
        onSuccess?.(result);
        return result;
      } catch (error) {
        logger.error('Failed to report quality issue', error instanceof Error ? error : undefined);
        toast.error({
          title: 'Failed to report quality issue',
          subtitle: 'Check the details and try again.',
        });
        throw error;
      }
    },
    [reportMutation, onSuccess],
  );

  return {
    reportIssue,
    isSubmitting: reportMutation.isPending,
  };
}
