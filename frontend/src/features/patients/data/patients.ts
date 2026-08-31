/**
 * Patient API Service + React Query hooks
 */

import { apiClient } from '@/lib/api/client';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { useEntityLookup, parseNumericKey } from '@/hooks/useEntityLookup';
import { queryKeys, cacheConfig } from '@/lib/query';
import { invalidatePatientQueries } from '@/lib/query/invalidate';
import { useAuthStore } from '@/app/store';
import { toast } from '@/app/AppToastBar';
import { getErrorMessage } from '@/utils/errors';
import {
  patientSchema,
  patientCreateSchema,
  patientUpdateSchema,
} from '../schemas/patient.schema';
import { formInputToPayload } from '../utils/formTransformers';
import { useOrdersList } from '@/features/orders/data/orders';
import type { Patient, PatientContext } from '@/types';
import type { PaginatedResponse, PaginationMeta } from '@/types/pagination';

/**
 * Filter options for patients list
 */
export interface PatientsFilter {
  search?: string;
  page?: number;
  pageSize?: number;
}

export type { PaginatedResponse, PaginationMeta };

export const patientAPI = {
  /**
   * Get all patients (requests up to backend max so tables can show full list)
   */
  async getAll(): Promise<Patient[]> {
    return apiClient.get<Patient[]>('/patients', { limit: '10000' });
  },

  /**
   * Get patients with pagination
   */
  async getPaginated(filters?: PatientsFilter): Promise<PaginatedResponse<Patient>> {
    const params: Record<string, string> = { paginated: 'true' };

    if (filters?.search) params.search = filters.search;
    if (filters?.page) params.skip = String((filters.page - 1) * (filters.pageSize || 20));
    if (filters?.pageSize) params.limit = String(filters.pageSize);

    return apiClient.get<PaginatedResponse<Patient>>('/patients', params);
  },

  /**
   * Get patient by ID
   */
  async getById(id: string): Promise<Patient | null> {
    return apiClient.get<Patient>(`/patients/${id}`);
  },

  /**
   * Create new patient
   */
  async create(patient: Patient): Promise<Patient> {
    return apiClient.post<Patient>('/patients', patient);
  },

  /**
   * Update patient
   */
  async update(id: string, updates: Partial<Patient>): Promise<Patient> {
    return apiClient.put<Patient>(`/patients/${id}`, updates);
  },

  /**
   * Delete patient
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/patients/${id}`);
  },

  /**
   * Search patients
   */
  async search(query: string): Promise<Patient[]> {
    return apiClient.get<Patient[]>('/patients/search', { q: query });
  },
};


/**
 * Patients Query Hook
 *
 * Provides access to patient data with semi-static caching (5 min stale time).
 * Patients change occasionally but not as frequently as orders.
 *
 *  */

/**
 * Hook to fetch and cache all patients.
 * Uses semi-static cache - data is considered fresh for 5 minutes.
 * Only fetches when user is authenticated to prevent race conditions on login.
 *
 * @returns Query result containing patients array and loading state
 *
 * @example
 * ```tsx
 * const { patients, isLoading, error } = usePatientsList();
 * ```
 */
