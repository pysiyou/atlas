/**
 * Typed helpers for surfacing catalogued feedback via toast or inline copy.
 *
 * Feature code should import from `@/utils/feedback` — not from `@/app/AppToastBar`.
 */

import { toast } from '@/app/AppToastBar';
import type { ToastAction } from '@/components/overlays/toast';
import type { FeedbackId, FeedbackEntry } from '@/config/feedbackCatalog';
import { getErrorMessage } from '@/utils/errors';
import { getFeedback } from './copy';

export { getFeedback, feedbackTitle, feedbackSubtitle } from './copy';

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

function toErrorToastPayload(
  error: unknown,
  title: string,
  fallbackSubtitle = 'Please try again.'
): { title: string; subtitle: string } {
  return {
    title,
    subtitle: getErrorMessage(error, fallbackSubtitle),
  };
}

export const notify = {
  toast(id: FeedbackId, overrides?: ToastOverrides) {
    dispatchToast(getFeedback(id).variant, buildToastPayload(getFeedback(id), overrides));
  },

  apiError(id: FeedbackId, error: unknown, fallbackSubtitle?: string) {
    const entry = getFeedback(id);
    toast.error(
      toErrorToastPayload(error, entry.title, fallbackSubtitle ?? entry.subtitle ?? 'Please try again.')
    );
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
