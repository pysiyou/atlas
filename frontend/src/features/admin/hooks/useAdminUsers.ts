/**
 * Admin user management hooks.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/app/store';
import {
  adminUsersAPI,
  type CreateAdminUserRequest,
} from '@/features/admin/api/adminUsers';
import { queryKeys } from '@/lib/query';

export function useAdminUsersList() {
  const { isAuthenticated, hasRole } = useAuthStore();
  const isAdmin = hasRole('administrator');

  const query = useQuery({
    queryKey: queryKeys.users.adminList(),
    queryFn: () => adminUsersAPI.list(),
    enabled: isAuthenticated && isAdmin,
    staleTime: 60_000,
  });

  return {
    users: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    isAdmin,
  };
}

export function useCreateAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateAdminUserRequest) => adminUsersAPI.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}
