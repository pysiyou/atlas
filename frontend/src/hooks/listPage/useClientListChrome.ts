import type { FeedbackId } from '@/types/generated/feedbackCatalog';
import { toListLoadError, type ListLoadError } from './toListLoadError';

export interface UseClientListChromeOptions {
  loadFailedKey: FeedbackId;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
}

export interface UseClientListChromeReturn {
  loading: boolean;
  error: ListLoadError | null;
  onRetry: () => void;
}

/** Shared ListView wiring for client-filtered list pages (catalog, users). */
export function useClientListChrome({
  loadFailedKey,
  isLoading,
  isError,
  error: queryError,
  refetch,
}: UseClientListChromeOptions): UseClientListChromeReturn {
  const error = isError ? toListLoadError(loadFailedKey, queryError) : null;

  return {
    loading: isLoading,
    error,
    onRetry: refetch,
  };
}
