/**
 * Authentication Provider Component
 * Manages user authentication and role-based access
 */

import React, { useState, type ReactNode } from 'react';
import type { AuthUser, User, UserRole } from '@/types';
import { STORAGE_KEYS, loadFromLocalStorage, saveToLocalStorage, removeFromLocalStorage } from '@/utils';
import { AuthContext, type AuthContextType } from './AuthContext';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Initialize state directly from localStorage using lazy initialization
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => 
    loadFromLocalStorage<AuthUser | null>(STORAGE_KEYS.CURRENT_USER, null)
  );
  const [users] = useState<User[]>(() => 
    loadFromLocalStorage<User[]>(STORAGE_KEYS.USERS, [])
  );

  /**
   * Login function - simplified for demo (no real authentication)
   */
  const login = (username: string, password: string, role: UserRole): boolean => {
    // Find user in users array
    const user = users.find(u => u.username === username && u.password === password && u.role === role);
    
    if (user) {
      const authUser: AuthUser = {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        loggedInAt: new Date().toISOString(),
      };

      setCurrentUser(authUser);
      saveToLocalStorage(STORAGE_KEYS.CURRENT_USER, authUser);
      return true;
    }
    
    return false;
  };

  /**
   * Logout function
   */
  const logout = () => {
    setCurrentUser(null);
    removeFromLocalStorage(STORAGE_KEYS.CURRENT_USER);
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
    users,
    login,
    logout,
    isAuthenticated,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
