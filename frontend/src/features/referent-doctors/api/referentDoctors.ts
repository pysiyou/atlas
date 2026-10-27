import { apiClient } from '@/lib/api/client';
import { queryKeys, cacheConfig, useAuthQueryEnabled } from '@/lib/query';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface ReferentDoctor {
  referentDoctorId: number;
  fullName: string;
  username?: string | null;
  email?: string | null;
  phone?: string | null;
  hospitalName?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReferentDoctorCreateInput {
  fullName: string;
  username?: string | null;
  email?: string | null;
  phone?: string | null;
  hospitalName?: string | null;
}

export const referentDoctorAPI = {
  async list(q?: string, limit = 50): Promise<ReferentDoctor[]> {
    const params: Record<string, string> = { limit: String(limit) };
    if (q?.trim()) params.q = q.trim();
    return apiClient.get<ReferentDoctor[]>('/referent-doctors', params);
  },

  async create(payload: ReferentDoctorCreateInput): Promise<ReferentDoctor> {
    return apiClient.post<ReferentDoctor>('/referent-doctors', payload);
  },
};

export function useReferentDoctorSearch(searchQuery: string) {
  const debounced = useDebouncedValue(searchQuery, 250);
  const enabled = useAuthQueryEnabled();

  const query = useQuery({
    queryKey: queryKeys.referentDoctors.search(debounced),
    queryFn: () => referentDoctorAPI.list(debounced || undefined),
    enabled,
    ...cacheConfig.semiStatic,
  });

  return {
    results: query.data ?? [],
    isLoading: query.isLoading,
  };
}

export function useCreateReferentDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReferentDoctorCreateInput) => referentDoctorAPI.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.referentDoctors.all });
    },
  });
}
