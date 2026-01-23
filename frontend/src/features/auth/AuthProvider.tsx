/**
 * Authentication Provider Component
 * Manages user authentication and role-based access using backend API
 */

import React, { useState, useEffect, type ReactNode } from 'react';
import type { AuthUser, UserRole } from '@/types';
import { AuthContext, type AuthContextType } from './AuthContext';
import { apiClient, type APIError } from '@/services/api/client';
import { logger } from '@/utils/logger';

/**
 * Custom error class for authentication failures
 * Provides specific error codes for different failure scenarios
 */
export class AuthError extends Error {
  /** Error code for categorizing the error type */
  code: 'INVALID_CREDENTIALS' | 'NETWORK_ERROR' | 'SERVER_ERROR' | 'TIMEOUT' | 'UNKNOWN';
  /** HTTP status code if available */
  status?: number;

  constructor(message: string, code: AuthError['code'], status?: number) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.status = status;
  }
}

interface AuthProviderProps {
  children: ReactNode;
}

// Storage keys for authentication persistence
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'atlas_access_token',
  REFRESH_TOKEN: 'atlas_refresh_token',
  USER: 'atlas_user',
} as const;

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Don't initialize currentUser from storage - must validate token first
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  // Track if we're currently restoring auth state from storage
  const [isRestoring, setIsRestoring] = useState<boolean>(() => {
    // Check if there's a stored token that needs validation
    try {
      return !!sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch {
      return false;
    }
  });

  // Use a ref to store the current token so the getter always has the latest value
  // Initialize with stored token if available
  const getInitialToken = (): string | null => {
    try {
      return sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch {
      return null;
    }
  };
  const tokenRef = React.useRef<string | null>(getInitialToken());

  // Keep ref in sync with state
  useEffect(() => {
    tokenRef.current = accessToken;
  }, [accessToken]);

  // Register token getter with API client on mount
  // The getter reads from the ref to always get the current token value
  // This must run before any API calls are made
  useEffect(() => {
    apiClient.setTokenGetter(() => tokenRef.current);
  }, []);

  /**
   * Restore authentication state from sessionStorage on mount
   * Validates the stored token by fetching user info
   */
  useEffect(() => {
    const restoreAuth = async () => {
      const storedToken = sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      
      if (!storedToken) {
        // No stored token, ensure clean state
        tokenRef.current = null;
        setAccessToken(null);
        setCurrentUser(null);
        setIsRestoring(false);
        return;
      }

      // Set token in ref and state for API calls
      tokenRef.current = storedToken;
      setAccessToken(storedToken);

      try {
        // Validate token by fetching user info
        const userInfo = await apiClient.get<AuthUser>('/auth/me');
        
        const authUser: AuthUser = {
          ...userInfo,
          loggedInAt: sessionStorage.getItem('atlas_logged_in_at') || new Date().toISOString(),
        };

        setCurrentUser(authUser);
        
        // Persist user info to sessionStorage (in case it was updated)
        try {
          sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(authUser));
        } catch {
          // Ignore storage errors
        }
        
        logger.debug('Authentication state restored from sessionStorage');
      } catch (error) {
        // Token is invalid or expired, clear stored auth
        logger.debug('Stored token is invalid, clearing auth state', error instanceof Error ? error : undefined);
        sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        sessionStorage.removeItem(STORAGE_KEYS.USER);
        sessionStorage.removeItem('atlas_logged_in_at');
        tokenRef.current = null;
        setAccessToken(null);
        setCurrentUser(null);
      } finally {
        // Always mark restoration as complete
        setIsRestoring(false);
      }
    };

    restoreAuth();
  }, []); // Only run on mount

  /**
   * Login function - authenticates with backend API
   * @param username - User's username
   * @param password - User's password
   * @returns true if login succeeded
   * @throws AuthError with specific error code for different failure types
   */
  const login = async (username: string, password: string): Promise<boolean> => {
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

      if (response.access_token) {
        // Store tokens in memory and sessionStorage for persistence
        // Update ref immediately so API client can use it synchronously
        tokenRef.current = response.access_token;
        setAccessToken(response.access_token);
        
        // Persist tokens to sessionStorage
        try {
          sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.access_token);
          if (response.refresh_token) {
            sessionStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refresh_token);
          }
          const loginTime = new Date().toISOString();
          sessionStorage.setItem('atlas_logged_in_at', loginTime);
        } catch (storageError) {
          logger.warn('Failed to store token in sessionStorage', storageError instanceof Error ? storageError : undefined);
          // Continue even if storage fails (e.g., in private browsing mode)
        }
        
        logger.debug('Access token stored in memory and sessionStorage', { tokenLength: response.access_token.length });
        
        // Verify token is available in ref before making API call
        if (!tokenRef.current) {
          logger.error('Token ref is null after setting');
          throw new AuthError('Failed to store access token', 'SERVER_ERROR');
        }
      } else {
        logger.error('No access_token in login response');
        throw new AuthError('Invalid response from server', 'SERVER_ERROR');
      }

      // Get user info (token is now in ref, API client will get it from context)
      logger.debug('Fetching user info with token', { hasToken: !!tokenRef.current });
      const userInfo = await apiClient.get<AuthUser>('/auth/me');

      const authUser: AuthUser = {
        ...userInfo,
        loggedInAt: new Date().toISOString(),
      };

      setCurrentUser(authUser);
      
      // Persist user info to sessionStorage
      try {
        sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(authUser));
      } catch (storageError) {
        logger.warn('Failed to store user info in sessionStorage', storageError instanceof Error ? storageError : undefined);
      }

      return true;
    } catch (error) {
      logger.error('Login failed', error instanceof Error ? error : undefined);

      // Clear any tokens on error
      tokenRef.current = null;
      setAccessToken(null);
      setCurrentUser(null);
      
      // Clear stored tokens from sessionStorage
      try {
        sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        sessionStorage.removeItem(STORAGE_KEYS.USER);
        sessionStorage.removeItem('atlas_logged_in_at');
      } catch {
        // Ignore storage errors
      }

      // Determine error type and throw appropriate AuthError
      const apiError = error as APIError;

      // Check if it's a network/connection error (no status means no HTTP response)
      if (!apiError.status) {
        const errorMessage = apiError.message?.toLowerCase() || '';

        // Check for timeout errors
        if (errorMessage.includes('abort') || errorMessage.includes('timeout')) {
          throw new AuthError(
            'Request timed out. Please check your connection and try again.',
            'TIMEOUT'
          );
        }

        // Check for network/connection errors
        if (
          errorMessage.includes('fetch') ||
          errorMessage.includes('network') ||
          errorMessage.includes('failed to fetch') ||
          errorMessage.includes('connection') ||
          errorMessage.includes('econnrefused') ||
          errorMessage === 'load failed' ||
          errorMessage === 'networkerror when attempting to fetch resource'
        ) {
          throw new AuthError(
            'Unable to connect to the server. Please check if the server is running.',
            'NETWORK_ERROR'
          );
        }

        // Generic error without status - likely network-related
        throw new AuthError(
          'Unable to connect to the server. Please try again later.',
          'NETWORK_ERROR'
        );
      }

      // HTTP 401 - Invalid credentials
      if (apiError.status === 401) {
        throw new AuthError('Invalid username or password', 'INVALID_CREDENTIALS', 401);
      }

      // HTTP 403 - Forbidden (account disabled, etc.)
      if (apiError.status === 403) {
        throw new AuthError(
          apiError.message || 'Access denied. Your account may be disabled.',
          'INVALID_CREDENTIALS',
          403
        );
      }

      // HTTP 5xx - Server errors
      if (apiError.status && apiError.status >= 500) {
        throw new AuthError(
          'Server error occurred. Please try again later.',
          'SERVER_ERROR',
          apiError.status
        );
      }

      // Other HTTP errors (400, 404, etc.)
      if (apiError.status && apiError.status >= 400) {
        throw new AuthError(
          apiError.message || 'Login request failed. Please try again.',
          'UNKNOWN',
          apiError.status
        );
      }

      // Fallback for unexpected errors
      throw new AuthError('An unexpected error occurred. Please try again.', 'UNKNOWN');
    }
  };

  /**
   * Logout function
   * Clears authentication state from memory and sessionStorage
   */
  const logout = () => {
    tokenRef.current = null;
    setCurrentUser(null);
    setAccessToken(null);
    
    // Clear stored tokens from sessionStorage
    try {
      sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      sessionStorage.removeItem(STORAGE_KEYS.USER);
      sessionStorage.removeItem('atlas_logged_in_at');
    } catch {
      // Ignore storage errors
    }
  };

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
