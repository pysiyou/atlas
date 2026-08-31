/**
 * API Client
 *
 * HTTP client with JWT authentication, automatic token refresh, and retry logic.
 */
import { API_CONFIG } from '@/config/api';
import { logger } from '@/utils/logger';
import type { ApiError } from '@/types/schemas/error.schema';

/** Re-export for consumers; matches shared ApiError (message, status, code, field, details). */
export type APIError = ApiError;

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

async function parseSuccessResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : ({} as T);
  } catch (parseError) {
    const err: ApiError = {
      message: (parseError as Error).message || 'Invalid response',
      status: response.status,
    };
    throw err;
  }
}

function parseErrorMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object') return fallback;

  const raw = 'detail' in body ? body.detail : 'message' in body ? body.message : undefined;
  if (Array.isArray(raw)) {
    return (
      raw
        .map((d: { msg?: string }) => d?.msg)
        .filter(Boolean)
        .join('; ') || fallback
    );
  }
  if (typeof raw === 'string') return raw;
  if (raw != null) return String(raw);
  return fallback;
}

async function parseErrorResponse(response: Response): Promise<ApiError> {
  let message = response.statusText || 'Request failed';
  try {
    const body = await response.json();
    message = parseErrorMessage(body, message);
  } catch {
    // Use statusText
  }

  return { message, status: response.status };
}

function isApiError(error: unknown): error is ApiError {
  return Boolean(error && typeof error === 'object' && 'status' in error);
}

function isAbortError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'name' in error &&
      (error as { name?: string }).name === 'AbortError'
  );
}

function toNetworkError(error: unknown): ApiError {
  const err = error as Error;
  logger.error('API request failed', err);
  return { message: err.message || 'Network error' };
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