export function usePatientsList() {
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();

  const query = useQuery({
    queryKey: queryKeys.patients.list(),
    queryFn: () => patientAPI.getAll(),
    enabled: isAuthenticated && !isRestoring, // Only fetch when authenticated and not restoring
    ...cacheConfig.semiStatic, // 5 min stale, 30 min gc
  });

  return {
    patients: query.data ?? [],
    isLoading: query.isLoading,
    isPending: query.isPending,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to fetch paginated patients with server-side filtering.
 *
 * Use this for large datasets where client-side filtering is not practical.
 * Keeps previous data visible while fetching new page.
 *
 * @param search - Optional search query
 * @param initialPage - Starting page (default: 1)
 * @param pageSize - Items per page (default: 20)
 */
export function usePaginatedPatients(search?: string, initialPage = 1, pageSize = 20) {
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();
  const [page, setPage] = useState(initialPage);

  const query = useQuery({
    queryKey: queryKeys.patients.paginated({ search, page, pageSize }),
    queryFn: () => patientAPI.getPaginated({ search, page, pageSize }),
    enabled: isAuthenticated && !isRestoring,
    placeholderData: keepPreviousData,
    ...cacheConfig.semiStatic,
  });

  const goToPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const nextPage = useCallback(() => {
    if (query.data?.pagination.hasNext) {
      setPage(p => p + 1);
    }
  }, [query.data?.pagination.hasNext]);

  const prevPage = useCallback(() => {
    if (query.data?.pagination.hasPrev) {
      setPage(p => p - 1);
    }
  }, [query.data?.pagination.hasPrev]);

  return {
    patients: query.data?.data ?? [],
    pagination: query.data?.pagination ?? {
      page: 1,
      pageSize,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    },
    isLoading: query.isLoading,
    isPending: query.isPending,
    isFetching: query.isFetching,
    isPlaceholderData: query.isPlaceholderData,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    page,
    goToPage,
    nextPage,
    prevPage,
  };
}

/**
 * Hook to fetch a single patient by ID.
 * Only fetches when user is authenticated to prevent race conditions on login.
 *
 * @param patientId - The patient ID to fetch
 * @returns Query result with patient data
 *
 * @example
 * ```tsx
 * const { patient, isLoading } = usePatient('PAT-001');
 * ```
 */
export function usePatient(patientId: string | undefined) {
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();

  const query = useQuery({
    queryKey: queryKeys.patients.byId(patientId ?? ''),
    queryFn: () => patientAPI.getById(patientId!),
    enabled: isAuthenticated && !isRestoring && !!patientId, // Only fetch when authenticated and not restoring
    ...cacheConfig.semiStatic,
  });

  return {
    patient: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}

/**
 * Hook to search patients by name, ID, or phone.
 * Uses client-side filtering on cached data for fast results.
 *
 * @param searchQuery - Search query string
 * @returns Filtered array of patients
 *
 * @example
 * ```tsx
 * const { results } = usePatientSearch('john');
 * ```
 */
export function usePatientSearch(searchQuery: string) {
  const { patients, isLoading } = usePatientsList();

  const results = useMemo(() => {
    if (!searchQuery.trim()) {
      return patients;
    }

    const query = searchQuery.toLowerCase();
    return patients.filter(
      patient =>
        patient.fullName.toLowerCase().includes(query) ||
        patient.id.toString().toLowerCase().includes(query) ||
        patient.phone.includes(searchQuery)
    );
  }, [patients, searchQuery]);

  return {
    results,
    isSearching: isLoading,
    totalCount: patients.length,
  };
}

/**
 * Hook that uses the select pattern to return only dropdown options.
 * Uses the same cached data as usePatientsList but transforms it.
 * Re-renders only when the selected data (options array) changes.
 *
 * This demonstrates the TanStack Query select pattern for deriving
 * component-specific data from a shared cache.
 *
 * @returns Array of patient options for dropdowns { value, label }
 *
 * @example
 * ```tsx
 * const { options, isLoading } = usePatientOptions();
 * // options = [{ value: 1, label: 'John Doe' }, ...]
 * ```
 */
export function usePatientOptions() {
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();

  const query = useQuery({
    queryKey: queryKeys.patients.list(),
    queryFn: () => patientAPI.getAll(),
    enabled: isAuthenticated && !isRestoring,
    ...cacheConfig.semiStatic,
    // SELECT PATTERN: Transform full patient list to dropdown options
    // Only re-renders when the derived options change, not the full data
    select: (patients: Patient[]) =>
      patients.map(p => ({
        value: p.id,
        label: p.fullName,
        // Include extra data for search functionality
        searchText: `${p.fullName} ${p.phone}`.toLowerCase(),
      })),
  });

  return {
    options: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

/**
 * Hook that uses select to return patient names by ID.
 * Creates a Map for O(1) lookups without re-rendering on full data changes.
 *
 * @returns Map of patient IDs to names
 *
 * @example
 * ```tsx
 * const { namesMap, isLoading } = usePatientNames();
 * const name = namesMap.get(patientId) ?? 'Unknown';
 * ```
 */
export function usePatientNames() {
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();

  const query = useQuery({
    queryKey: queryKeys.patients.list(),
    queryFn: () => patientAPI.getAll(),
    enabled: isAuthenticated && !isRestoring,
    ...cacheConfig.semiStatic,
    // SELECT PATTERN: Transform to Map for efficient lookups
    select: (patients: Patient[]) => {
      const map = new Map<number, string>();
      patients.forEach(p => map.set(p.id, p.fullName));
      return map;
    },
  });

  return {
    namesMap: query.data ?? new Map<number, string>(),
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

/**
 * Hook to get patient name lookup function.
 * Returns a function that resolves patient IDs to names.
 *
 * @returns Object with getPatientName function
 *
 * @example
 * ```tsx
 * const { getPatientName } = usePatientNameLookup();
 * const name = getPatientName('PAT-001'); // "John Doe"
 * ```
 */
export function usePatientNameLookup() {
  const { patients, isLoading } = usePatientsList();
  const { get: getPatient, map: patientsMap } = useEntityLookup(patients, p => p.id, {
    isLoading,
    normalizeKey: parseNumericKey,
  });

  const getPatientName = useCallback(
    (patientId: number | string): string => {
      const patient = getPatient(patientId);
      return patient?.fullName ?? 'Unknown Patient';
    },
    [getPatient]
  );

  return {
    getPatientName,
    getPatient,
    isLoading,
    patientsMap,
  };
}

/**
 * Mutation hook to create a new patient with Zod validation.
 */
export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: unknown) => {
      const validated = patientCreateSchema.parse(input);
      const transformed = formInputToPayload(validated);
      const response = await patientAPI.create(transformed as unknown as Patient);
      return patientSchema.parse(response);
    },
    onSuccess: () => {
      invalidatePatientQueries(queryClient);
      queryClient.refetchQueries({ queryKey: queryKeys.patients.list() });
      toast.success('Patient created successfully');
    },
    onError: error => {
      toast.error(`Failed to create patient: ${getErrorMessage(error, 'Unknown error')}`);
    },
  });
}

/**
 * Mutation hook to update an existing patient with Zod validation.
 */
export function useUpdatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: unknown }) => {
      const validated = patientUpdateSchema.parse(data);
      const transformed = formInputToPayload(validated);
      const response = await patientAPI.update(id.toString(), transformed);
      return patientSchema.parse(response);
    },
    onSuccess: (_, { id }) => {
      invalidatePatientQueries(queryClient, { patientId: id });
      toast.success('Patient updated successfully');
    },
    onError: error => {
      toast.error(`Failed to update patient: ${getErrorMessage(error, 'Unknown error')}`);
    },
  });
}


