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

class APIClient {
  private baseURL = API_CONFIG.baseURL;
  private timeout = API_CONFIG.timeout;
  private headers = API_CONFIG.headers;

  private getToken: TokenGetter = () => null;
  private refreshToken: RefreshHandler = async () => null;

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
        return text ? JSON.parse(text) : ({} as T);
      }

      // Handle 401 - try refresh once
      if (response.status === 401 && !isRetry) {
        const newToken = await this.refreshToken();
        if (newToken) {
          return this.request<T>(method, endpoint, data, true);
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

      throw { message, status: response.status } as APIError;
    } catch (error) {
      clearTimeout(timeoutId);

      if ((error as APIError).status) {
        throw error;
      }

      const err = error as Error;
      logger.error('API request failed', err);
      throw { message: err.message || 'Network error' } as APIError;
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
