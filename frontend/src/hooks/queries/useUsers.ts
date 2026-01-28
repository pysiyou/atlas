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
import { useAuthStore } from '@/shared/stores/auth.store';

/**
 * API response type for users lookup endpoint (all authenticated users)
 */
interface UserLookupResponse {
  id: number; // Backend returns integer, we convert to string for consistency
  name: string;
  username: string;
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
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();

  const query = useQuery({
    queryKey: queryKeys.users.list(),
    queryFn: async () => {
      // Use lookup endpoint which is accessible to all authenticated users
      // Returns minimal user info (id, name, username) for display purposes
      const response = await apiClient.get<UserLookupResponse[]>('/users/lookup');
      return response;
    },
    enabled: isAuthenticated && !isRestoring,
    ...cacheConfig.static, // Infinity cache
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
      // Ensure ID is always stored as string for consistent lookups
      const idKey = String(user.id);
      map.set(idKey, {
        id: String(user.id), // Convert to string for consistency
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
  const getUserName = useCallback(
    (userId: string): string => {
      if (!userId) {
        return 'Unknown';
      }

      // Normalize userId to string and trim whitespace
      const normalizedId = String(userId).trim();

      // Try exact match first (string key)
      const user = usersMap.get(normalizedId);
      if (user) {
        return user.name;
      }

      // Handle common system identifiers with more descriptive names
      const systemUserNames: Record<string, string> = {
        system: 'System Admin',
        admin: 'System Admin',
        unknown: 'Unknown User',
      };

      const lowerUserId = normalizedId.toLowerCase();
      if (systemUserNames[lowerUserId]) {
        return systemUserNames[lowerUserId];
      }

      // User not found - return placeholder
      return 'N/A';
    },
    [usersMap]
  );

  /**
   * Get full user display info by ID
   */
  const getUserInfo = useCallback(
    (userId: string | undefined): UserDisplayInfo | undefined => {
      if (!userId) {
        return undefined;
      }
      return usersMap.get(userId);
    },
    [usersMap]
  );

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
