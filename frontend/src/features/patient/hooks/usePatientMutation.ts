/**
 * Patient Mutation Hook
 * Handles patient create and update operations with validation and error handling
 */

import { useAuth } from '@/hooks';
import { useCreatePatient, useUpdatePatient } from '@/hooks/queries';
import toast from 'react-hot-toast';
import { logger } from '@/utils/logger';
import type { Patient } from '@/types';
import type { PatientFormData } from '../usePatientForm';
import { buildNewPatientPayload, buildUpdatedPatientPayload } from '../utils/patientPayloadBuilder';

export interface UsePatientMutationProps {
  existingPatient?: Patient;
  onSuccess?: () => void;
}

export interface UsePatientMutationReturn {
  isSubmitting: boolean;
  handleCreatePatient: (formData: PatientFormData) => Promise<Patient>;
  handleUpdatePatient: (formData: PatientFormData, isRenewing: boolean) => Promise<Patient>;
}

/**
 * Hook for handling patient creation and updates
 */
export const usePatientMutation = ({
  existingPatient,
  onSuccess,
}: UsePatientMutationProps): UsePatientMutationReturn => {
  const { currentUser } = useAuth();
  const createPatientMutation = useCreatePatient();
  const updatePatientMutation = useUpdatePatient();

  /**
   * Gets the current user ID as a number
   */
  const getCurrentUserId = (): number => {
    return typeof currentUser?.id === 'string'
      ? parseInt(currentUser.id, 10)
      : currentUser?.id || 0;
  };

  /**
   * Handles patient creation
   */
  const handleCreatePatient = async (formData: PatientFormData): Promise<Patient> => {
    try {
      const newPatient = buildNewPatientPayload(formData, 0, getCurrentUserId());
      const createdPatient = await createPatientMutation.mutateAsync(newPatient);
      toast.success(`Patient ${newPatient.fullName} registered successfully!`);
      onSuccess?.();
      return createdPatient;
    } catch (error) {
      logger.error('Error creating patient', error instanceof Error ? error : undefined);
      toast.error('Failed to create patient');
      throw error;
    }
  };

  /**
   * Handles patient update
   */
  const handleUpdatePatient = async (
    formData: PatientFormData,
    isRenewing: boolean
  ): Promise<Patient> => {
    if (!existingPatient) {
      toast.error('Missing patient data for edit');
      throw new Error('Missing patient data for edit');
    }

    try {
      const updatedPatient = buildUpdatedPatientPayload(
        formData,
        existingPatient,
        getCurrentUserId(),
        isRenewing
      );
      const result = await updatePatientMutation.mutateAsync({
        id: existingPatient.id,
        updates: updatedPatient,
      });

      if (isRenewing) {
        toast.success('Affiliation renewed successfully');
      } else {
        toast.success('Patient updated successfully');
      }
      onSuccess?.();
      return result;
    } catch (error) {
      logger.error('Error updating patient', error instanceof Error ? error : undefined);
      toast.error('Failed to update patient');
      throw error;
    }
  };

  return {
    isSubmitting: createPatientMutation.isPending || updatePatientMutation.isPending,
    handleCreatePatient,
    handleUpdatePatient,
  };
};
