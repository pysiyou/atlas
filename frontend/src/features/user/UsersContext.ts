/**
 * Users Context Definition
 * Provides access to user data for display purposes
 */

import { createContext } from 'react';

/**
 * Minimal user info needed for display purposes
 */
export interface UserDisplayInfo {
  id: string;
  name: string;
  username: string;
}

/**
 * UsersContext type definition
 */
export interface UsersContextType {
  /** Map of user ID to user display info for quick lookups */
  usersMap: Map<string, UserDisplayInfo>;
  /** Get user name by ID, returns fallback if not found */
  getUserName: (userId: string) => string;
  /** Get full user display info by ID */
  getUserInfo: (userId: string | undefined) => UserDisplayInfo | undefined;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: string | null;
  /** Refresh users data */
  refresh: () => Promise<void>;
}

/**
 * React Context for Users
 */
export const UsersContext = createContext<UsersContextType | undefined>(undefined);
