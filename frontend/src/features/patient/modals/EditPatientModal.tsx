/**
 * EditPatientModal - Reusable patient creation and editing modal
 *
 * Refactored for better maintainability:
 * - Extracted payload building logic to utils/patientPayloadBuilder.ts
 * - Extracted form progress calculation to utils/formProgressCalculator.ts
 * - Extracted tab rendering to components/PatientFormTabs.tsx
 * - Extracted mutation logic to hooks/usePatientMutation.ts
 */

import React, { useMemo, useState } from 'react';
import type { Patient } from '@/types';
import { Button, Modal, CircularProgress, FooterInfo } from '@/shared/ui';
import { ICONS } from '@/utils/icon-mappings';
import toast from 'react-hot-toast';
import { usePatientForm } from '../hooks/usePatientForm';
import { displayId } from '@/utils/id-display';
import { PatientFormTabs } from '../components/forms/PatientFormTabs';
import { calculateFormProgress } from '../utils/patientUtils';
import { usePatientMutation } from '../hooks/usePatientMutation';
import { FormErrorBoundary } from '@/shared/components';

/**
 * Props for EditPatientModal component.
 * This modal now supports both creating a new patient and editing an existing one.
 */
interface EditPatientModalProps {
  /** Controls whether the modal is visible */
  isOpen: boolean;
  /** Callback fired when the modal should be closed */
  onClose: () => void;
  /** Existing patient data when editing (required for edit mode) */
  patient?: Patient;
  /** Determines whether the modal is used for creating or editing a patient */
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

/**
 * EditPatientModal
 *
 * Reusable patient upsert modal that can:
 * - Create a new patient when `mode === 'create'`
 * - Edit an existing patient when `mode === 'edit'` and `patient` is provided
 */
export const EditPatientModal: React.FC<EditPatientModalProps> = ({
  isOpen,
  onClose,
  patient,
  mode,
}) => {
  const [isRenewing, setIsRenewing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('general');

  const { formData, errors, updateField, validate, reset } = usePatientForm(
    mode === 'edit' && patient ? patient : undefined
  );

  const { isSubmitting, handleCreatePatient, handleUpdatePatient } = usePatientMutation({
    existingPatient: patient,
    onSuccess: () => {
      setIsRenewing(false);
      reset();
      onClose();
    },
  });

  /**
   * Handles field updates in a type-safe way
   */
  const handleFieldChange = <K extends keyof typeof formData>(
    field: K,
    value: (typeof formData)[K]
  ) => {
    updateField(field, value);
  };

  /**
   * Handles the renewal button click - enables renewal mode
   */
  const handleRenew = () => {
    setIsRenewing(true);
    updateField('hasAffiliation', true);
  };

  /**
   * Handles submit for both create and edit modes
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    if (mode === 'edit' && !patient) {
      toast.error('Missing patient data for edit');
      return;
    }

    try {
      if (mode === 'edit') {
        await handleUpdatePatient(formData, isRenewing);
      } else {
        await handleCreatePatient(formData);
      }
    } catch {
      // Error already handled in mutation hook
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

  const formProgress = useMemo(() => calculateFormProgress(formData), [formData]);

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
          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <form id="patient-upsert-form" onSubmit={handleSubmit} className="max-w-full">
              <TabNavigation
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                formProgress={formProgress}
              />

              {/* Form content */}
              <div className="rounded-lg border border-border bg-surface p-6">
                <PatientFormTabs
                  activeTab={activeTab}
                  formData={formData}
                  errors={errors}
                  onFieldChange={
                    handleFieldChange as (
                      field: string,
                      value: string | number | boolean | undefined
                    ) => void
                  }
                  existingAffiliation={patient?.affiliation}
                  onRenew={handleRenew}
                />
              </div>
            </form>
          </div>

          <ModalFooter
            onClose={onClose}
            submitLabel={submitLabel}
            isSubmitting={isSubmitting}
            formId="patient-upsert-form"
            footerInfo={<FooterInfo icon={ICONS.dataFields.user} text={mode === 'edit' ? 'Editing patient' : 'Creating patient'} />}
          />
        </div>
      </Modal>
    </FormErrorBoundary>
  );
};
