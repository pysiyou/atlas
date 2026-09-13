/**
 * HTTP client with JWT authentication, automatic token refresh, and retry logic.
 */
import { API_CONFIG } from '@/config/api';
import {
  isAbortError,
  isApiError,
  parseErrorResponse,
  parseSuccessResponse,
  toNetworkError,
} from './errors';

export type { ApiError, APIError } from './errors';

type TokenGetter = () => string | null;
type RefreshHandler = () => Promise<string | null>;

function linkAbortSignal(
  externalSignal: AbortSignal | undefined,
  controller: AbortController,
  timeoutId: ReturnType<typeof setTimeout>
): void {
  if (!externalSignal) return;

  if (externalSignal.aborted) {
    clearTimeout(timeoutId);
    throw Object.assign(new Error('Aborted'), { name: 'AbortError' });
  }

  externalSignal.addEventListener('abort', () => controller.abort());
}

function buildAuthHeaders(
  baseHeaders: Record<string, string>,
  getToken: TokenGetter
): Record<string, string> {
  const headers = { ...baseHeaders };
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

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
    options?: { signal?: AbortSignal; isRetry?: boolean }
  ): Promise<T> {
    const { signal: externalSignal, isRetry = false } = options ?? {};
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    linkAbortSignal(externalSignal, controller, timeoutId);

    const headers = buildAuthHeaders(this.headers, this.getToken);

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return parseSuccessResponse<T>(response);
      }

      if (response.status === 401 && !isRetry) {
        const newToken = await this.refreshToken();
        if (newToken) {
          return this.request<T>(method, endpoint, data, { isRetry: true });
        }
      }

      throw await parseErrorResponse(response);
    } catch (error) {
      clearTimeout(timeoutId);

      if (isApiError(error) || isAbortError(error)) {
        throw error;
      }

      throw toNetworkError(error);
    }
  }

  async get<T>(
    endpoint: string,
    params?: Record<string, string>,
    options?: { signal?: AbortSignal }
  ): Promise<T> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url = `${endpoint}?${searchParams.toString()}`;
    }
    return this.request<T>('GET', url, undefined, options);
  }

  async post<T>(endpoint: string, data?: unknown, options?: { signal?: AbortSignal }): Promise<T> {
    return this.request<T>('POST', endpoint, data, options);
  }

  async put<T>(endpoint: string, data?: unknown, options?: { signal?: AbortSignal }): Promise<T> {
    return this.request<T>('PUT', endpoint, data, options);
  }

  async patch<T>(endpoint: string, data?: unknown, options?: { signal?: AbortSignal }): Promise<T> {
    return this.request<T>('PATCH', endpoint, data, options);
  }

  async delete<T>(endpoint: string, options?: { signal?: AbortSignal }): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }
}

export const apiClient = new APIClient();
