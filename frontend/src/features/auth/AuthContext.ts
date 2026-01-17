/**
 * Authentication Context Definition
 * Separate file for context to support Fast Refresh
 */

import { createContext } from 'react';
import type { AuthUser, User, UserRole } from '@/types';

/**
 * AuthContext type definition
 */
export interface AuthContextType {
  currentUser: AuthUser | null;
  users: User[];
  login: (username: string, password: string, role: UserRole) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
}

/**
 * React Context for Authentication
 */
export const AuthContext = createContext<AuthContextType | undefined>(undefined);
