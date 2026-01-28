import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser, UserRole } from '@/types';
import { apiClient } from '@/services/api/client';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<string | null>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      // Initialize token getter and refresh handler
      apiClient.setTokenGetter(() => get().token);
      apiClient.setRefreshTokenHandler(() => get().refreshAccessToken());

      return {
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,

        login: async (username, password) => {
          const response = await apiClient.post<{
            access_token: string;
            refresh_token: string;
            role: UserRole;
          }>('/auth/login', { username, password });

          // Set token before calling /auth/me so Authorization header is included
          set({
            token: response.access_token,
            refreshToken: response.refresh_token,
          });

          const userInfo = await apiClient.get<AuthUser>('/auth/me');

          set({
            user: userInfo,
            isAuthenticated: true,
          });
        },

        logout: async () => {
          try {
            await apiClient.post('/auth/logout', {});
          } catch {
            // Ignore logout errors
          }
          
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
          });
        },

        refreshAccessToken: async () => {
          const { refreshToken: currentRefreshToken } = get();
          if (!currentRefreshToken) return null;

          try {
            const { access_token } = await apiClient.post<{ access_token: string }>(
              '/auth/refresh',
              { refresh_token: currentRefreshToken }
            );

            set({ token: access_token });
            return access_token;
          } catch {
            get().logout();
            return null;
          }
        },

        hasRole: (roles) => {
          const { user } = get();
          if (!user) return false;
          const roleList = Array.isArray(roles) ? roles : [roles];
          return roleList.includes(user.role);
        },
      };
    },
    {
      name: 'auth-storage',
      storage: {
        getItem: (name) => {
          try {
            const value = sessionStorage.getItem(name);
            return value ? JSON.parse(value) : null;
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            sessionStorage.setItem(name, JSON.stringify(value));
          } catch {
            // Ignore storage errors
          }
        },
        removeItem: (name) => {
          try {
            sessionStorage.removeItem(name);
          } catch {
            // Ignore
          }
        },
      },
    }
  )
);
