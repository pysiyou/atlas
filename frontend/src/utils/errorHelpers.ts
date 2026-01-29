/**
 * Error Helper Utilities
 * Provides consistent error message extraction and user-friendly formatting
 */

/**
 * Extract a user-friendly error message from an unknown error
 * @param error - The error object (can be any type)
 * @param fallback - Fallback message if error type cannot be determined
 * @returns A user-friendly error message string
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Check for specific error types and provide user-friendly messages
    if (message.includes('network') || message.includes('fetch')) {
      return 'Network error. Please check your connection and try again.';
    }
    if (message.includes('401') || message.includes('unauthorized')) {
      return 'Session expired. Please log in again.';
    }
    if (message.includes('403') || message.includes('forbidden')) {
      return 'You do not have permission to perform this action.';
    }
    if (message.includes('404') || message.includes('not found')) {
      return 'The requested resource was not found.';
    }
    if (message.includes('409') || message.includes('conflict')) {
      return 'A conflict occurred. The resource may have been modified.';
    }
    if (message.includes('500') || message.includes('server error')) {
      return 'A server error occurred. Please try again later.';
    }
    if (message.includes('timeout')) {
      return 'The request timed out. Please try again.';
    }

    // Return the original message if it's reasonably user-friendly
    if (error.message.length < 100 && !message.includes('error:')) {
      return error.message;
    }
  }

  // Check for API error objects with message property
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const apiError = error as { message: string };
    if (typeof apiError.message === 'string') {
      return apiError.message;
    }
  }

  return fallback;
}

/**
 * User-friendly message for payment mutations (e.g. 409 = order already paid).
 */
export function getPaymentErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as { status?: number }).status;
    if (status === 409) {
      return 'This order is already paid. Refresh the page to see the latest status.';
    }
  }
  return getErrorMessage(error, fallback);
}

/**
 * True when we did not get a clear server response (network/timeout/abort).
 * Use to show "Action may have completed; please refresh" for critical mutations.
 */
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

/**
 * Type guard to check if an error is an instance of Error
 * @param error - The error to check
 * @returns True if error is an Error instance
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Extract error details for logging (more verbose than user message)
 * @param error - The error object
 * @returns Object with error details for logging
 */
export function getErrorDetails(error: unknown): {
  message: string;
  stack?: string;
  code?: string;
  status?: number;
} {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
    };
  }

  if (typeof error === 'object' && error !== null) {
    const obj = error as Record<string, unknown>;
    return {
      message: String(obj.message || 'Unknown error'),
      code: obj.code as string | undefined,
      status: obj.status as number | undefined,
    };
  }

  return {
    message: String(error),
  };
}
