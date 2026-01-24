/**
 * Patient API layer
 * Re-exports from TanStack Query hooks for consistency
 */

export {
  usePatientsList,
  usePatient,
  useCreatePatient,
  useUpdatePatient,
  useDeletePatient,
  useInvalidatePatients,
} from '@/hooks/queries';
