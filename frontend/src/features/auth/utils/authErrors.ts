/**
 * Authentication Error Handling Utilities
 * Centralizes auth error handling, recovery strategies, and network failure handling
 */

import { logger } from '@/utils/logger';
import type { APIError } from '@/services/api/client';

/**
 * Custom error class for authentication failures
 * Provides specific error codes for different failure scenarios
 * Defined here to avoid mixing non-component exports in AuthProvider (breaks Fast Refresh).
 */
export class AuthError extends Error {
  /** Error code for categorizing the error type */
  code: 'INVALID_CREDENTIALS' | 'NETWORK_ERROR' | 'SERVER_ERROR' | 'TIMEOUT' | 'UNKNOWN';
  /** HTTP status code if available */
  status?: number;

  constructor(message: string, code: AuthError['code'], status?: number) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.status = status;
  }
}

/**
 * Check if an error is a network-related error
 * @param error - Error to check
 * @returns true if error is network-related
 */
export function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const errorMessage = error.message?.toLowerCase() || '';

  return (
    errorMessage.includes('fetch') ||
    errorMessage.includes('network') ||
    errorMessage.includes('failed to fetch') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('econnrefused') ||
    errorMessage === 'load failed' ||
    errorMessage === 'networkerror when attempting to fetch resource' ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('abort')
  );
}

/**
 * Check if an error is a timeout error
 * @param error - Error to check
 * @returns true if error is a timeout
 */
export function isTimeoutError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const errorMessage = error.message?.toLowerCase() || '';
  return errorMessage.includes('abort') || errorMessage.includes('timeout');
}

/**
 * Check if an error indicates invalid or expired credentials
 * @param error - Error to check
 * @returns true if error indicates auth failure
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof AuthError) {
    return error.code === 'INVALID_CREDENTIALS';
  }

  if (typeof error === 'object' && error !== null && 'status' in error) {
    const apiError = error as APIError;
    return apiError.status === 401 || apiError.status === 403;
  }

  return false;
}

/**
 * Convert an API error to an AuthError
 * @param error - API error to convert
 * @returns AuthError instance
 */
export function toAuthError(error: unknown): AuthError {
  // If already an AuthError, return as-is
  if (error instanceof AuthError) {
    return error;
  }

  // Handle APIError
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const apiError = error as APIError;

    // Network errors
    if (!apiError.status) {
      if (isTimeoutError(error)) {
        return new AuthError(
          'Request timed out. Please check your connection and try again.',
          'TIMEOUT'
        );
      }

      if (isNetworkError(error)) {
        return new AuthError(
          'Unable to connect to the server. Please check if the server is running.',
          'NETWORK_ERROR'
        );
      }

      return new AuthError(
        'Unable to connect to the server. Please try again later.',
        'NETWORK_ERROR'
      );
    }

    // HTTP 401 - Invalid credentials
    if (apiError.status === 401) {
      return new AuthError('Invalid username or password', 'INVALID_CREDENTIALS', 401);
    }

    // HTTP 403 - Forbidden
    if (apiError.status === 403) {
      return new AuthError(
        apiError.message || 'Access denied. Your account may be disabled.',
        'INVALID_CREDENTIALS',
        403
      );
    }

    // HTTP 5xx - Server errors
    if (apiError.status >= 500) {
      return new AuthError(
        'Server error occurred. Please try again later.',
        'SERVER_ERROR',
        apiError.status
      );
    }

    // Other HTTP errors (400, 404, etc.)
    if (apiError.status >= 400) {
      return new AuthError(
        apiError.message || 'Request failed. Please try again.',
        'UNKNOWN',
        apiError.status
      );
    }
  }

  // Handle generic Error objects
  if (error instanceof Error) {
    if (isTimeoutError(error)) {
      return new AuthError(
        'Request timed out. Please check your connection and try again.',
        'TIMEOUT'
      );
    }

    if (isNetworkError(error)) {
      return new AuthError(
        'Unable to connect to the server. Please check if the server is running.',
        'NETWORK_ERROR'
      );
    }

    return new AuthError(
      error.message || 'An unexpected error occurred. Please try again.',
      'UNKNOWN'
    );
  }

  // Fallback for unknown errors
  return new AuthError('An unexpected error occurred. Please try again.', 'UNKNOWN');
}

/**
 * Retry configuration for auth operations
 */
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

/**
 * Default retry configuration for auth operations
 */
const DEFAULT_AUTH_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
};

/**
 * Execute a function with retry logic for network errors
 * Only retries on network errors, not on auth errors
 * @param fn - Function to execute
 * @param config - Retry configuration
 * @returns Result of the function
 */
export async function withAuthRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_AUTH_RETRY_CONFIG
): Promise<T> {
  let lastError: Error | AuthError = new Error('Unknown error');

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      // Don't retry on auth errors (401, 403) - these won't succeed on retry
      if (isAuthError(error)) {
        throw toAuthError(error);
      }

      // Don't retry on non-network errors
      if (!isNetworkError(error) && !isTimeoutError(error)) {
        throw toAuthError(error);
      }

      // If we have retries left, wait with exponential backoff
      if (attempt < config.maxRetries) {
        const delay = Math.min(config.baseDelay * Math.pow(2, attempt), config.maxDelay);
        logger.debug(`Retrying auth operation (attempt ${attempt + 2}/${config.maxRetries + 1})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw toAuthError(lastError);
}

/**
 * Handle storage errors gracefully
 * @param operation - Description of the storage operation
 * @param error - Error that occurred
 * @returns true if error was handled, false otherwise
 */
export function handleStorageError(operation: string, error: unknown): boolean {
  if (error instanceof DOMException) {
    if (error.name === 'QuotaExceededError') {
      logger.warn(`Storage quota exceeded during ${operation}`);
      return true;
    }
    if (error.name === 'SecurityError') {
      logger.warn(`Storage security error during ${operation} (possibly private browsing mode)`);
      return true;
    }
  }

  logger.warn(
    `Storage error during ${operation}`,
    error instanceof Error ? { error: error.message } : undefined
  );
  return true;
}
