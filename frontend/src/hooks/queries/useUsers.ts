/**
 * Users Query Hook
 * 
 * Provides access to user data with Infinity caching.
 * User list rarely changes, so we cache it for the entire session.
 * 
 * @module hooks/queries/useUsers
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { queryKeys, cacheConfig } from '@/lib/query';
import { apiClient } from '@/services/api/client';
import { useAuth } from '@/features/auth/useAuth';

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

/**
 * Minimal user info for display purposes
 */
export interface UserDisplayInfo {
  id: string;
  name: string;
  username: string;
}

/**
 * Hook to fetch and cache all users.
 * Uses Infinity cache - data is fetched once per session.
 * 
 * @returns Query result containing users array and loading state
 * 
 * @example
 * ```tsx
 * const { users, isLoading } = useUsersList();
 * ```
 */
export function useUsersList() {
  const { isAuthenticated } = useAuth();

  const query = useQuery({
    queryKey: queryKeys.users.list(),
    queryFn: async () => {
      const response = await apiClient.get<UserResponse[]>('/users');
      return response;
    },
    enabled: isAuthenticated,
    ...cacheConfig.static, // Infinity cache
    // Silently fail for permission issues - non-admin users won't have access
    retry: (failureCount, error) => {
      const apiError = error as { status?: number };
      // Don't retry for 401/403
      if (apiError.status === 401 || apiError.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });

  return {
    users: query.data ?? [],
    isLoading: query.isLoading,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to create a map of users for quick lookups.
 * Transforms the users array into a Map keyed by user ID.
 * 
 * @returns Map of user ID to UserDisplayInfo
 */
export function useUsersMap(): Map<string, UserDisplayInfo> {
  const { users } = useUsersList();

  return useMemo(() => {
    const map = new Map<string, UserDisplayInfo>();
    users.forEach(user => {
      map.set(user.id, {
        id: user.id,
        name: user.name,
        username: user.username,
      });
    });
    return map;
  }, [users]);
}

/**
 * Hook to get user name by ID with fallback.
 * Returns a lookup function that resolves user IDs to display names.
 * 
 * @returns Object with getUserName and getUserInfo functions
 * 
 * @example
 * ```tsx
 * const { getUserName, getUserInfo } = useUserLookup();
 * const name = getUserName('USR-001'); // "John Doe"
 * ```
 */
export function useUserLookup() {
  const usersMap = useUsersMap();
  const { isLoading } = useUsersList();

  /**
   * Get user name by ID with fallback
   */
  const getUserName = useCallback((userId: string): string => {
    if (!userId) {
      return 'Unknown';
    }

    const user = usersMap.get(userId);
    if (user) {
      return user.name;
    }

    // Fallback: format the user ID
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

  return {
    getUserName,
    getUserInfo,
    isLoading,
    usersMap,
  };
}

/**
 * Hook to get a single user by ID.
 * 
 * @param userId - The user ID to look up
 * @returns The user display info or undefined
 */
export function useUser(userId: string | undefined) {
  const usersMap = useUsersMap();
  const { isLoading } = useUsersList();

  const user = userId ? usersMap.get(userId) : undefined;

  return {
    user,
    isLoading,
  };
}

/**
 * Hook to invalidate and refetch the users list.
 * 
 * @returns Function to invalidate the users cache
 */
export function useInvalidateUsers() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
  };

  return { invalidate };
}
