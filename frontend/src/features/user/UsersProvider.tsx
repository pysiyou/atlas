/**
 * Users Provider Component
 * Fetches and caches user data for display purposes
 */

import React, { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { UsersContext, type UsersContextType, type UserDisplayInfo } from './UsersContext';
import { apiClient } from '@/services/api/client';
import { useAuth } from '@/features/auth/useAuth';

interface UsersProviderProps {
  children: ReactNode;
}

/**
 * API response type for users endpoint
 */
interface UserResponse {
  id: string;
  name: string;
  username: string;
  role: string;
  email?: string;
  phone?: string;
  createdAt: string;
}

export const UsersProvider: React.FC<UsersProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [usersMap, setUsersMap] = useState<Map<string, UserDisplayInfo>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all users from the API
   * Falls back gracefully if user doesn't have admin access
   */
  const fetchUsers = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<UserResponse[]>('/users');
      
      // Build map from response
      const newMap = new Map<string, UserDisplayInfo>();
      response.forEach((user) => {
        newMap.set(user.id, {
          id: user.id,
          name: user.name,
          username: user.username,
        });
      });
      
      setUsersMap(newMap);
    } catch (err) {
      // If 403/401, user doesn't have permission - this is expected for non-admin users
      // We'll fall back to showing user IDs instead of names
      const apiError = err as { status?: number; message?: string };
      if (apiError.status === 403 || apiError.status === 401) {
        // Silently fail for permission issues - we'll use fallback display
        console.debug('User does not have permission to fetch users list');
      } else {
        console.error('Failed to fetch users:', err);
        setError(apiError.message || 'Failed to load users');
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch users when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers();
    } else {
      // Clear users when logged out
      setUsersMap(new Map());
    }
  }, [isAuthenticated, fetchUsers]);

  /**
   * Get user name by ID
   * Returns the user's name if found, otherwise returns a fallback
   */
  const getUserName = useCallback((userId: string): string => {
    if (!userId) {
      return 'Unknown';
    }

    const user = usersMap.get(userId);
    if (user) {
      return user.name;
    }

    // Fallback: return the user ID with a more readable format
    // Check if it looks like a user ID (e.g., "USR-001")
    if (userId.startsWith('USR-')) {
      return `User ${userId.slice(4)}`;
    }

    return userId;
  }, [usersMap]);

  /**
   * Get full user display info by ID
   */
  const getUserInfo = useCallback((userId: string | undefined): UserDisplayInfo | undefined => {
    if (!userId) {
      return undefined;
    }
    return usersMap.get(userId);
  }, [usersMap]);

  /**
   * Refresh users data
   */
  const refresh = useCallback(async () => {
    await fetchUsers();
  }, [fetchUsers]);

  const value: UsersContextType = useMemo(() => ({
    usersMap,
    getUserName,
    getUserInfo,
    isLoading,
    error,
    refresh,
  }), [usersMap, getUserName, getUserInfo, isLoading, error, refresh]);

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
};
