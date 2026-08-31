/**
 * useFetchedResource — shared fetch/error/loading state for one-shot API reads.
 */

import { useState, useCallback, useEffect } from 'react';
import { getErrorMessage } from '@/utils/errors';
import { logger } from '@/utils/logger';

export interface UseFetchedResourceOptions {
  enabled?: boolean;
  errorMessage?: string;
  logContext?: Record<string, unknown>;
}

export function useFetchedResource<T>(
  fetcher: () => Promise<T>,
  deps: readonly unknown[],
  options: UseFetchedResourceOptions = {}
) {
  const { enabled = true, errorMessage = 'Failed to load data', logContext } = options;
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetcher();
      setData(response);
    } catch (err) {
      const message = getErrorMessage(err, errorMessage);
      setError(message);
      logger.error(errorMessage, err instanceof Error ? err : undefined, logContext);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller controls invalidation via deps
  }, [enabled, errorMessage, fetcher, ...deps]);

  useEffect(() => {
    if (enabled) {
      void refetch();
    }
  }, [enabled, refetch]);

  const clearError = useCallback(() => setError(null), []);

  return { data, isLoading, error, refetch, clearError, setData };
}
