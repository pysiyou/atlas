/**
 * Shared quality issue handler for collection and validation.
 */
import { useCallback } from 'react';
import { logger } from '@/utils/logger';
import { notify } from '@/utils/feedback';
import { useReportQualityIssue } from '../api/quality-issues.api';
import type {
  QualityIssueResult,
  QualityIssueTargetType,
  RemedyType,
} from '@/types/lab-operations';
import { notifyQualityIssueSuccess } from '@/features/lab/validation/qualityIssueToastMessages';

interface UseQualityIssueHandlerOptions {
  onSuccess?: (result: QualityIssueResult) => void;
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
        notifyQualityIssueSuccess(result);
        onSuccess?.(result);
        return result;
      } catch (error) {
        logger.error('Failed to report quality issue', error instanceof Error ? error : undefined);
        notify.apiError('lab.qualityIssue.report.error', error);
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
