/**
 * API Client
 * Base HTTP client for making API requests
 * Ready for backend integration when available
 */

import { API_CONFIG } from '@/config/api';
import { logger } from '@/utils/logger';

export interface APIError {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
}

export class APIClient {
  private baseURL: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;

  constructor() {
    this.baseURL = API_CONFIG.baseURL;
    this.timeout = API_CONFIG.timeout;
    this.defaultHeaders = API_CONFIG.headers;
  }

  /**
   * Get authorization token from storage
   */
  private getAuthToken(): string | null {
    return sessionStorage.getItem('atlas_access_token');
  }

  /**
   * Build headers with authentication
   */
  private buildHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const headers = { ...this.defaultHeaders, ...customHeaders };
    const token = this.getAuthToken();
    
    if (token) {
      // console.log('DEBUG: Attaching token to request header');
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      console.warn('DEBUG: No token found in storage for request');
    }
    
    return headers;
  }

  /**
   * Handle API errors - async to parse response body
   */
  private async handleErrorAsync(error: unknown): Promise<never> {
    if (error instanceof Response) {
      if (error.status === 401 || error.status === 403) {
        // Clear token and redirect to login
        sessionStorage.removeItem('atlas_access_token');
        sessionStorage.removeItem('atlas_refresh_token');
        sessionStorage.removeItem('atlas_current_user');

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
   * Generic GET request
   */
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
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
