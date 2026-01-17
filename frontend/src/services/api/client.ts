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
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  /**
   * Handle API errors
   */
  private handleError(error: unknown): never {
    if (error instanceof Response) {
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
        this.handleError(response);
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
        this.handleError(response);
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
        this.handleError(response);
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
        this.handleError(response);
      }

      return await response.json();
    } catch (error) {
      return this.handleError(error);
    }
  }
}

// Export singleton instance
export const apiClient = new APIClient();
