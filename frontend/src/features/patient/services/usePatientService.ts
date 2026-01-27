import { useMutation, useQueryClient } from '@tanstack/react-query';
import { patientSchema, patientFormSchema, type Patient } from '../schemas/patient.schema';
import { apiClient } from '@/services/api/client';
import { queryKeys } from '@/lib/query/keys';
import toast from 'react-hot-toast';

export function usePatientService() {
  const queryClient = useQueryClient();

  // Create patient mutation with Zod validation
  const create = useMutation({
    mutationFn: async (input: unknown) => {
      const validated = patientFormSchema.parse(input);
      const response = await apiClient.post<Patient>('/patients', validated);
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

  // Update patient mutation
  const update = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: unknown }) => {
      const validated = patientFormSchema.partial().parse(data);
      const response = await apiClient.put<Patient>(`/patients/${id}`, validated);
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

  // Pure business logic functions
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

  const isAffiliationActive = (patient: Patient): boolean => {
    if (!patient.affiliation) return false;
    return new Date(patient.affiliation.endDate) > new Date();
  };

  return {
    create,
    update,
    calculateAge,
    isAffiliationActive,
  };
}
