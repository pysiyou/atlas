/**
 * Fetches API-driven sample rejection limits for collection workflow.
 */

import { useCallback } from 'react';
import {
  sampleRejectionAPI,
  type SampleRejectionOptionsResponse,
} from '@/features/collection/api/sampleRejection';
import { useFetchedResource } from '@/hooks/useFetchedResource';

interface UseSampleRejectionOptionsOptions {
  sampleId?: number;
  enabled?: boolean;
}

export function useSampleRejectionOptions({
  sampleId,
  enabled = true,
}: UseSampleRejectionOptionsOptions) {
  const fetcher = useCallback(async (): Promise<SampleRejectionOptionsResponse> => {
    if (!sampleId) {
      throw new Error('Sample ID is required');
    }
    return sampleRejectionAPI.getOptions(sampleId);
  }, [sampleId]);

  const { data, isLoading, error, refetch } = useFetchedResource(fetcher, [sampleId], {
    enabled: enabled && !!sampleId,
    errorMessage: 'Failed to load rejection options',
    logContext: { sampleId },
  });

  return {
    options: data,
    isLoading,
    error,
    refetch,
  };
}
