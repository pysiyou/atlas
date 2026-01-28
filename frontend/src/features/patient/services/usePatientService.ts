import { useMutation, useQueryClient } from '@tanstack/react-query';
import { patientSchema, patientCreateSchema, patientUpdateSchema, type Patient } from '../schemas/patient.schema';
import { apiClient } from '@/services/api/client';
import { queryKeys } from '@/lib/query/keys';
import toast from 'react-hot-toast';
import type { Affiliation, AffiliationDuration } from '@/types';
import { formInputToPayload } from '../utils/form-transformers';

export function usePatientService() {
  const queryClient = useQueryClient();

  // Create patient mutation with Zod validation (full schema)
  const create = useMutation({
    mutationFn: async (input: unknown) => {
      const validated = patientCreateSchema.parse(input);
      const transformed = formInputToPayload(validated);
      const response = await apiClient.post<Patient>('/patients', transformed);
      return patientSchema.parse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
      toast.success('Patient created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create patient: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });

  // Update patient mutation (partial schema - all fields optional)
  const update = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: unknown }) => {
      const validated = patientUpdateSchema.parse(data);
      const transformed = formInputToPayload(validated);
      const response = await apiClient.put<Patient>(`/patients/${id}`, transformed);
      return patientSchema.parse(response);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.byId(String(id)) });
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
      toast.success('Patient updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update patient: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });

  // Business logic functions
  
  /**
   * Calculate age from date of birth
   */
  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  /**
   * Check if affiliation is active
   */
  const isAffiliationActive = (affiliation?: Affiliation): boolean => {
    if (!affiliation) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(affiliation.endDate);
    endDate.setHours(0, 0, 0, 0);
    return endDate >= today;
  };

  /**
   * Get affiliation status label
   */
  const getAffiliationStatus = (affiliation?: Affiliation): 'active' | 'expired' | 'none' => {
    if (!affiliation) return 'none';
    return isAffiliationActive(affiliation) ? 'active' : 'expired';
  };

  /**
   * Generate unique assurance number
   */
  const generateAssuranceNumber = (): string => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `ASS-${dateStr}-${randomSuffix}`;
  };

  /**
   * Calculate end date based on duration (duration is in months)
   */
  const calculateEndDate = (startDate: string, duration: AffiliationDuration): string => {
    const start = new Date(startDate);
    start.setMonth(start.getMonth() + duration);
    return start.toISOString().slice(0, 10);
  };

  return {
    // Mutations
    create,
    update,
    
    // Business logic
    calculateAge,
    isAffiliationActive,
    getAffiliationStatus,
    generateAssuranceNumber,
    calculateEndDate,
  };
}
