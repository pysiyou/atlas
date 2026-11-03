import type { FeedbackId } from '@/types/generated/feedbackCatalog';
import { useListLoadErrorToast } from './useListLoadErrorToast';

export interface UseClientListChromeOptions {
  loadFailedKey: FeedbackId;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
}

export interface UseClientListChromeReturn {
  loading: boolean;
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
  useListLoadErrorToast(loadFailedKey, isError, queryError, refetch);

  return {
    loading: isLoading,
    onRetry: refetch,
  };
}
