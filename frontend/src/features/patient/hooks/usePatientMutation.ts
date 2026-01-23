/**
 * Patient Mutation Hook
 * Handles patient create and update operations with validation and error handling
 */

import { useState } from 'react';
import { usePatients, useAuth } from '@/hooks';
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
  handleCreatePatient: (formData: PatientFormData) => Promise<void>;
  handleUpdatePatient: (formData: PatientFormData, isRenewing: boolean) => Promise<void>;
}

/**
 * Hook for handling patient creation and updates
 */
export const usePatientMutation = ({
  existingPatient,
  onSuccess,
}: UsePatientMutationProps): UsePatientMutationReturn => {
  const { currentUser } = useAuth();
  const { addPatient, updatePatient } = usePatients();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  const handleCreatePatient = async (formData: PatientFormData): Promise<void> => {
    setIsSubmitting(true);

    try {
      const newPatient = buildNewPatientPayload(formData, 0, getCurrentUserId());
      await addPatient(newPatient);
      toast.success(`Patient ${newPatient.fullName} registered successfully!`);
      onSuccess?.();
    } catch (error) {
      logger.error('Error creating patient', error instanceof Error ? error : undefined);
      toast.error('Failed to create patient');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handles patient update
   */
  const handleUpdatePatient = async (
    formData: PatientFormData,
    isRenewing: boolean
  ): Promise<void> => {
    if (!existingPatient) {
      toast.error('Missing patient data for edit');
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedPatient = buildUpdatedPatientPayload(
        formData,
        existingPatient,
        getCurrentUserId(),
        isRenewing
      );
      await updatePatient(existingPatient.id, updatedPatient);

      if (isRenewing) {
        toast.success('Affiliation renewed successfully');
      } else {
        toast.success('Patient updated successfully');
      }
      onSuccess?.();
    } catch (error) {
      logger.error('Error updating patient', error instanceof Error ? error : undefined);
      toast.error('Failed to update patient');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    handleCreatePatient,
    handleUpdatePatient,
  };
};
