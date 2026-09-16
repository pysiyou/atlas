import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser, UserRole } from '@/types';
import { authAPI, bindAuthClientHandlers } from '@/lib/api/auth.service';
import { notify } from '@/utils/feedback';
import { feedbackTitle } from '@/utils/feedback/copy';
import { clearSessionExpired, markSessionExpired } from '@/utils/feedback/sessionExpiry';

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
      bindAuthClientHandlers(() => get().token, () => get().refreshAccessToken());

      return {
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        /** True until persist has rehydrated; gates route decisions. */
        isLoading: true,

        login: async (username, password) => {
          const response = await authAPI.login(username, password);

          set({
            token: response.access_token,
            refreshToken: response.refresh_token,
          });

          try {
            const userInfo = await authAPI.getMe();
            clearSessionExpired();
            set({
              user: userInfo,
              isAuthenticated: true,
            });
          } catch {
            set({
              user: null,
              token: null,
              refreshToken: null,
              isAuthenticated: false,
            });
            throw new Error(feedbackTitle('auth.login.profileLoadFailed'));
          }
        },

        logout: async () => {
          try {
            await authAPI.logout();
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
            const { access_token } = await authAPI.refresh(currentRefreshToken);
            set({ token: access_token });
            return access_token;
          } catch {
            markSessionExpired();
            notify.toast('session.expired');
            set({
              user: null,
              token: null,
              refreshToken: null,
              isAuthenticated: false,
            });
            try {
              await authAPI.logout();
            } catch {
              // Ignore logout errors after expiry
            }
            return null;
          }
        },

        hasRole: roles => {
          const { user } = get();
          if (!user) return false;
          const roleList = Array.isArray(roles) ? roles : [roles];
          return roleList.includes(user.role);
        },
      };
    },
    {
      name: 'auth-storage',
      partialize: state => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      storage: {
        getItem: name => {
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
        removeItem: name => {
          try {
            sessionStorage.removeItem(name);
          } catch {
            // Ignore
          }
        },
      },
      onRehydrateStorage: () => {
        const REHYDRATE_TIMEOUT_MS = 300;
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          queueMicrotask(() => {
            useAuthStore.setState({ isLoading: false });
          });
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
