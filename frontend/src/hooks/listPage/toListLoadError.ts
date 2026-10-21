import type { FeedbackId } from '@/config/feedbackCatalog';
import { errorAlertMessage } from '@/utils/feedback';

export interface ListLoadError {
  message: string;
  operation: 'load';
}

/** Standard ListView error object for failed list queries. */
export function toListLoadError(
  catalogKey: FeedbackId,
  error: unknown,
): ListLoadError | null {
  if (error == null) return null;
  return {
    message: errorAlertMessage(catalogKey, error),
    operation: 'load',
  };
}
