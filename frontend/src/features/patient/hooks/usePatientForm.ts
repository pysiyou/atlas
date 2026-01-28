/**
 * usePatientForm Hook
 * 
 * Manages patient form state, validation, and submission using React Hook Form + Zod
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { patientFormSchema, type PatientFormInput } from '../schemas/patient.schema';
import { patientToFormInput } from '../utils/form-transformers';
import { usePatientService } from '../services/usePatientService';
import type { Patient } from '@/types';

interface UsePatientFormOptions {
  patient?: Patient;
  mode?: 'create' | 'edit';
  onSubmitSuccess?: () => void;
}

/**
 * Hook for managing patient form state and submission
 */
export function usePatientForm({ patient, mode = 'create', onSubmitSuccess }: UsePatientFormOptions = {}) {
  const { create, update } = usePatientService();

  const defaultValues = useMemo(() => {
    if (mode === 'edit' && patient) {
      return patientToFormInput(patient) as Partial<PatientFormInput>;
    }
    return {};
  }, [mode, patient]);

  const form = useForm<PatientFormInput>({
    resolver: zodResolver(patientFormSchema),
    defaultValues,
    mode: 'onBlur',
  });

  const onSubmit = async (data: PatientFormInput) => {
    try {
      if (mode === 'edit' && patient) {
        await update.mutateAsync({ id: patient.id, data });
      } else {
        await create.mutateAsync(data);
      }
      form.reset();
      onSubmitSuccess?.();
    } catch (error) {
      // Error handled by service hook
      console.error('Form submission error:', error);
      throw error;
    }
  };

  return {
    ...form,
    handleSubmit: form.handleSubmit(onSubmit),
    isSubmitting: create.isPending || update.isPending,
    mode,
  };
}
