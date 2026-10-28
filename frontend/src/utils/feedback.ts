/**
 * Catalogued user feedback: copy, toasts, API error mapping, session-expiry latch.
 *
 * Feature code should import from `@/utils/feedback` — not from `@/app/AppToastBar`.
 */

import { toast } from '@/app/AppToastBar';
import type { ToastAction } from '@/components/overlays/Toast';
import { FEEDBACK_CATALOG, type FeedbackEntry, type FeedbackId } from '@/utils/feedbackCatalog';
import { isApiError } from '@/lib/api/errors';
import { getErrorMessage } from '@/utils/errors';

// ---------------------------------------------------------------------------
// Catalog copy (safe to import from utils/errors)
// ---------------------------------------------------------------------------

export function getFeedback(id: FeedbackId): FeedbackEntry {
  return FEEDBACK_CATALOG[id];
}

export function feedbackTitle(id: FeedbackId): string {
  return FEEDBACK_CATALOG[id].title;
}

export function feedbackSubtitle(id: FeedbackId): string | undefined {
  return FEEDBACK_CATALOG[id].subtitle;
}

// ---------------------------------------------------------------------------
// Session-expiry latch (401 toast once from auth store)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// API errors → catalog copy
// ---------------------------------------------------------------------------

/** Backend `error_code` → catalog ID (unknown codes fall through to the server message). */
const API_ERROR_CODE_TO_FEEDBACK: Record<string, FeedbackId> = {
  NOT_FOUND: 'api.notFound',
  VALIDATION_ERROR: 'api.validationError',
  FORBIDDEN: 'api.permissionDenied',
  BUSINESS_RULE_VIOLATION: 'api.businessRule',
  LAB_OPERATION_ERROR: 'api.labOperation',
  INTERNAL_ERROR: 'api.serverError',
  DATABASE_ERROR: 'api.databaseError',
  UNAUTHORIZED: 'api.sessionExpired',
  BAD_REQUEST: 'api.badRequest',
  CONFLICT: 'api.conflict',
  ERROR: 'api.serverError',
};

function isUnauthorizedApiError(error: unknown): boolean {
  if (!isApiError(error)) return false;
  return error.status === 401 || error.code === 'UNAUTHORIZED';
}

/** True when the auth store already showed session.expired — skip a second toast. */
export function shouldSuppressApiErrorToast(error: unknown): boolean {
  return isSessionExpired() && isUnauthorizedApiError(error);
}

export function resolveFeedbackForApiError(
  error: unknown,
  contextId: FeedbackId
): { title: string; subtitle: string } {
  const context = getFeedback(contextId);
  const title = context.title;
  const fallbackSubtitle = context.subtitle ?? 'Please try again.';

  if (isApiError(error)) {
    const serverMessage = error.message?.trim();
    if (serverMessage) {
      return { title, subtitle: serverMessage };
    }
    if (error.code && API_ERROR_CODE_TO_FEEDBACK[error.code]) {
      return { title, subtitle: feedbackTitle(API_ERROR_CODE_TO_FEEDBACK[error.code]) };
    }
  }

  return {
    title,
    subtitle: getErrorMessage(error, fallbackSubtitle),
  };
}

// ---------------------------------------------------------------------------
// Toasts and inline messages
// ---------------------------------------------------------------------------

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
