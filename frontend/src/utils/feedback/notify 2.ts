/**
 * Typed helpers for surfacing catalogued feedback via toast or inline copy.
 *
 * Feature code should import from `@/utils/feedback` — not from `@/app/AppToastBar`.
 */

import { toast } from '@/app/AppToastBar';
import type { ToastAction } from '@/components/overlays/Toast';
import type { FeedbackId, FeedbackEntry } from '@/config/feedbackCatalog';
import { getErrorMessage } from '@/utils/errors';
import { getFeedback } from './copy';
import { resolveFeedbackForApiError, shouldSuppressApiErrorToast } from './resolveApiError';

export { getFeedback, feedbackTitle, feedbackSubtitle } from './copy';
export { resolveFeedbackForApiError } from './resolveApiError';

export type ToastOverrides = {
  title?: string;
  subtitle?: string;
  actions?: ToastAction[];
};

function buildToastPayload(entry: FeedbackEntry, overrides?: ToastOverrides) {
  return {
    title: overrides?.title ?? entry.title,
    subtitle: overrides?.subtitle ?? entry.subtitle,
    actions: overrides?.actions,
  };
}

function dispatchToast(
  variant: FeedbackEntry['variant'],
  payload: ReturnType<typeof buildToastPayload>
) {
  switch (variant) {
    case 'success':
      toast.success(payload);
      break;
    case 'error':
    case 'danger':
      toast.error(payload);
      break;
    case 'warning':
      toast.warning(payload);
      break;
    case 'info':
      toast.info(payload);
      break;
    default:
      toast(payload);
  }
}

export const notify = {
  toast(id: FeedbackId, overrides?: ToastOverrides) {
    dispatchToast(getFeedback(id).variant, buildToastPayload(getFeedback(id), overrides));
  },

  apiError(id: FeedbackId, error: unknown, fallbackSubtitle?: string) {
    if (shouldSuppressApiErrorToast(error)) return;
    const payload = resolveFeedbackForApiError(error, id);
    toast.error({
      title: payload.title,
      subtitle: fallbackSubtitle ?? payload.subtitle,
    });
  },
};

/** Fallback title for ErrorAlert / list shells when the query error has no message. */
export function errorAlertMessage(id: FeedbackId, error: unknown): string {
  return getErrorMessage(error, getFeedback(id).title);
}

/** Inline banner / field error from catalog (optional API detail appended). */
export function inlineFeedbackMessage(id: FeedbackId, error?: unknown): string {
  if (error == null) return getFeedback(id).title;
  return getErrorMessage(error, getFeedback(id).title);
}
