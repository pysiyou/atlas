/**
 * Map backend ErrorResponse.error_code onto catalog copy.
 * Mutation context IDs keep the toast title; codes refine the subtitle.
 */

import { isApiError } from '@/lib/api/errors';
import type { FeedbackId } from '@/config/feedbackCatalog';
import { getErrorMessage } from '@/utils/errors';
import { feedbackTitle, getFeedback } from './copy';
import { isSessionExpired } from './sessionExpiry';

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
