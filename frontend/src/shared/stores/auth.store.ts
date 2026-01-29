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
        /** True until persist has rehydrated; gates route decisions. */
        isLoading: true,

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

          try {
            const userInfo = await apiClient.get<AuthUser>('/auth/me');
            set({
              user: userInfo,
              isAuthenticated: true,
            });
          } catch {
            // Keep storage in sync: do not leave token without user
            set({
              user: null,
              token: null,
              refreshToken: null,
              isAuthenticated: false,
            });
            throw new Error('Failed to load user after login. Please try again.');
          }
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
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
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
      onRehydrateStorage: () => {
        // If persist never calls the completion callback (e.g. storage error), stop blocking login after 300ms
        const REHYDRATE_TIMEOUT_MS = 300;
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          useAuthStore.setState({ isLoading: false });
        };
        const timeoutId = window.setTimeout(finish, REHYDRATE_TIMEOUT_MS);
        return () => {
          clearTimeout(timeoutId);
          finish();
        };
      },
    }
  )
);
