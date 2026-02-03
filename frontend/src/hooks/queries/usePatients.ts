/**
 * Patients Query Hook
 *
 * Provides access to patient data with semi-static caching (5 min stale time).
 * Patients change occasionally but not as frequently as orders.
 *
 * @module hooks/queries/usePatients
 */

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { queryKeys, cacheConfig } from '@/lib/query';
import { patientAPI } from '@/services/api/patients';
import { useAuthStore } from '@/shared/stores/auth.store';
import type { Patient } from '@/types';

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
      setPage((p) => p + 1);
    }
  }, [query.data?.pagination.hasNext]);

  const prevPage = useCallback(() => {
    if (query.data?.pagination.hasPrev) {
      setPage((p) => p - 1);
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

  const patientsMap = useMemo(() => {
    const map = new Map<number, Patient>();
    patients.forEach(p => map.set(p.id, p));
    return map;
  }, [patients]);

  const getPatientName = useCallback(
    (patientId: number | string): string => {
      const numericId = typeof patientId === 'string' ? parseInt(patientId, 10) : patientId;
      if (isNaN(numericId)) return 'Unknown Patient';
      const patient = patientsMap.get(numericId);
      return patient?.fullName ?? 'Unknown Patient';
    },
    [patientsMap]
  );

  const getPatient = useCallback(
    (patientId: number | string): Patient | undefined => {
      const numericId = typeof patientId === 'string' ? parseInt(patientId, 10) : patientId;
      if (isNaN(numericId)) return undefined;
      return patientsMap.get(numericId);
    },
    [patientsMap]
  );

  return {
    getPatientName,
    getPatient,
    isLoading,
  };
}

/**
 * Mutation hook to create a new patient.
 * Invalidates the patients list cache on success.
 *
 * @returns Mutation result with mutate function
 *
 * @example
 * ```tsx
 * const { mutate: createPatient, isPending } = useCreatePatient();
 * createPatient(newPatientData);
 * ```
 */
export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patient: Patient) => patientAPI.create(patient),
    onSuccess: () => {
      // Invalidate and refetch patients list
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
    },
  });
}

/**
 * Mutation hook to update an existing patient.
 * Invalidates relevant caches on success.
 *
 * @returns Mutation result with mutate function
 *
 * @example
 * ```tsx
 * const { mutate: updatePatient } = useUpdatePatient();
 * updatePatient({ id: 'PAT-001', updates: { phone: '555-1234' } });
 * ```
 */
export function useUpdatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: number | string; updates: Partial<Patient> }) => {
      const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
      return patientAPI.update(numericId.toString(), updates);
    },
    onSuccess: (_, variables) => {
      const idStr = typeof variables.id === 'string' ? variables.id : variables.id.toString();
      // Invalidate specific patient and list
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.byId(idStr) });
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.lists() });
    },
  });
}

/**
 * Mutation hook to delete a patient.
 * Invalidates the patients list cache on success.
 *
 * @returns Mutation result with mutate function
 */
export function useDeletePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => {
      const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
      return patientAPI.delete(numericId.toString());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
    },
  });
}

/**
 * Hook to invalidate patient caches.
 *
 * @returns Object with invalidate functions
 */
export function useInvalidatePatients() {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
  };

  const invalidatePatient = (patientId: string) => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.patients.byId(patientId) });
  };

  return { invalidateAll, invalidatePatient };
}
