/**
 * Workup bundles — groups of orderable test codes (GET /workups).
 */
import { apiClient } from '@/lib/api';
import { expectArray } from '@/lib/api';
import { cacheConfig, queryKeys, useAuthQueryEnabled } from '@/lib/query';
import { useQuery } from '@tanstack/react-query';

export interface Workup {
  code: string;
  name: string;
  description?: string | null;
  testCodes: string[];
  isActive: boolean;
}

export const workupsAPI = {
  async list(activeOnly = true): Promise<Workup[]> {
    const rows = await apiClient.get<Workup[]>('/workups', {
      activeOnly: String(activeOnly),
    });
    return expectArray(rows, 'workups');
  },
};

export function useWorkups() {
  const enabled = useAuthQueryEnabled();
  const query = useQuery({
    queryKey: queryKeys.workups.list(),
    queryFn: () => workupsAPI.list(true),
    enabled,
    ...cacheConfig.static,
  });
  return {
    workups: query.data ?? [],
    isLoading: query.isLoading,
  };
}