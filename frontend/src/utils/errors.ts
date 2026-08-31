/**
 * Error Handling Utilities
 * Consistent error message extraction and classification.
 */

export function getLoginErrorMessage(error: unknown, fallback = 'Login failed. Please try again.'): string {
  if (!(error instanceof Error)) return fallback;

  const msg = error.message.toLowerCase();

  if (msg.includes('fetch') || msg.includes('network') || msg === 'load failed') {
    return 'Unable to connect to server. Please check your connection.';
  }
  if (msg.includes('abort') || msg.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }
  if (msg.includes('invalid') || msg.includes('unauthorized') || msg.includes('401')) {
    return 'Invalid username or password';
  }

  return error.message || fallback;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes('network') || message.includes('fetch'))
      return 'Network error. Please check your connection and try again.';
    if (message.includes('401') || message.includes('unauthorized'))
      return 'Session expired. Please log in again.';
    if (message.includes('403') || message.includes('forbidden'))
      return 'You do not have permission to perform this action.';
    if (message.includes('404') || message.includes('not found'))
      return 'The requested resource was not found.';
    if (message.includes('409') || message.includes('conflict'))
      return 'A conflict occurred. The resource may have been modified.';
    if (message.includes('500') || message.includes('server error'))
      return 'A server error occurred. Please try again later.';
    if (message.includes('timeout')) return 'The request timed out. Please try again.';
    if (error.message.length < 100 && !message.includes('error:')) return error.message;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const apiError = error as { message: string };
    if (typeof apiError.message === 'string') return apiError.message;
  }
  return fallback;
}

export function getPaymentErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as { status?: number }).status;
    if (status === 409)
      return 'This order is already paid. Refresh the page to see the latest status.';
  }
  return getErrorMessage(error, fallback);
}

export function isLikelyNetworkOrTimeout(error: unknown): boolean {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as { status?: number }).status;
    if (typeof status === 'number' && status >= 400) return false;
  }
  const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return (
    msg.includes('network') ||
    msg.includes('fetch') ||
    msg.includes('abort') ||
    msg.includes('timeout') ||
    msg === 'load failed'
  );
}

export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

export function getErrorDetails(error: unknown): {
  message: string;
  stack?: string;
  code?: string;
  status?: number;
} {
  if (error instanceof Error) return { message: error.message, stack: error.stack };
  if (typeof error === 'object' && error !== null) {
    const obj = error as Record<string, unknown>;
    return {
      message: String(obj.message || 'Unknown error'),
      code: obj.code as string | undefined,
      status: obj.status as number | undefined,
    };
  }
  return { message: String(error) };
}
