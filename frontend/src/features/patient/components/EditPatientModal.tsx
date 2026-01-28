/**
 * EditPatientModal - Using React Hook Form + Zod
 * Complete migration to new architecture
 */

import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Patient } from '@/types';
import { Button, Modal, CircularProgress, FooterInfo } from '@/shared/ui';
import { ICONS } from '@/utils';
import { displayId } from '@/utils';
import { FormErrorBoundary } from '@/shared/components';
import { patientFormSchema, type PatientFormInput } from '../schemas/patient.schema';
import { usePatientService } from '../services/usePatientService';
import { patientToFormInput } from '../utils/form-transformers';
import { PatientFormTabs } from './PatientFormTabs';
import { calculateFormProgressV2 } from '../utils/patient-helpers';

interface EditPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: Patient;
  mode: 'create' | 'edit';
}

interface TabNavigationProps {
  tabs: Array<{ id: string; label: string }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  formProgress: { percentage: number; filled: number; total: number };
}

const TabNavigation: React.FC<TabNavigationProps> = ({
  tabs,
  activeTab,
  onTabChange,
  formProgress,
}) => (
  <div className="flex items-center justify-between gap-4 mb-6">
    <div className="bg-neutral-200/60 p-1 rounded flex items-center gap-1">
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`
              relative flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 cursor-pointer
              ${
                isActive
                  ? 'bg-surface text-brand shadow-sm shadow-gray-200 ring-1 ring-black/5'
                  : 'text-text-tertiary hover:text-text-primary hover:bg-neutral-200/50'
              }
            `}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
    <CircularProgress
      size={18}
      percentage={formProgress.percentage}
      trackColorClass="stroke-gray-200"
      progressColorClass={
        formProgress.percentage === 100 ? 'stroke-emerald-500' : 'stroke-brand'
      }
      label={`${formProgress.filled}/${formProgress.total}`}
      className="h-7"
    />
  </div>
);

interface ModalFooterProps {
  onClose: () => void;
  submitLabel: string;
  isSubmitting: boolean;
  formId: string;
  footerInfo?: React.ReactNode;
}

const ModalFooter: React.FC<ModalFooterProps> = ({
  onClose,
  submitLabel,
  isSubmitting,
  formId,
  footerInfo,
}) => (
  <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border bg-surface shrink-0 shadow-[0_-1px_3px_rgba(0,0,0,0.04)]">
    {footerInfo}
    <div className="flex items-center gap-3">
      <Button type="button" variant="cancel" showIcon={true} onClick={onClose}>
        Cancel
      </Button>
      <Button
        type="submit"
        variant="save"
        form={formId}
        isLoading={isSubmitting}
        disabled={isSubmitting}
      >
        {submitLabel}
      </Button>
    </div>
  </div>
);

export const EditPatientModal: React.FC<EditPatientModalProps> = ({
  isOpen,
  onClose,
  patient,
  mode,
}) => {
  const [activeTab, setActiveTab] = useState<string>('general');
  const { create, update } = usePatientService();

  const defaultValues = useMemo(() => {
    if (mode === 'edit' && patient) {
      return patientToFormInput(patient) as Partial<PatientFormInput>;
    }
    // Create: seed vitalSigns so setValue merges and submit includes it (avoid stale watch + missing key)
    return { vitalSigns: {} };
  }, [mode, patient]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<PatientFormInput>({
    resolver: zodResolver(patientFormSchema),
    defaultValues,
    mode: 'onBlur',
  });

  const formValues = watch();

  // Single source of truth for submission state - React Query's isPending
  const isPendingMutation = create.isPending || update.isPending;

  const onSubmit = async (data: PatientFormInput) => {
    // React Query handles deduplication, but we check isPending for UX
    if (isPendingMutation) {
      return;
    }
    
    try {
      if (mode === 'edit' && patient) {
        await update.mutateAsync({ id: patient.id, data });
      } else {
        await create.mutateAsync(data);
      }
      reset();
      onClose();
    } catch (error) {
      // Error handled by service hook, form state preserved for retry
      console.error('Form submission error:', error);
    }
  };

  // Handle form submission with validation
  const handleFormSubmit = handleSubmit(
    async (data) => {
      await onSubmit(data);
    },
    (validationErrors) => {
      // Log validation errors for debugging
      console.error('Form validation errors:', validationErrors);
      console.error('Current form values:', formValues);
      
      // Show toast notification with first error
      const firstErrorPath = Object.keys(validationErrors)[0];
      const firstError = validationErrors[firstErrorPath as keyof typeof validationErrors];
      const errorMessage = firstError?.message || 'Please fix form errors';
      
      // Import toast dynamically to avoid circular dependency
      import('react-hot-toast').then(({ default: toast }) => {
        toast.error(`Validation error: ${errorMessage}`);
      });
      
      // Find first error and scroll to it
      if (firstErrorPath) {
        // Try to find the input field
        const fieldName = firstErrorPath.split('.')[0];
        const element = document.querySelector(`[name="${fieldName}"]`) || 
                       document.querySelector(`#${fieldName}`) ||
                       document.querySelector(`[id*="${fieldName}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  );

  const modalTitle = mode === 'edit' ? 'Edit Patient' : 'New Patient';
  const submitLabel = isSubmitting
    ? mode === 'edit'
      ? 'Saving...'
      : 'Creating...'
    : mode === 'edit'
      ? 'Save Changes'
      : 'Create Patient';

  const tabs = useMemo(
    () => [
      { id: 'general', label: 'General Info' },
      { id: 'medical', label: 'Medical Background' },
      { id: 'vitals', label: 'Vitals & Stats' },
      { id: 'affiliation', label: 'Affiliation' },
    ],
    []
  );

  const formProgress = useMemo(() => calculateFormProgressV2(formValues), [formValues]);

  return (
    <FormErrorBoundary>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={modalTitle}
        maxWidth="max-w-3xl"
      >
        <div className="flex flex-col h-full bg-app-bg">
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <form id="patient-form" onSubmit={handleFormSubmit} className="max-w-full">
              <TabNavigation
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                formProgress={formProgress}
              />

              <div className="rounded-lg border border-border bg-surface p-6">
                <PatientFormTabs
                  activeTab={activeTab}
                  register={register}
                  control={control}
                  errors={errors}
                  existingAffiliation={patient?.affiliation}
                  existingVitalSigns={patient?.vitalSigns}
                  watch={watch}
                  setValue={setValue}
                />
              </div>
            </form>
          </div>

          <ModalFooter
            onClose={onClose}
            submitLabel={submitLabel}
            isSubmitting={isPendingMutation}
            formId="patient-form"
            footerInfo={
              mode === 'edit' && patient ? (
                <FooterInfo
                  icon={ICONS.dataFields.user}
                  text={
                    <>
                      Editing{' '}
                      <span className="text-brand font-mono">
                        {displayId.patient(patient.id)}
                      </span>
                    </>
                  }
                />
              ) : (
                <FooterInfo icon={ICONS.actions.add} text="Creating new patient" />
              )
            }
          />
        </div>
      </Modal>
    </FormErrorBoundary>
  );
};