/**
 * usePatientContextList — Superset enrichment hook for patient list views.
 */

export function usePatientContextList(): {
  patients: PatientContext[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
} {
  const { patients: rawPatients, isLoading: pLoading, isError: pError, refetch } = usePatientsList();
  const { orders, isLoading: oLoading } = useOrdersList();

  const patients = useMemo<PatientContext[]>(() => {
    if (!rawPatients || !orders) return [];

    // Group orders by patientId for O(n) lookup
    const ordersByPatient = new Map<number, typeof orders>();
    for (const order of orders) {
      const pid = order.patientId;
      if (!ordersByPatient.has(pid)) ordersByPatient.set(pid, []);
      ordersByPatient.get(pid)!.push(order);
    }

    return rawPatients.map(patient => {
      const patientOrders = ordersByPatient.get(patient.id) ?? [];

      // Sort descending by orderDate to find the most recent
      const sorted = [...patientOrders].sort(
        (a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
      );
      const lastOrder = sorted[0];

      const hasUnpaidOrders = patientOrders.some(o => o.paymentStatus === 'unpaid');

      return {
        ...patient,
        orderCount: patientOrders.length,
        lastOrderDate: lastOrder?.orderDate,
        lastOrderStatus: lastOrder?.overallStatus,
        hasUnpaidOrders,
      } satisfies PatientContext;
    });
  }, [rawPatients, orders]);

  return {
    patients,
    isLoading: pLoading || oLoading,
    isError: pError,
    refetch,
  };
}
