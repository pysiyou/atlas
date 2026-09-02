/**
 * Shared quality issue handler for collection and validation.
 */
import { useCallback } from 'react';
import { useMutationToastHandler } from '@/hooks/useMutationToastHandler';
import { useReportQualityIssue } from '@/features/lab/api/quality-issues.api';
import type { QualityIssueResult, QualityIssueTargetType } from '@/types/lab-operations';

interface UseQualityIssueHandlerOptions {
  onSuccess?: (result: QualityIssueResult) => void;
}

export function useQualityIssueHandler(options?: UseQualityIssueHandlerOptions) {
  const reportMutation = useReportQualityIssue();
  const { runWithToast } = useMutationToastHandler('Failed to report quality issue');
  const { onSuccess } = options ?? {};

  const reportIssue = useCallback(
    async (
      targetType: QualityIssueTargetType,
      targetId: number,
      reason: string,
      notes?: string,
    ) => {
      let result: QualityIssueResult | undefined;
      await runWithToast(
        async () => {
          result = await reportMutation.mutateAsync({
            target: { type: targetType, id: targetId },
            reason,
            notes: notes?.trim() || undefined,
          });
          onSuccess?.(result);
        },
        {
          successTitle: result?.escalationRequired
            ? 'Escalated to supervisor'
            : result?.remedy === 'recollect'
              ? 'Recollection requested'
              : result?.remedy === 'retry_same_sample'
                ? 'Re-test scheduled'
                : 'Quality issue recorded',
          successSubtitle: result?.message,
          errorTitle: 'Failed to report quality issue',
        },
      );
      return result;
    },
    [reportMutation, onSuccess, runWithToast],
  );

  return {
    reportIssue,
    isSubmitting: reportMutation.isPending,
  };
}
