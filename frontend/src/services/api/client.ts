/**
 * API Client
 * Base HTTP client for making API requests
 * Ready for backend integration when available
 *
 * Note: This file exceeds max-lines due to comprehensive API client implementation including
 * authentication, error handling, request queueing, and multiple HTTP method implementations.
 */
/* eslint-disable max-lines */

import { API_CONFIG } from '@/config/api';
import { logger } from '@/utils/logger';
import type { Patient, Order, Sample, Test, Payment, AuthUser } from '@/types';

/**
 * API Error structure returned by the client
 */
export interface APIError {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
}

/**
 * Type-safe API endpoint definitions
 * Maps endpoints to their expected response types
 */
export interface APIEndpoints {
  // Auth endpoints
  '/auth/login': { access_token: string; refresh_token: string; role: string };
  '/auth/refresh': { access_token: string; refresh_token?: string };
  '/auth/logout': void;
  '/auth/me': AuthUser;

  // Patient endpoints
  '/patients': Patient[];
  '/patients/:id': Patient;

  // Order endpoints
  '/orders': Order[];
  '/orders/:id': Order;

  // Sample endpoints
  '/samples': Sample[];
  '/samples/:id': Sample;
  '/samples/pending': Sample[];

  // Test catalog endpoints
  '/tests': Test[];
  '/tests/:id': Test;

  // Payment endpoints
  '/payments': Payment[];
  '/payments/:id': Payment;
}

/**
 * Type helper for extracting endpoint response type
 */
export type EndpointResponse<E extends keyof APIEndpoints> = APIEndpoints[E];

/**
 * Retry configuration for API requests
 */
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
};

/**
 * Execute a function with exponential backoff retry
 * @param fn - The async function to execute
 * @param config - Retry configuration
 * @returns The result of the function
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: Error | APIError = new Error('Unknown error');

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error | APIError;

      // Don't retry on 4xx errors (client errors) - these won't succeed on retry
      if (
        typeof error === 'object' &&
        error !== null &&
        'status' in error &&
        typeof (error as APIError).status === 'number'
      ) {
        const status = (error as APIError).status!;
        if (status >= 400 && status < 500) {
          throw error;
        }
      }

      // If we have retries left, wait with exponential backoff
      if (attempt < config.maxRetries) {
        const delay = Math.min(config.baseDelay * Math.pow(2, attempt), config.maxDelay);
        await new Promise(resolve => setTimeout(resolve, delay));
        logger.debug(`Retrying request (attempt ${attempt + 2}/${config.maxRetries + 1})`);
      }
    }
  }

  throw lastError;
}

/**
 * Auth callbacks interface for API client
 */
export interface AuthCallbacks {
  onAuthStateChange: (action: 'logout' | 'refresh') => void;
  onNavigate: (path: string) => void;
}

export class APIClient {
  private baseURL: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;
  private tokenGetter: (() => string | null) | null = null;
  private refreshTokenHandler: (() => Promise<string>) | null = null;
  private refreshQueue: {
    isRefreshInProgress: () => boolean;
    queueRequest: (req: {
      resolve: (value: unknown) => void;
      reject: (error: unknown) => void;
      retry: () => Promise<unknown>;
    }) => void;
    startRefresh: (fn: () => Promise<string>) => Promise<string>;
  } | null = null;
  private authCallbacks: AuthCallbacks | null = null;

  constructor() {
    this.baseURL = API_CONFIG.baseURL;
    this.timeout = API_CONFIG.timeout;
    this.defaultHeaders = API_CONFIG.headers;
  }

  /**
   * Set the token getter function (called from AuthProvider)
   * This allows the API client to get tokens from AuthContext
   */
  setTokenGetter(getter: () => string | null): void {
    this.tokenGetter = getter;
    logger.debug('Token getter set on API client');
  }

  /**
   * Set the refresh token handler (called from AuthProvider)
   * This allows the API client to refresh tokens when they expire
   */
  setRefreshTokenHandler(handler: () => Promise<string>): void {
    this.refreshTokenHandler = handler;
    logger.debug('Refresh token handler set on API client');
  }

