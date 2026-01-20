/**
 * Authentication Provider Component
 * Manages user authentication and role-based access using backend API
 */

import React, { useState, type ReactNode } from 'react';
import type { AuthUser, UserRole } from '@/types';
import { AuthContext, type AuthContextType } from './AuthContext';
import { apiClient } from '@/services/api/client';
import { logger } from '@/utils/logger';

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
      return false;
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

