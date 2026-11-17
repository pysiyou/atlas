/**
 * Clinical workup bundles — groups of orderable test codes.
 */
import { apiClient } from '@/lib/api';
import { expectArray } from '@/lib/api';
import { cacheConfig, queryKeys, useAuthQueryEnabled } from '@/lib/query';
import { useQuery } from '@tanstack/react-query';

export interface ClinicalWorkup {
  code: string;
  name: string;
  description?: string | null;
  testCodes: string[];
  isActive: boolean;
}

export const clinicalWorkupAPI = {
  async list(activeOnly = true): Promise<ClinicalWorkup[]> {
    const rows = await apiClient.get<ClinicalWorkup[]>('/clinical-workups', {
      activeOnly: String(activeOnly),
    });
    return expectArray(rows, 'clinical workups');
  },
};

export function useClinicalWorkups() {
  const enabled = useAuthQueryEnabled();
  const query = useQuery({
    queryKey: queryKeys.clinicalWorkups.list(),
    queryFn: () => clinicalWorkupAPI.list(true),
    enabled,
    ...cacheConfig.static,
  });
  return {
    workups: query.data ?? [],
    isLoading: query.isLoading,
  };
}