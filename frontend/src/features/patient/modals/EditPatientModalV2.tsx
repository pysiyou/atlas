/**
 * EditPatientModal V2 - Using React Hook Form + Zod
 * Complete migration to new architecture
 */

import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Patient } from '@/types';
import { Button, Modal, CircularProgress, FooterInfo } from '@/shared/ui';
import { ICONS } from '@/utils/icon-mappings';
import { displayId } from '@/utils/id-display';
import { FormErrorBoundary } from '@/shared/components';
import { patientFormSchema, type PatientFormInput } from '../schemas/patient.schema';
import { usePatientService } from '../services/usePatientService';
import { patientToFormInput } from '../utils/formTransformers';
import { PatientFormTabsV2 } from '../components/forms/PatientFormTabsV2';
import { calculateFormProgressV2 } from '../utils/patientUtils';

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

export const EditPatientModalV2: React.FC<EditPatientModalProps> = ({
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
    return {};
  }, [mode, patient]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<PatientFormInput>({
    resolver: zodResolver(patientFormSchema),
    defaultValues,
    mode: 'onBlur',
  });

  const formValues = watch();

  const onSubmit = async (data: PatientFormInput) => {
    try {
      if (mode === 'edit' && patient) {
        await update.mutateAsync({ id: patient.id, data });
      } else {
        await create.mutateAsync(data);
      }
      reset();
      onClose();
    } catch (error) {
      // Error handled by service hook
      console.error('Form submission error:', error);
    }
  };

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
        subtitle={mode === 'edit' && patient ? <span className="font-mono">{displayId.patient(patient.id)}</span> : undefined}
        maxWidth="max-w-3xl"
      >
        <div className="h-full flex flex-col bg-app-bg">
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <form id="patient-upsert-form" onSubmit={handleSubmit(onSubmit)} className="max-w-full">
              <TabNavigation
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                formProgress={formProgress}
              />

              <div className="rounded-lg border border-border bg-surface p-6">
                <PatientFormTabsV2
                  activeTab={activeTab}
                  register={register}
                  control={control}
                  errors={errors}
                  existingAffiliation={patient?.affiliation}
                />
              </div>
            </form>
          </div>

          <ModalFooter
            onClose={onClose}
            submitLabel={submitLabel}
            isSubmitting={isSubmitting || create.isPending || update.isPending}
            formId="patient-upsert-form"
            footerInfo={<FooterInfo icon={ICONS.dataFields.user} text={mode === 'edit' ? 'Editing patient' : 'Creating patient'} />}
          />
        </div>
      </Modal>
    </FormErrorBoundary>
  );
};
