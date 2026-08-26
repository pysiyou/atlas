/**
 * Fetches API-driven sample rejection limits for collection workflow.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  sampleRejectionAPI,
  type SampleRejectionOptionsResponse,
} from '@/features/collection/api/sampleRejection';
import { getErrorMessage } from '@/utils/errors';
import { logger } from '@/utils/logger';

interface UseSampleRejectionOptionsOptions {
  sampleId?: number;
  enabled?: boolean;
}

export function useSampleRejectionOptions({
  sampleId,
  enabled = true,
}: UseSampleRejectionOptionsOptions) {
  const [options, setOptions] = useState<SampleRejectionOptionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOptions = useCallback(async () => {
    if (!sampleId) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await sampleRejectionAPI.getOptions(sampleId);
      setOptions(response);
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to load rejection options');
      setError(message);
      logger.error('Failed to fetch sample rejection options', err instanceof Error ? err : undefined, {
        sampleId,
      });
    } finally {
      setIsLoading(false);
    }
  }, [sampleId]);

  useEffect(() => {
    if (enabled && sampleId) {
      void fetchOptions();
    }
  }, [enabled, sampleId, fetchOptions]);

  return {
    options,
    isLoading,
    error,
    refetch: fetchOptions,
  };
}
