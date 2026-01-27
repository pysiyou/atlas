/**
 * API Client
 *
 * HTTP client with JWT authentication, automatic token refresh, and retry logic.
 */
import { API_CONFIG } from '@/config/api';
import { logger } from '@/utils/logger';

export interface APIError {
  message: string;
  status?: number;
}

type TokenGetter = () => string | null;
type RefreshHandler = () => Promise<string | null>;

/**
 * Type guard to check if error is an APIError
 */
function isAPIError(error: unknown): error is APIError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  );
}

class APIClient {
  private baseURL = API_CONFIG.baseURL;
  private timeout = API_CONFIG.timeout;
  private headers = API_CONFIG.headers;

  private getToken: TokenGetter = () => null;
  private refreshToken: RefreshHandler = async () => null;
  private csrfToken: string | null = null;

  /**
   * Set CSRF token for CSRF protection
   * Should be called after login or when CSRF token is received from backend
   * Backend should provide CSRF token via response header or initial API call
   */
  setCsrfToken(token: string | null): void {
    this.csrfToken = token;
  }

  setTokenGetter(getter: TokenGetter): void {
    this.getToken = getter;
  }

  setRefreshTokenHandler(handler: RefreshHandler): void {
    this.refreshToken = handler;
  }

  private async request<T>(
    method: string,
    endpoint: string,
    data?: unknown,
    isRetry = false
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    const headers: Record<string, string> = { ...this.headers };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // CSRF protection: Add CSRF token for state-changing requests
    // Note: Backend must support CSRF tokens and provide them via:
    // - Response header (X-CSRF-Token) after login
    // - Cookie with SameSite=Strict attribute
    // - Or initial API endpoint that returns CSRF token
    if (this.csrfToken && (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE')) {
      headers['X-CSRF-Token'] = this.csrfToken;
    }
    
    // Alternative: Use SameSite cookies (configured on backend)
    // If backend sets cookies with SameSite=Strict, CSRF protection is automatic
    // This header indicates we expect SameSite cookie behavior
    headers['X-Requested-With'] = 'XMLHttpRequest';

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const text = await response.text();
        if (!text || text.trim().length === 0) {
          // Return undefined for void responses, empty object for object responses
          // Type system will handle this appropriately
          return undefined as T;
        }
        try {
          return JSON.parse(text) as T;
        } catch (parseError) {
          logger.error('Failed to parse JSON response', parseError instanceof Error ? parseError : undefined);
          const apiError: APIError = { message: 'Invalid JSON response from server', status: response.status };
          throw apiError;
        }
      }

      // Handle 401 - try refresh once
      if (response.status === 401 && !isRetry) {
        try {
          const newToken = await this.refreshToken();
          if (newToken) {
            return this.request<T>(method, endpoint, data, true);
          }
        } catch (refreshError) {
          // If refresh fails, preserve 401 status instead of converting to generic error
          logger.error('Token refresh failed', refreshError instanceof Error ? refreshError : undefined);
          // Fall through to error handling below to preserve 401 status
        }
      }

      // Parse error response
      let message = response.statusText || 'Request failed';
      try {
        const body = await response.json();
        message = body.detail || body.message || message;
      } catch {
        // Use statusText
      }

      const apiError: APIError = { message, status: response.status };
      throw apiError;
    } catch (error) {
      clearTimeout(timeoutId);

      // If it's already an APIError, re-throw it
      if (isAPIError(error)) {
        throw error;
      }

      // Otherwise, wrap it as an APIError
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('API request failed', err);
      const apiError: APIError = { message: err.message || 'Network error' };
      throw apiError;
    }
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url = `${endpoint}?${searchParams.toString()}`;
    }
    return this.request<T>('GET', url);
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>('POST', endpoint, data);
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>('PUT', endpoint, data);
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>('PATCH', endpoint, data);
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>('DELETE', endpoint);
  }
}

export const apiClient = new APIClient();
