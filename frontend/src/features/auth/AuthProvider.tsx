/**
 * Authentication Provider
 *
 * Manages JWT-based authentication with automatic token refresh.
 * Uses sessionStorage for persistence across page reloads.
 */
import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import type { AuthUser, UserRole } from '@/types';
import { AuthContext, type AuthContextType } from './AuthContext';
import { apiClient } from '@/services/api/client';

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'atlas_access_token',
  REFRESH_TOKEN: 'atlas_refresh_token',
  USER: 'atlas_user',
} as const;

// Token utilities
const storage = {
  get: (key: string): string | null => {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set: (key: string, value: string): void => {
    try {
      sessionStorage.setItem(key, value);
    } catch {
      // Ignore storage errors (private browsing, quota exceeded)
    }
  },
  remove: (key: string): void => {
    try {
      sessionStorage.removeItem(key);
    } catch {
      // Ignore
    }
  },
  clear: (): void => {
    Object.values(STORAGE_KEYS).forEach(storage.remove);
  },
};

const decodeJwt = (token: string): { exp?: number; iat?: number } | null => {
  try {
    const [, payload] = token.split('.');
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
};

const isTokenExpired = (token: string | null, bufferSec = 60): boolean => {
  if (!token) return true;
  const decoded = decodeJwt(token);
  if (!decoded?.exp) return true;
  return decoded.exp * 1000 <= Date.now() + bufferSec * 1000;
};

interface Props {
  children: ReactNode;
}

export const AuthProvider = ({ children }: Props) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(() => !!storage.get(STORAGE_KEYS.ACCESS_TOKEN));

  // Token ref for synchronous access by API client
  const tokenRef = useRef<string | null>(storage.get(STORAGE_KEYS.ACCESS_TOKEN));
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const isRefreshingRef = useRef(false);

  // Clear all auth state
  const clearAuth = useCallback(() => {
    tokenRef.current = null;
    setUser(null);
    storage.clear();
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
  }, []);

  // Refresh access token
  const refreshToken = useCallback(async (): Promise<string | null> => {
    if (isRefreshingRef.current) return tokenRef.current;

    const refreshTkn = storage.get(STORAGE_KEYS.REFRESH_TOKEN);
    if (!refreshTkn) {
      clearAuth();
      return null;
    }

    isRefreshingRef.current = true;
    try {
      const { access_token } = await apiClient.post<{ access_token: string }>(
        '/auth/refresh',
        { refresh_token: refreshTkn }
      );

      tokenRef.current = access_token;
      storage.set(STORAGE_KEYS.ACCESS_TOKEN, access_token);
      return access_token;
    } catch {
      clearAuth();
      return null;
    } finally {
      isRefreshingRef.current = false;
    }
  }, [clearAuth]);

  // Schedule proactive token refresh at 50% of lifetime
  const scheduleRefresh = useCallback(
    (token: string) => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }

      const decoded = decodeJwt(token);
      if (!decoded?.exp || !decoded?.iat) return;

      const lifetime = (decoded.exp - decoded.iat) * 1000;
      const elapsed = Date.now() - decoded.iat * 1000;
      const refreshIn = Math.max(lifetime / 2 - elapsed, 60000);

      refreshTimerRef.current = setTimeout(async () => {
        const newToken = await refreshToken();
        if (newToken) scheduleRefresh(newToken);
      }, refreshIn);
    },
    [refreshToken]
  );

  // Register token getter with API client
  useEffect(() => {
    apiClient.setTokenGetter(() => tokenRef.current);
    apiClient.setRefreshTokenHandler(refreshToken);
  }, [refreshToken]);

  // Restore auth state on mount
  useEffect(() => {
    let mounted = true;

    const restore = async () => {
      const token = storage.get(STORAGE_KEYS.ACCESS_TOKEN);

      if (!token) {
        setIsLoading(false);
        return;
      }

      // Try to refresh if expired
      let validToken = token;
      if (isTokenExpired(token)) {
        const refreshed = await refreshToken();
        if (!refreshed) {
          if (mounted) setIsLoading(false);
          return;
        }
        validToken = refreshed;
      }

      tokenRef.current = validToken;

      try {
        const userInfo = await apiClient.get<AuthUser>('/auth/me');
        if (mounted) {
          setUser(userInfo);
          storage.set(STORAGE_KEYS.USER, JSON.stringify(userInfo));
          scheduleRefresh(validToken);
        }
      } catch {
        clearAuth();
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    restore();
    return () => {
      mounted = false;
    };
  }, [clearAuth, refreshToken, scheduleRefresh]);

  // Login
  const login = useCallback(
    async (username: string, password: string): Promise<void> => {
      const response = await apiClient.post<{
        access_token: string;
        refresh_token: string;
        role: UserRole;
      }>('/auth/login', { username, password });

      tokenRef.current = response.access_token;
      storage.set(STORAGE_KEYS.ACCESS_TOKEN, response.access_token);
      storage.set(STORAGE_KEYS.REFRESH_TOKEN, response.refresh_token);

      const userInfo = await apiClient.get<AuthUser>('/auth/me');
      setUser(userInfo);
      storage.set(STORAGE_KEYS.USER, JSON.stringify(userInfo));
      scheduleRefresh(response.access_token);
    },
    [scheduleRefresh]
  );

  // Logout
  const logout = useCallback(() => {
    apiClient.post('/auth/logout', {}).catch(() => {});
    clearAuth();
  }, [clearAuth]);

  // Check role
  const hasRole = useCallback(
    (roles: UserRole | UserRole[]): boolean => {
      if (!user) return false;
      const roleList = Array.isArray(roles) ? roles : [roles];
      return roleList.includes(user.role);
    },
    [user]
  );

  const value: AuthContextType = {
    user,
    currentUser: user, // Backward compatibility
    isAuthenticated: !!user,
    isLoading,
    isRestoring: isLoading, // Backward compatibility
    login,
    logout,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
