/**
 * Shared sample rejection handler for collection card and detail modal.
 * Wraps useRejectSample with consistent toast feedback.
 */

import { useCallback } from 'react';
import { useMutationToastHandler } from '@/hooks/useMutationToastHandler';
import { useRejectSample } from '@/features/lab/collection/samples.api';

interface UseRejectSampleHandlerOptions {
  /** Called after a successful rejection (e.g. close modal). */
  onSuccess?: () => void;
}

export function useRejectSampleHandler(options?: UseRejectSampleHandlerOptions) {
  const rejectSampleMutation = useRejectSample();
  const { onSuccess } = options ?? {};
  const { runWithToast } = useMutationToastHandler('Failed to reject sample');

  const rejectSample = useCallback(
    async (
      sampleId: string | number,
      reason: string,
      notes?: string,
      requireRecollection?: boolean
    ) => {
      await runWithToast(
        async () => {
          await rejectSampleMutation.mutateAsync({
            sampleId: sampleId.toString(),
            reason,
            notes,
            requireRecollection,
          });
          onSuccess?.();
        },
        {
          successTitle: requireRecollection
            ? 'Sample rejected - recollection requested'
            : 'Sample rejected',
          successSubtitle: requireRecollection
            ? 'Non-validated tests are waiting for recollection. Validated tests were escalated to a supervisor if applicable.'
            : 'The sample has been rejected.',
          errorTitle: 'Failed to reject sample',
          errorSubtitle:
            'The rejection could not be saved. Please try again or check the sample status.',
        }
      );
    },
    [rejectSampleMutation, onSuccess, runWithToast]
  );

  return {
    rejectSample,
    isRejecting: rejectSampleMutation.isPending,
  };
}
