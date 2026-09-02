/**
 * Shared sample quality issue handler for collection card and detail modal.
 */
import { useQualityIssueHandler } from '@/features/lab/hooks/useQualityIssueHandler';

interface UseRejectSampleHandlerOptions {
  onSuccess?: () => void;
}

export function useRejectSampleHandler(options?: UseRejectSampleHandlerOptions) {
  const { reportIssue, isSubmitting } = useQualityIssueHandler({
    onSuccess: () => options?.onSuccess?.(),
  });

  const rejectSample = async (
    sampleId: string | number,
    reason: string,
    notes?: string,
  ) => {
    await reportIssue('sample', Number(sampleId), reason, notes);
  };

  return { rejectSample, isRejecting: isSubmitting };
}
