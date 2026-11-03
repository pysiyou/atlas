/**
 * Catalogued user feedback: copy, toasts, API error mapping, session-expiry latch.
 *
 * Transient UI feedback: use {@link notify.show} (or {@link notify.apiError} for failures).
 * Inline form copy: use {@link inlineFeedbackMessage} for catalog `inline` entries.
 *
 * Feature code: use {@link notify.show} for transient feedback (not direct `toast` import).
 */

import { toast, type ToastAction } from '@/components/feedback/notices';
import { FEEDBACK_CATALOG, type FeedbackEntry, type FeedbackId } from '@/types/generated/feedbackCatalog';
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

/** Options for {@link notify.show} — catalog-driven transient feedback. */
export type NotifyShowOptions = ToastOverrides & {
  /** When set, subtitle is merged from API / thrown error detail. */
  error?: unknown;
  /** Adds a Retry action chip (typical for load failures). */
  onRetry?: () => void;
};

function mergeNotifyActions(
  overrides: ToastOverrides | undefined,
  onRetry: (() => void) | undefined
): ToastAction[] | undefined {
  const merged = [...(overrides?.actions ?? []), ...(onRetry ? [{ label: 'Retry', onClick: onRetry }] : [])];
  return merged.length > 0 ? merged : undefined;
}

function dispatchFromCatalog(id: FeedbackId, options?: NotifyShowOptions): void {
  const entry = getFeedback(id);

  if (entry.channel === 'inline') {
    if (import.meta.env.DEV) {
      console.warn(`[notify.show] "${id}" is channel "inline"; use inlineFeedbackMessage instead.`);
    }
    return;
  }

  let title = options?.title ?? entry.title;
  let subtitle = options?.subtitle ?? entry.subtitle;

  if (options?.error != null) {
    if (shouldSuppressApiErrorToast(options.error)) return;
    const resolved = resolveFeedbackForApiError(options.error, id);
    title = options?.title ?? resolved.title;
    subtitle = options?.subtitle ?? resolved.subtitle;
  }

  const payload = {
    title,
    subtitle,
    actions: mergeNotifyActions(options, options?.onRetry),
  };

  const send =
    entry.variant === 'success'
      ? toast.success
      : entry.variant === 'warning'
        ? toast.warning
        : entry.variant === 'info'
          ? toast.info
          : entry.variant === 'error' || entry.variant === 'danger'
            ? toast.error
            : toast;

  send(payload);
}

/**
 * Catalog-driven transient feedback. Prefer `show` over `toast` / direct toast imports.
 */
export const notify = {
  /** Canonical API: respects catalog channel; toasts for toast | alert | errorAlert. */
  show(id: FeedbackId, options?: NotifyShowOptions) {
    dispatchFromCatalog(id, options);
  },

  /** @deprecated Alias for {@link notify.show} without error/retry options. */
  toast(id: FeedbackId, overrides?: ToastOverrides) {
    notify.show(id, overrides);
  },

  apiError(id: FeedbackId, error: unknown, fallbackSubtitle?: string) {
    notify.show(id, { error, subtitle: fallbackSubtitle });
  },
};

/** Inline banner / field error from catalog (optional API detail appended). */
export function inlineFeedbackMessage(id: FeedbackId, error?: unknown): string {
  if (error == null) return getFeedback(id).title;
  return getErrorMessage(error, getFeedback(id).title);
}
