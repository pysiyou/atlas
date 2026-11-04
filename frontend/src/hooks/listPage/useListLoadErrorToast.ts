import { useEffect, useRef } from 'react';
import type { FeedbackId } from '@/types/generated/feedbackCatalog';
import { notify } from '@/feedback';

/**
 * Shows a catalog toast when a list/query load fails; dedupes repeated renders for the same error.
 */
export function useListLoadErrorToast(
  loadFailedKey: FeedbackId,
  isError: boolean,
  queryError: unknown,
  refetch: () => void
): void {
  const lastNotifiedRef = useRef<unknown>(null);

  useEffect(() => {
    if (!isError || queryError == null) {
      lastNotifiedRef.current = null;
      return;
    }
    if (lastNotifiedRef.current === queryError) return;
    lastNotifiedRef.current = queryError;
    notify.show(loadFailedKey, { error: queryError });
  }, [isError, queryError, loadFailedKey, refetch]);
}
