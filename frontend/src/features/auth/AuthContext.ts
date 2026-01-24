/**
 * Authentication Context
 *
 * Provides auth state and methods throughout the app.
 * Separated from provider for Fast Refresh support.
 */
import { createContext } from 'react';
import type { AuthUser, UserRole } from '@/types';

export interface AuthContextType {
  /** Current authenticated user or null */
  user: AuthUser | null;
  /** @deprecated Use `user` instead */
  currentUser: AuthUser | null;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Whether auth state is being restored from storage */
  isLoading: boolean;
  /** @deprecated Use `isLoading` instead */
  isRestoring: boolean;
  /** Login with credentials - throws on error */
  login: (username: string, password: string) => Promise<void>;
  /** Logout and clear auth state */
  logout: () => void;
  /** Check if user has required role(s) */
  hasRole: (roles: UserRole | UserRole[]) => boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);
