/**
 * Shared sample rejection handler for collection card and detail modal.
 * Wraps useRejectSample with consistent toast feedback.
 */

import { useCallback } from 'react';
import { toast } from '@/app/AppToastBar';
import { logger } from '@/utils/logger';
import type { RejectionReason } from '@/types';
import { useRejectSample } from '@/features/collection/api/useSamples';

interface UseRejectSampleHandlerOptions {
  /** Called after a successful rejection (e.g. close modal). */
  onSuccess?: () => void;
}

export function useRejectSampleHandler(options?: UseRejectSampleHandlerOptions) {
  const rejectSampleMutation = useRejectSample();
  const { onSuccess } = options ?? {};

  const rejectSample = useCallback(
    async (
      sampleId: string | number,
      reasons: RejectionReason[],
      notes?: string,
      requireRecollection?: boolean
    ) => {
      try {
        await rejectSampleMutation.mutateAsync({
          sampleId: sampleId.toString(),
          reasons,
          notes,
          requireRecollection,
        });
        toast.success({
          title: requireRecollection
            ? 'Sample rejected - recollection will be requested'
            : 'Sample rejected',
          subtitle:
            'The sample has been rejected. Recollection will be requested if you chose that option.',
        });
        onSuccess?.();
      } catch (error) {
        logger.error('Failed to reject sample', error instanceof Error ? error : undefined);
        toast.error({
          title: 'Failed to reject sample',
          subtitle:
            'The rejection could not be saved. Please try again or check the sample status.',
        });
        throw error;
      }
    },
    [rejectSampleMutation, onSuccess]
  );

  return {
    rejectSample,
    isRejecting: rejectSampleMutation.isPending,
  };
}
