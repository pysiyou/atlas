/**
 * Admin users API — full UserResponse list and create/update (administrator only).
 */
import { apiClient } from '@/lib/api/client';
import type { components } from '@/lib/api/types';
import { queryKeys } from '@/lib/query';
import { useAuthStore } from '@/app/authStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type UserAdminRecord = components['schemas']['UserResponse'];
export type UserAdminCreate = components['schemas']['UserCreate'];
export type UserAdminUpdate = components['schemas']['UserUpdate'];

export const usersAdminAPI = {
  list(): Promise<UserAdminRecord[]> {
    return apiClient.get<UserAdminRecord[]>('/users');
  },
  create(body: UserAdminCreate): Promise<UserAdminRecord> {
    return apiClient.post<UserAdminRecord>('/users', body);
  },
  update(userId: number, body: UserAdminUpdate): Promise<UserAdminRecord> {
    return apiClient.put<UserAdminRecord>(`/users/${userId}`, body);
  },
};

/**
 * Load the administrator user directory.
 *
 * @returns Query result with the full user list
 */
export function useUsersAdminList() {
  const { isAuthenticated, isLoading: isRestoring, hasRole } = useAuthStore();
  const canManage = hasRole('administrator');

  const query = useQuery({
    queryKey: queryKeys.users.adminList(),
    queryFn: () => usersAdminAPI.list(),
    enabled: isAuthenticated && !isRestoring && canManage,
  });

  return {
    users: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Create a user account and refresh lookup + admin lists.
 */
export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UserAdminCreate) => usersAdminAPI.create(body),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.users.adminList() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.users.list() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.auditEvents.all }),
      ]);
    },
  });
}

/**
 * Update a user account and refresh lookup + admin lists.
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, body }: { userId: number; body: UserAdminUpdate }) =>
      usersAdminAPI.update(userId, body),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.users.adminList() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.users.list() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.auditEvents.all }),
      ]);
    },
  });
}
