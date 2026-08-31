/**
 * useEditPatientForm — form state, tabs, progress, and submit for EditPatientModal.
 */

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Patient } from '@/types';
import { patientFormSchema, type PatientFormInput } from '../schemas/patient.schema';
import { useCreatePatient, useUpdatePatient } from '../api/usePatients';
import { patientToFormInput } from '../utils/form-transformers';
import { calculateFormProgressV2 } from '../utils/patientHelpers';

export interface UseEditPatientFormParams {
  patient?: Patient;
  mode: 'create' | 'edit';
  onClose: () => void;
}

const TABS = [
  { id: 'general', label: 'General Info' },
  { id: 'medical', label: 'Medical Background' },
  { id: 'vitals', label: 'Vitals & Stats' },
  { id: 'affiliation', label: 'Affiliation' },
] as const;

export function useEditPatientForm({ patient, mode, onClose }: UseEditPatientFormParams) {
  const [activeTab, setActiveTab] = useState<string>('general');
  const create = useCreatePatient();
  const update = useUpdatePatient();

  const defaultValues = useMemo(() => {
    if (mode === 'edit' && patient) {
      return patientToFormInput(patient) as Partial<PatientFormInput>;
    }
    return { vitalSigns: {} };
  }, [mode, patient]);

  const form = useForm<PatientFormInput>({
    resolver: zodResolver(patientFormSchema),
    defaultValues,
    mode: 'onBlur',
  });

  const { register, handleSubmit, control, formState: { errors }, reset, watch, setValue } = form;
  const formValues = watch();
  const isPendingMutation = create.isPending || update.isPending;

  const onSubmit = async (data: PatientFormInput) => {
    if (isPendingMutation) return;
    try {
      if (mode === 'edit' && patient) {
        await update.mutateAsync({ id: patient.id, data });
      } else {
        await create.mutateAsync(data);
      }
      reset();
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleFormSubmit = handleSubmit(
    async data => { await onSubmit(data); },
    validationErrors => {
      const firstErrorPath = Object.keys(validationErrors)[0];
      const firstError = validationErrors[firstErrorPath as keyof typeof validationErrors];
      const errorMessage = firstError?.message || 'Please fix form errors';
      import('react-hot-toast').then(({ default: toast }) => {
        toast.error(`Validation error: ${errorMessage}`);
      });
      if (firstErrorPath) {
        const fieldName = firstErrorPath.split('.')[0];
        const element =
          document.querySelector(`[name="${fieldName}"]`) ||
          document.querySelector(`#${fieldName}`) ||
          document.querySelector(`[id*="${fieldName}"]`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  );

  const formProgress = useMemo(() => calculateFormProgressV2(formValues), [formValues]);
  const modalTitle = mode === 'edit' ? 'Edit Patient' : 'New Patient';
  const submitLabel = isPendingMutation
    ? (mode === 'edit' ? 'Saving...' : 'Creating...')
    : (mode === 'edit' ? 'Save Changes' : 'Create Patient');

  return {
    register,
    handleSubmit: handleFormSubmit,
    control,
    errors,
    isSubmitting: isPendingMutation,
    reset,
    watch,
    setValue,
    activeTab,
    setActiveTab,
    formProgress,
    tabs: TABS,
    modalTitle,
    submitLabel,
    mode,
    patient,
  };
}

export type UseEditPatientFormReturn = ReturnType<typeof useEditPatientForm>;
