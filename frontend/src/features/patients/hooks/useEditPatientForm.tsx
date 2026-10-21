/**
 * useEditPatientForm — form state, tabs, and submit for EditPatientModal.
 */

import React, { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ModalContextSubtitle } from '@/components/display';
import type { Patient } from '@/types';
import { patientCreateSchema, type PatientFormInput } from '../schemas/patientFormSchemas';
import { useCreatePatient, useUpdatePatient } from '../api/patients';
import { patientToFormInput } from '../utils/formTransformers';
import { patientCreateDefaultValues } from '../utils/patientFormDefaults';
import {
  focusPatientFormField,
  patientFormTabForFieldPath,
  resolveFirstPatientFormErrorPath,
} from '../patientFormNavigation';

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
    return patientCreateDefaultValues;
  }, [mode, patient]);

  const form = useForm<PatientFormInput>({
    resolver: zodResolver(patientCreateSchema),
    defaultValues,
    mode: 'onBlur',
  });

  const { handleSubmit, control, reset } = form;
  const formValues = useWatch({ control });
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
    async data => {
      await onSubmit(data);
    },
    validationErrors => {
      const firstPath = resolveFirstPatientFormErrorPath(validationErrors);
      if (!firstPath) return;
      setActiveTab(patientFormTabForFieldPath(firstPath));
      requestAnimationFrame(() => focusPatientFormField(firstPath));
    },
  );

  const modalTitle = mode === 'edit' ? 'Edit Patient' : 'New Patient';
  const subtitle = useMemo((): React.ReactNode => {
    const draftName = formValues?.fullName?.trim() ?? '';
    if (mode === 'edit' && patient) {
      const label = draftName || patient.fullName;
      return <ModalContextSubtitle label={label} patientId={patient.id} />;
    }
    if (draftName) {
      return <ModalContextSubtitle label={draftName} />;
    }
    return 'Enter patient details below';
  }, [formValues?.fullName, mode, patient]);
  const submitLabel = isPendingMutation
    ? (mode === 'edit' ? 'Saving...' : 'Creating...')
    : (mode === 'edit' ? 'Save Changes' : 'Create Patient');

  return {
    form,
    handleSubmit: handleFormSubmit,
    isSubmitting: isPendingMutation,
    activeTab,
    setActiveTab,
    tabs: TABS,
    modalTitle,
    subtitle,
    submitLabel,
  };
}

export type UseEditPatientFormReturn = ReturnType<typeof useEditPatientForm>;
