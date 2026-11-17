import { useDebouncedValue } from '@/hooks';
import { apiClient } from '@/lib/api';
import { parseApiResponse } from '@/lib/api/schemas/responses.schema';
import {
  referentDoctorCreateSchema,
  referentDoctorResponseSchema,
} from '../schemas/referentDoctor.schema';
import { cacheConfig, queryKeys, useAuthQueryEnabled } from '@/lib/query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

export interface ReferentDoctor {
  referentDoctorId: string;
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
  referentDoctorId?: string | null;
  username?: string | null;
  email?: string | null;
  phone?: string | null;
  hospitalName?: string | null;
}

export const referentDoctorAPI = {
  async list(q?: string, limit = 50): Promise<ReferentDoctor[]> {
    const params: Record<string, string> = { limit: String(limit) };
    if (q?.trim()) params.q = q.trim();
    const data = await apiClient.get<ReferentDoctor[]>('/referent-doctors', params);
    return z.array(referentDoctorResponseSchema).parse(data) as ReferentDoctor[];
  },

  async create(payload: ReferentDoctorCreateInput): Promise<ReferentDoctor> {
    const body = referentDoctorCreateSchema.parse(payload);
    const data = await apiClient.post<ReferentDoctor>('/referent-doctors', body);
    return parseApiResponse(referentDoctorResponseSchema, data, 'referent doctor') as ReferentDoctor;
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
