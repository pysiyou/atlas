/**
 * Authentication Provider Component
 * Manages user authentication and role-based access using backend API
 */

import React, { useState, type ReactNode } from 'react';
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
  
  constructor(
    message: string, 
    code: AuthError['code'], 
    status?: number
  ) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.status = status;
  }
}

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Initialize state from sessionStorage (for page refreshes)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const stored = sessionStorage.getItem('atlas_current_user');
    const token = sessionStorage.getItem('atlas_access_token');
    
    // Only restore user if token also exists
    if (stored && token) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        logger.error('Failed to parse stored user', e instanceof Error ? e : undefined);
        return null;
      }
    }
    return null;
  });

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
      const response = await apiClient.post<{ access_token: string; refresh_token: string; role: UserRole }>('/auth/login', {
        username,
        password,
      });

      logger.debug('Login response received');

      if (response.access_token) {
        // Store tokens FIRST so they're available for the next request
        sessionStorage.setItem('atlas_access_token', response.access_token);
        sessionStorage.setItem('atlas_refresh_token', response.refresh_token);
        logger.debug('Tokens stored in sessionStorage');
      } else {
        logger.error('No access_token in login response');
      }

      // Get user info (now with token in sessionStorage)
      const userInfo = await apiClient.get<AuthUser>('/auth/me');

      const authUser: AuthUser = {
        ...userInfo,
        loggedInAt: new Date().toISOString(),
      };

      setCurrentUser(authUser);
      sessionStorage.setItem('atlas_current_user', JSON.stringify(authUser));
      
      return true;
    } catch (error) {
      logger.error('Login failed', error instanceof Error ? error : undefined);
      
      // Clear any tokens on error
      sessionStorage.removeItem('atlas_access_token');
      sessionStorage.removeItem('atlas_refresh_token');
      
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
        throw new AuthError(
          'Invalid username or password',
          'INVALID_CREDENTIALS',
          401
        );
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
      throw new AuthError(
        'An unexpected error occurred. Please try again.',
        'UNKNOWN'
      );
    }
  };

  /**
   * Logout function
   */
  const logout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('atlas_current_user');
    sessionStorage.removeItem('atlas_access_token');
    sessionStorage.removeItem('atlas_refresh_token');
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
    login,
    logout,
    isAuthenticated,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