  /**
   * Set the refresh queue (called from AuthProvider)
   * This allows the API client to queue requests during token refresh
   */
  setRefreshQueue(queue: {
    isRefreshInProgress: () => boolean;
    queueRequest: (req: {
      resolve: (value: unknown) => void;
      reject: (error: unknown) => void;
      retry: () => Promise<unknown>;
    }) => void;
    startRefresh: (fn: () => Promise<string>) => Promise<string>;
  }): void {
    this.refreshQueue = queue;
    logger.debug('Refresh queue set on API client');
  }

  /**
   * Set auth callbacks (called from AuthProvider)
   * This allows the API client to trigger auth state changes and navigation
   */
  setAuthCallbacks(callbacks: AuthCallbacks): void {
    this.authCallbacks = callbacks;
    logger.debug('Auth callbacks set on API client');
  }

  /**
   * Get authorization token from the token getter
   */
  private getAuthToken(): string | null {
    if (!this.tokenGetter) {
      return null;
    }

    return this.tokenGetter();
  }

  /**
   * Build headers with authentication
   */
  private buildHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const headers = { ...this.defaultHeaders, ...customHeaders };
    const token = this.getAuthToken();

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Handle 401 errors by attempting token refresh
   * @param originalRequest - Function to retry the original request
   * @returns Result of retried request
   */
  private async handle401Error<T>(originalRequest: () => Promise<T>): Promise<T> {
    // If refresh is already in progress, queue this request
    if (this.refreshQueue?.isRefreshInProgress()) {
      return new Promise<T>((resolve, reject) => {
        this.refreshQueue?.queueRequest({
          resolve: resolve as (value: unknown) => void,
          reject: reject as (error: unknown) => void,
          retry: originalRequest as () => Promise<unknown>,
        });
      });
    }

    // If we have a refresh handler, try to refresh
    if (this.refreshTokenHandler && this.refreshQueue) {
      try {
        logger.debug('401 error detected, attempting token refresh');
        await this.refreshQueue.startRefresh(this.refreshTokenHandler);

        // Retry the original request with new token
        return await originalRequest();
      } catch (refreshError) {
        logger.error(
          'Token refresh failed',
          refreshError instanceof Error ? refreshError : undefined
        );

        // Refresh failed - trigger logout
        if (this.authCallbacks) {
          this.authCallbacks.onAuthStateChange('logout');
          this.authCallbacks.onNavigate('/login');
        }

        throw refreshError;
      }
    }

    // No refresh handler - trigger logout
    if (this.authCallbacks) {
      this.authCallbacks.onAuthStateChange('logout');
      this.authCallbacks.onNavigate('/login');
    }

    const apiError: APIError = {
      message: 'Authentication failed. Please log in again.',
      status: 401,
    };
    throw apiError;
  }

  /**
   * Handle API errors - async to parse response body
   * Returns the result if 401 refresh succeeds, otherwise throws
   */
  private async handleErrorAsync(
    error: unknown,
    retryRequest?: () => Promise<unknown>
  ): Promise<unknown> {
    if (error instanceof Response) {
      // Handle 401 errors with token refresh
      if (error.status === 401 && retryRequest) {
        // handle401Error will either return the result or throw
        return await this.handle401Error(retryRequest);
      }

      // Handle 403 errors - trigger logout
      if (error.status === 403) {
        if (this.authCallbacks) {
          this.authCallbacks.onAuthStateChange('logout');
          this.authCallbacks.onNavigate('/login');
        }
      }

      // Try to parse error body for detailed message
      let errorMessage = error.statusText || 'API request failed';
      try {
        const errorBody = await error.json();
        if (errorBody.detail) {
          errorMessage = errorBody.detail;
        } else if (errorBody.message) {
          errorMessage = errorBody.message;
        }
      } catch {
        // If parsing fails, use statusText
      }

      const apiError: APIError = {
        message: errorMessage,
        status: error.status,
      };
      logger.error('API request failed', error, { status: error.status });
      throw apiError;
    }

    // Fallback for non-Response errors
    return this.handleError(error);
  }

