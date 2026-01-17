/**
 * Authentication Provider Component
 * Manages user authentication and role-based access using backend API
 */

import React, { useState, type ReactNode } from 'react';
import type { AuthUser, UserRole } from '@/types';
import { AuthContext, type AuthContextType } from './AuthContext';
import { apiClient } from '@/services/api/client';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Initialize state from sessionStorage (for page refreshes)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const stored = sessionStorage.getItem('atlas_current_user');
    return stored ? JSON.parse(stored) : null;
  });

  /**
   * Login function - authenticates with backend API
   */
  const login = async (username: string, password: string, role: UserRole): Promise<boolean> => {
    try {
      // Call backend login endpoint
      const response = await apiClient.post<{ access_token: string; refresh_token: string }>('/auth/login', {
        username,
        password,
      });

      // Get user info
      const userInfo = await apiClient.get<AuthUser>('/auth/me');
      
      // Verify role matches
      if (userInfo.role !== role) {
        return false;
      }

      const authUser: AuthUser = {
        ...userInfo,
        loggedInAt: new Date().toISOString(),
      };

      setCurrentUser(authUser);
      sessionStorage.setItem('atlas_current_user', JSON.stringify(authUser));
      sessionStorage.setItem('atlas_access_token', response.access_token);
      sessionStorage.setItem('atlas_refresh_token', response.refresh_token);
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
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

