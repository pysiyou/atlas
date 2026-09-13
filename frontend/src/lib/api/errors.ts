/**
 * API error parsing and type guards.
 * Aligns with backend ErrorResponse: { error_code, message, details? }.
 */
import { logger } from '@/utils/logger';
import type { ApiError, ApiErrorDetail } from '@/types/schemas/error.schema';

export type { ApiError };

function parseDetailMessages(details: ApiErrorDetail[]): string {
  return details
    .map(detail => {
      if (detail.field && detail.message) return `${detail.field}: ${detail.message}`;
      return detail.message;
    })
    .filter(Boolean)
    .join('; ');
}

export function parseErrorMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object') return fallback;

  const record = body as Record<string, unknown>;

  if (Array.isArray(record.details) && record.details.length > 0) {
    const detailMessages = parseDetailMessages(record.details as ApiErrorDetail[]);
    if (detailMessages.length > 0) return detailMessages;
  }

  const raw =
    'detail' in record ? record.detail : 'message' in record ? record.message : undefined;
  if (Array.isArray(raw)) {
    return (
      raw
        .map((d: { msg?: string; message?: string }) => d?.msg ?? d?.message)
        .filter(Boolean)
        .join('; ') || fallback
    );
  }
  if (typeof raw === 'string') return raw;
  if (raw != null) return String(raw);
  return fallback;
}

export async function parseErrorResponse(response: Response): Promise<ApiError> {
  let message = response.statusText || 'Request failed';
  let code: string | undefined;
  let details: ApiErrorDetail[] | undefined;

  try {
    const body = await response.json();
    if (body && typeof body === 'object') {
      const record = body as Record<string, unknown>;
      message = parseErrorMessage(body, message);

      const errorCode = record.error_code ?? record.code;
      if (typeof errorCode === 'string') {
        code = errorCode;
      }

      if (Array.isArray(record.details)) {
        details = record.details as ApiErrorDetail[];
      }
    }
  } catch {
    // Use statusText
  }

  return { message, code, status: response.status, details };
}

export function parseSuccessResponse<T>(response: Response): Promise<T> {
  return response.text().then(text => {
    try {
      return text ? JSON.parse(text) : ({} as T);
    } catch (parseError) {
      const err: ApiError = {
        message: (parseError as Error).message || 'Invalid response',
        status: response.status,
      };
      throw err;
    }
  });
}

export function isApiError(error: unknown): error is ApiError {
  return Boolean(error && typeof error === 'object' && 'message' in error);
}

export function isAbortError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'name' in error &&
      (error as { name?: string }).name === 'AbortError'
  );
}

export function toNetworkError(error: unknown): ApiError {
  const err = error as Error;
  logger.error('API request failed', err);
  return { message: err.message || 'Network error' };
}