  /**
   * Check if response is a 401 and handle refresh if needed
   * @param response - Response to check
   * @param retryRequest - Function to retry the request
   * @returns Response or result if refresh succeeded
   */
  private async handle401IfNeeded<T>(
    response: Response,
    retryRequest: () => Promise<T>
  ): Promise<T> {
    if (response.status === 401) {
      return await this.handle401Error(retryRequest);
    }
    // Not a 401, throw to be handled by handleErrorAsync
    await this.handleErrorAsync(response);
    throw new Error('Unreachable'); // TypeScript guard
  }

  /**
   * Handle API errors - sync version for non-Response errors
   */
  private handleError(error: unknown): never {
    if (error instanceof Response) {
      // Should use handleErrorAsync for Response objects
      const apiError: APIError = {
        message: error.statusText || 'API request failed',
        status: error.status,
      };
      logger.error('API request failed', error, { status: error.status });
      throw apiError;
    }

    if (error instanceof Error) {
      const apiError: APIError = {
        message: error.message,
      };
      logger.error('API request failed', error);
      throw apiError;
    }

    const apiError: APIError = {
      message: 'Unknown error occurred',
    };
    logger.error('API request failed with unknown error', error);
    throw apiError;
  }

  /**
   * Generic GET request with automatic retry for transient failures
   */
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    return withRetry(() => this._get<T>(endpoint, params));
  }

  /**
   * Internal GET implementation
   */
  private async _get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const makeRequest = async (): Promise<T> => {
      const url = new URL(`${this.baseURL}${endpoint}`);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.append(key, value);
        });
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.buildHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Handle 401 with token refresh
        if (response.status === 401) {
          return await this.handle401IfNeeded(response, makeRequest);
        }
        // Other errors
        await this.handleErrorAsync(response);
      }

      return await response.json();
    };

    try {
      return await makeRequest();
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Generic POST request
   */
  async post<T, D = unknown>(endpoint: string, data?: D): Promise<T> {
    const makeRequest = async (): Promise<T> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Handle 401 with token refresh
        if (response.status === 401) {
          return await this.handle401IfNeeded(response, makeRequest);
        }
        // Other errors
        await this.handleErrorAsync(response);
      }

      return await response.json();
    };

    try {
      return await makeRequest();
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Generic PUT request
   */
  async put<T, D = unknown>(endpoint: string, data?: D): Promise<T> {
    const makeRequest = async (): Promise<T> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'PUT',
        headers: this.buildHeaders(),
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Handle 401 with token refresh
        if (response.status === 401) {
          return await this.handle401IfNeeded(response, makeRequest);
        }
        // Other errors
        await this.handleErrorAsync(response);
      }

      return await response.json();
    };

    try {
      return await makeRequest();
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Generic DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    const makeRequest = async (): Promise<T> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'DELETE',
        headers: this.buildHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Handle 401 with token refresh
        if (response.status === 401) {
          return await this.handle401IfNeeded(response, makeRequest);
        }
        // Other errors
        await this.handleErrorAsync(response);
      }

      // DELETE may return empty response
      const text = await response.text();
      return text ? JSON.parse(text) : ({} as T);
    };

    try {
      return await makeRequest();
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Generic PATCH request
   */
  async patch<T, D = unknown>(endpoint: string, data?: D): Promise<T> {
    const makeRequest = async (): Promise<T> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'PATCH',
        headers: this.buildHeaders(),
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Handle 401 with token refresh
        if (response.status === 401) {
          return await this.handle401IfNeeded(response, makeRequest);
        }
        // Other errors
        await this.handleErrorAsync(response);
      }

      return await response.json();
    };

    try {
      return await makeRequest();
    } catch (error) {
      return this.handleError(error);
    }
  }
}

// Export singleton instance
export const apiClient = new APIClient();
