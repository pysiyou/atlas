/**
 * API Client
 * Base HTTP client for making API requests
 * Ready for backend integration when available
 */

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

export class APIClient {
  private baseURL: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;
  private tokenGetter: (() => string | null) | null = null;

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
   * Handle API errors - async to parse response body
   */
  private async handleErrorAsync(error: unknown): Promise<never> {
    if (error instanceof Response) {
      if (error.status === 401 || error.status === 403) {
        // Clear token getter and redirect to login
        // The AuthProvider will handle clearing the token via logout
        this.tokenGetter = null;

        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
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
    try {
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
        await this.handleErrorAsync(response);
      }

      return await response.json();
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Generic POST request
   */
  async post<T, D = unknown>(endpoint: string, data?: D): Promise<T> {
    try {
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
        await this.handleErrorAsync(response);
      }

      return await response.json();
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Generic PUT request
   */
  async put<T, D = unknown>(endpoint: string, data?: D): Promise<T> {
    try {
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
        await this.handleErrorAsync(response);
      }

      return await response.json();
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Generic DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'DELETE',
        headers: this.buildHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        await this.handleErrorAsync(response);
      }

      // DELETE may return empty response
      const text = await response.text();
      return text ? JSON.parse(text) : ({} as T);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Generic PATCH request
   */
  async patch<T, D = unknown>(endpoint: string, data?: D): Promise<T> {
    try {
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
        await this.handleErrorAsync(response);
      }

      return await response.json();
    } catch (error) {
      return this.handleError(error);
    }
  }
}

// Export singleton instance
export const apiClient = new APIClient();
