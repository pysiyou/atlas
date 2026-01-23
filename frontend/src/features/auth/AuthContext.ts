/**
 * Authentication Context Definition
 * Separate file for context to support Fast Refresh
 */

import { createContext } from 'react';
import type { AuthUser, UserRole } from '@/types';

/**
 * AuthContext type definition
 */
export interface AuthContextType {
  currentUser: AuthUser | null;
  users: never[]; // Deprecated - kept for compatibility
  accessToken: string | null; // In-memory token storage
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isRestoring: boolean; // True while restoring auth state from storage
  hasRole: (roles: UserRole | UserRole[]) => boolean;
}

/**
 * React Context for Authentication
 */
export const AuthContext = createContext<AuthContextType | undefined>(undefined);
