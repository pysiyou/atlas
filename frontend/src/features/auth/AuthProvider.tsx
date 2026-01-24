/**
 * Authentication Provider Component
 * Manages user authentication and role-based access using backend API
 * Features token refresh, request queueing, and comprehensive error handling
 */

import React, { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import type { AuthUser, UserRole } from '@/types';
import { AuthContext, type AuthContextType } from './AuthContext';
import { apiClient } from '@/services/api/client';
import { logger } from '@/utils/logger';
import { authStorage, STORAGE_KEYS } from './storage/authStorage';
import { TokenRefreshQueue, isTokenExpired, getProactiveRefreshTime } from './utils/tokenRefresh';
import { AuthError, toAuthError, handleStorageError, withAuthRetry } from './utils/authErrors';

interface AuthProviderProps {
  children: ReactNode;
}


// Large function is necessary for comprehensive auth state management including token refresh, queueing, and error handling
// eslint-disable-next-line max-lines-per-function
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Don't initialize currentUser from storage - must validate token first
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  
  // Track if we're currently restoring auth state from storage
  const [isRestoring, setIsRestoring] = useState<boolean>(() => {
    // Check if there's a stored token that needs validation
    return !!authStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  });

  // Use a ref to store the current token so the getter always has the latest value
  // Initialize with stored token if available
  const getInitialToken = (): string | null => {
    return authStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  };
  const tokenRef = useRef<string | null>(getInitialToken());

  // Token refresh queue for managing concurrent refresh attempts
  const refreshQueueRef = useRef<TokenRefreshQueue>(new TokenRefreshQueue());

  // Proactive refresh timer
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);


  // Keep ref in sync with state
  useEffect(() => {
    tokenRef.current = accessToken;
  }, [accessToken]);

  // Register token getter with API client on mount
  // This must run before any API calls are made
  // Navigation callbacks are set up by AuthNavigationSetup component
  useEffect(() => {
    apiClient.setTokenGetter(() => tokenRef.current);
  }, []);

  /**
   * Clear all authentication state and storage
   */
  const clearAuthState = useCallback(() => {
    tokenRef.current = null;
    setAccessToken(null);
    setCurrentUser(null);
    
    // Clear stored tokens
    authStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    authStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    authStorage.removeItem(STORAGE_KEYS.USER);
    authStorage.removeItem(STORAGE_KEYS.LOGGED_IN_AT);

    // Clear refresh queue and timer
    refreshQueueRef.current.clear();
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  /**
   * Refresh access token using refresh token
   * @returns New access token
   * @throws AuthError if refresh fails
   */
  const refreshAccessToken = useCallback(async (): Promise<string> => {
    const refreshToken = authStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    
    if (!refreshToken) {
      throw new AuthError('No refresh token available', 'INVALID_CREDENTIALS');
    }

    try {
      // Call refresh endpoint (assuming it exists - adjust endpoint as needed)
      const response = await apiClient.post<{
        access_token: string;
        refresh_token?: string;
      }>('/auth/refresh', {
        refresh_token: refreshToken,
      });

      if (!response.access_token) {
        throw new AuthError('Invalid response from refresh endpoint', 'SERVER_ERROR');
      }

      // Update tokens
      tokenRef.current = response.access_token;
      setAccessToken(response.access_token);
      
      // Persist new access token
      authStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.access_token);
      
      // Update refresh token if provided
      if (response.refresh_token) {
        authStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refresh_token);
      }

      logger.debug('Token refreshed successfully');
      return response.access_token;
    } catch (error) {
      logger.error('Token refresh failed', error instanceof Error ? error : undefined);
      
      // Refresh failed - clear auth state
      clearAuthState();
      
      throw toAuthError(error);
    }
  }, [clearAuthState]);

  /**
   * Schedule proactive token refresh
   * Refreshes token before it expires
   */
  const scheduleProactiveRefresh = useCallback(() => {
    // Clear existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    const currentToken = tokenRef.current;
    if (!currentToken) {
      return;
    }

    const refreshTime = getProactiveRefreshTime(currentToken);
    if (!refreshTime) {
      return;
    }

    logger.debug(`Scheduling proactive token refresh in ${Math.round(refreshTime / 1000)}s`);

    refreshTimerRef.current = setTimeout(async () => {
      try {
        await refreshQueueRef.current.startRefresh(refreshAccessToken);
        // Schedule next refresh
        scheduleProactiveRefresh();
      } catch (error) {
        logger.error('Proactive token refresh failed', error instanceof Error ? error : undefined);
        // Don't clear auth state here - let the next API call trigger refresh
      }
    }, refreshTime);
  }, [refreshAccessToken]);

  /**
   * Restore authentication state from storage on mount
   * Validates the stored token by fetching user info
   * Handles race conditions by using a flag
   */
  useEffect(() => {
    let isMounted = true;

    const restoreAuth = async () => {
      const storedToken = authStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      
      if (!storedToken) {
        // No stored token, ensure clean state
        if (isMounted) {
          clearAuthState();
          setIsRestoring(false);
        }
        return;
      }

      // Check if token is expired - try refresh if we have refresh token
      if (isTokenExpired(storedToken)) {
        const refreshToken = authStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        if (refreshToken) {
          try {
            logger.debug('Stored token expired, attempting refresh');
            const newToken = await refreshQueueRef.current.startRefresh(refreshAccessToken);
            if (isMounted) {
              tokenRef.current = newToken;
              setAccessToken(newToken);
            }
          } catch (error) {
            logger.debug('Token refresh failed during restore', error instanceof Error ? { error: error.message } : undefined);
            if (isMounted) {
              clearAuthState();
              setIsRestoring(false);
            }
            return;
          }
        } else {
          // No refresh token, clear state
          if (isMounted) {
            clearAuthState();
            setIsRestoring(false);
          }
          return;
        }
      } else {
        // Token is valid, set it
        if (isMounted) {
          tokenRef.current = storedToken;
          setAccessToken(storedToken);
        }
      }

      try {
        // Validate token by fetching user info
        const userInfo = await apiClient.get<AuthUser>('/auth/me');
        
        if (!isMounted) return;

        const authUser: AuthUser = {
          ...userInfo,
          loggedInAt: authStorage.getItem(STORAGE_KEYS.LOGGED_IN_AT) || new Date().toISOString(),
        };

        setCurrentUser(authUser);
        
        // Persist user info (in case it was updated)
        authStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(authUser));
        
        // Schedule proactive refresh
        scheduleProactiveRefresh();
        
        logger.debug('Authentication state restored from storage');
      } catch (error) {
        if (!isMounted) return;

        // Token is invalid or expired, try refresh if available
        const refreshToken = authStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        if (refreshToken) {
          try {
            logger.debug('Token validation failed, attempting refresh');
            const newToken = await refreshQueueRef.current.startRefresh(refreshAccessToken);
            tokenRef.current = newToken;
            setAccessToken(newToken);
            
            // Retry user info fetch
            const userInfo = await apiClient.get<AuthUser>('/auth/me');
            const authUser: AuthUser = {
              ...userInfo,
              loggedInAt: authStorage.getItem(STORAGE_KEYS.LOGGED_IN_AT) || new Date().toISOString(),
            };
            setCurrentUser(authUser);
            authStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(authUser));
            scheduleProactiveRefresh();
            return;
          } catch (refreshError) {
            logger.debug('Token refresh failed during restore', refreshError instanceof Error ? { error: refreshError.message } : undefined);
          }
        }

        // Refresh failed or no refresh token - clear stored auth
        logger.debug('Stored token is invalid, clearing auth state', error instanceof Error ? { error: error.message } : undefined);
        clearAuthState();
      } finally {
        if (isMounted) {
          setIsRestoring(false);
        }
      }
    };

    restoreAuth();

    return () => {
      isMounted = false;
    };
  }, [clearAuthState, refreshAccessToken, scheduleProactiveRefresh]);

  /**
   * Login function - authenticates with backend API
   * @param username - User's username
   * @param password - User's password
   * @returns true if login succeeded
   * @throws AuthError with specific error code for different failure types
   */
  const login = async (username: string, password: string): Promise<boolean> => {
    return withAuthRetry(async () => {
      try {
        // Call backend login endpoint
        const response = await apiClient.post<{
          access_token: string;
          refresh_token: string;
          role: UserRole;
        }>('/auth/login', {
          username,
          password,
        });

        logger.debug('Login response received');

        if (!response.access_token) {
          logger.error('No access_token in login response');
          throw new AuthError('Invalid response from server', 'SERVER_ERROR');
        }

        // Store tokens in memory and storage for persistence
        // Update ref immediately so API client can use it synchronously
        tokenRef.current = response.access_token;
        setAccessToken(response.access_token);
        
        // Persist tokens to storage
        try {
          authStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.access_token);
          if (response.refresh_token) {
            authStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refresh_token);
          }
          const loginTime = new Date().toISOString();
          authStorage.setItem(STORAGE_KEYS.LOGGED_IN_AT, loginTime);
        } catch (storageError) {
          handleStorageError('login', storageError);
          // Continue even if storage fails (e.g., in private browsing mode)
        }
        
        logger.debug('Access token stored in memory and storage', { tokenLength: response.access_token.length });
        
        // Verify token is available in ref before making API call
        if (!tokenRef.current) {
          logger.error('Token ref is null after setting');
          throw new AuthError('Failed to store access token', 'SERVER_ERROR');
        }

        // Get user info (token is now in ref, API client will get it from context)
        logger.debug('Fetching user info with token', { hasToken: !!tokenRef.current });
        const userInfo = await apiClient.get<AuthUser>('/auth/me');

        const authUser: AuthUser = {
          ...userInfo,
          loggedInAt: new Date().toISOString(),
        };

        setCurrentUser(authUser);
        
        // Persist user info to storage
        try {
          authStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(authUser));
        } catch (storageError) {
          handleStorageError('store user info', storageError);
        }

        // Schedule proactive token refresh
        scheduleProactiveRefresh();

        return true;
      } catch (error) {
        logger.error('Login failed', error instanceof Error ? error : undefined);

        // Clear any tokens on error
        clearAuthState();

        // Re-throw as AuthError
        throw toAuthError(error);
      }
    });
  };

  /**
   * Refresh token method (exposed for API client use)
   * @returns New access token
   * @throws AuthError if refresh fails
   */
  const refreshToken = useCallback(async (): Promise<string> => {
    return refreshQueueRef.current.startRefresh(refreshAccessToken);
  }, [refreshAccessToken]);

  /**
   * Logout function
   * Clears authentication state from memory and storage
   * Optionally calls backend logout endpoint
   */
  const logout = useCallback(async () => {
    // Call backend logout endpoint if token exists
    const currentToken = tokenRef.current;
    if (currentToken) {
      try {
        await apiClient.post('/auth/logout', {});
      } catch (error) {
        // Log but don't fail logout if backend call fails
        logger.warn('Backend logout call failed', error instanceof Error ? { error: error.message } : undefined);
      }
    }

    // Clear auth state
    clearAuthState();
  }, [clearAuthState]);

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = currentUser !== null;

  /**
   * Check if user has required role(s)
   */
  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!currentUser) return false;

    if (Array.isArray(roles)) {
      return roles.includes(currentUser.role);
    }

    return currentUser.role === roles;
  };

  // Expose refresh queue and token getter for API client
  useEffect(() => {
    apiClient.setRefreshTokenHandler(() => refreshToken());
    apiClient.setRefreshQueue(refreshQueueRef.current);
  }, [refreshToken]);

  const value: AuthContextType = {
    currentUser,
    users: [], // No longer needed with backend
    accessToken,
    login,
    logout,
    isAuthenticated,
    isRestoring,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
