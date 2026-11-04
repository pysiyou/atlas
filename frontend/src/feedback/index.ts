/**
 * Catalogued user feedback — toasts via {@link notify.show}, inline copy via {@link inlineFeedbackMessage}.
 */

import {
  FEEDBACK_CATALOG,
  type FeedbackEntry,
  type FeedbackId,
  type FeedbackVariant,
} from '@/types/generated/feedbackCatalog';
import { isApiError } from '@/lib/api/errors';
import { getErrorMessage } from '@/utils/errors';
import { showToast } from './toast';
import { TOAST_ALERT_MESSAGE } from './ui';
import type { ToastVariant } from './ui';

export type { FeedbackId, FeedbackEntry, FeedbackVariant } from '@/types/generated/feedbackCatalog';

export function getFeedback(id: FeedbackId): FeedbackEntry {
  return FEEDBACK_CATALOG[id];
}

export function feedbackTitle(id: FeedbackId): string {
  return FEEDBACK_CATALOG[id].title;
}

let sessionExpired = false;

export function markSessionExpired(): void {
  sessionExpired = true;
}

export function clearSessionExpired(): void {
  sessionExpired = false;
}

export function isSessionExpired(): boolean {
  return sessionExpired;
}

function isUnauthorizedApiError(error: unknown): boolean {
  if (!isApiError(error)) return false;
  return error.status === 401 || error.code === 'UNAUTHORIZED';
}

/** True when the auth store already showed session.expired — skip a second toast. */
export function shouldSuppressApiErrorToast(error: unknown): boolean {
  return isSessionExpired() && isUnauthorizedApiError(error);
}

/** Visual toast tone from catalog variant (operation outcome, not clinical nature). */
export function toastOutcomeVariant(catalogVariant: FeedbackVariant): ToastVariant {
  switch (catalogVariant) {
    case 'success':
    case 'info':
      return 'success';
    case 'warning':
      return 'warning';
    case 'error':
    case 'danger':
      return 'error';
    default:
      return 'error';
  }
}

function resolveToastBrief(entry: FeedbackEntry): string {
  return entry.brief?.trim() || TOAST_ALERT_MESSAGE;
}

export type NotifyShowOptions = {
  error?: unknown;
};

function dispatchFromCatalog(id: FeedbackId, options?: NotifyShowOptions): void {
  const entry = getFeedback(id);

  if (entry.channel === 'inline') {
    if (import.meta.env.DEV) {
      console.warn(`[notify.show] "${id}" is channel "inline"; use inlineFeedbackMessage instead.`);
    }
    return;
  }

  if (options?.error != null && shouldSuppressApiErrorToast(options.error)) return;

  const outcomeVariant = options?.error != null ? 'error' : entry.variant;
  showToast(resolveToastBrief(entry), toastOutcomeVariant(outcomeVariant));
}

export const notify = {
  show(id: FeedbackId, options?: NotifyShowOptions) {
    dispatchFromCatalog(id, options);
  },

  apiError(id: FeedbackId, error: unknown) {
    notify.show(id, { error });
  },
};

export function inlineFeedbackMessage(id: FeedbackId, error?: unknown): string {
  if (error == null) return getFeedback(id).title;
  return getErrorMessage(error, getFeedback(id).title);
}

export {
  Alert,
  ErrorFallback,
  TOAST_ALERT_MESSAGE,
  type AlertProps,
  type ErrorFallbackProps,
  type ToastVariant,
} from './ui';

export { TOAST_DEFAULT_DURATION_MS, ToastHost, ToastProvider, useToastMountRef } from './toast';
export { ErrorBoundary } from './ErrorBoundary';
