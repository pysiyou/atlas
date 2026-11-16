/**
 * useEditPatientForm — form state, tabs, and submit for EditPatientModal.
 */

import React, { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ModalContextSubtitle } from '@/components/display';

import type { Patient } from '@/types';
import { patientCreateSchema, patientSchema, type PatientFormInput } from '../schemas/patientFormSchemas';
import { useCreatePatient, useUpdatePatient } from '../api/patients';
import { patientToFormInput } from '../utils/formTransformers';
import { patientCreateDefaultValues } from '../utils/patientFormDefaults';
import {
  focusPatientFormField,
  patientFormTabForFieldPath,
  resolveFirstPatientFormErrorPath,
} from '../patientFormNavigation';
import { useModuleListTitles } from '@/strings';
import { isApiError } from '@/lib/api';

export interface UseEditPatientFormParams {
  patient?: Patient;
  mode: 'create' | 'edit';
  onClose: () => void;
  onCreated?: (patient: Patient) => void;
}

const TABS = [
  { id: 'general', label: 'General Info' },
  { id: 'medical', label: 'Medical Background' },
  { id: 'affiliation', label: 'Affiliation' },
] as const;

export function useEditPatientForm({ patient, mode, onClose, onCreated }: UseEditPatientFormParams) {
  const [activeTab, setActiveTab] = useState<string>('general');
  const [duplicateMatches, setDuplicateMatches] = useState<Patient[]>([]);
  const [pendingCreateData, setPendingCreateData] = useState<PatientFormInput | null>(null);
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

  const finishCreate = (created: Patient) => {
    reset();
    setDuplicateMatches([]);
    setPendingCreateData(null);
    onCreated?.(created);
    onClose();
  };

  const onSubmit = async (data: PatientFormInput, forceCreate = false) => {
    if (isPendingMutation) return;
    try {
      if (mode === 'edit' && patient) {
        await update.mutateAsync({ id: patient.id, data });
        reset();
        onClose();
        return;
      }
      const created = await create.mutateAsync({ data, forceCreate });
      finishCreate(created as Patient);
    } catch (error) {
      if (isApiError(error) && error.code === 'DUPLICATE_PATIENT') {
        const parsed = (error.matches ?? [])
          .map(item => {
            const result = patientSchema.safeParse(item);
            return result.success ? (result.data as Patient) : null;
          })
          .filter((item): item is Patient => item !== null);
        setPendingCreateData(data);
        setDuplicateMatches(parsed);
        return;
      }
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

  const titles = useModuleListTitles();
  const modalTitle = mode === 'edit' ? titles.editPatient : titles.newPatientModal;
  const subtitle = useMemo((): React.ReactNode => {
    const draftName = formValues?.fullName?.trim() ?? '';
    if (mode === 'edit' && patient) {
      const label = draftName || patient.fullName;
      return <ModalContextSubtitle label={label} patientId={patient.mrn} />;
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
    duplicateMatches,
    onSelectExisting: (existing: Patient) => {
      finishCreate(existing);
    },
    onForceCreate: () => {
      if (pendingCreateData) {
        void onSubmit(pendingCreateData, true);
      }
    },
    onDismissDuplicates: () => {
      setDuplicateMatches([]);
      setPendingCreateData(null);
    },
  };
}

export type UseEditPatientFormReturn = ReturnType<typeof useEditPatientForm>;
