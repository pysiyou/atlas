/**
 * Shared quality issue handler for collection and validation.
 */
import { useCallback } from 'react';
import { toast } from '@/app/AppToastBar';
import { logger } from '@/utils/logger';
import { useReportQualityIssue } from '@/features/lab/api/quality-issues.api';
import type {
  QualityIssueResult,
  QualityIssueTargetType,
  RemedyType,
} from '@/types/lab-operations';
import { getRejectionToast } from '@/features/lab/validation/rejectionToastMessages';

interface UseQualityIssueHandlerOptions {
  onSuccess?: (result: QualityIssueResult) => void;
}

function collectionSuccessToast(result: QualityIssueResult) {
  return getRejectionToast(result);
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
      preferredRemedy?: RemedyType,
    ) => {
      try {
        const result = await reportMutation.mutateAsync({
          target: { type: targetType, id: targetId },
          reason,
          notes: notes?.trim() || undefined,
          preferredRemedy,
        });
        toast.success(collectionSuccessToast(result));
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
