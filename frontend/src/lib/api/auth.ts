/**
 * Auth API service — login, session, token refresh.
 */
import type { AuthUser } from '@/types';
import {
  authUserResponseSchema,
  loginTokenResponseSchema,
  parseApiResponse,
  refreshTokenResponseSchema,
} from '@/lib/api/schemas/responses.schema';
import type {
  ApiAuthUserResponse,
  ApiLoginTokenResponse,
  ApiRefreshTokenResponse,
  LoginTokenResponse,
  RefreshTokenResponse,
} from '@/lib/api/types';
import { apiClient } from './client';

export interface LoginResponse extends LoginTokenResponse {
  role?: string;
}

export type RefreshResponse = RefreshTokenResponse;

export const authAPI = {
  async login(username: string, password: string): Promise<LoginResponse> {
    const data = await apiClient.post<ApiLoginTokenResponse>('/auth/login', { username, password });
    return parseApiResponse(loginTokenResponseSchema, data, 'login');
  },

  async getMe(): Promise<AuthUser> {
    const data = await apiClient.get<ApiAuthUserResponse>('/auth/me');
    return parseApiResponse(authUserResponseSchema, data, 'auth/me') as AuthUser;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout', {});
  },

  async refresh(refreshToken: string): Promise<RefreshResponse> {
    const data = await apiClient.post<ApiRefreshTokenResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    });
    return parseApiResponse(refreshTokenResponseSchema, data, 'token refresh');
  },
};

/** Wire JWT token getters into the HTTP client (called once from auth store). */
export function bindAuthClientHandlers(
  getToken: () => string | null,
  refreshAccessToken: () => Promise<string | null>
): void {
  apiClient.setTokenGetter(getToken);
  apiClient.setRefreshTokenHandler(refreshAccessToken);
}
