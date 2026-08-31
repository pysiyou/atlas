/**
 * Fetches API-driven sample rejection limits for collection workflow.
 */

import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  sampleRejectionAPI,
  type SampleRejectionOptionsResponse,
} from '@/features/lab/collection/samples.api';

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

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['sample-rejection-options', sampleId],
    queryFn: fetcher,
    enabled: enabled && !!sampleId,
    retry: false,
  });

  return {
    options: data ?? null,
    isLoading,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    refetch,
  };
}
