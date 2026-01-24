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
import { Button, Modal, TabbedSectionContainer, CircularProgress } from '@/shared/ui';
import toast from 'react-hot-toast';
import { usePatientForm } from '../hooks/usePatientForm';
import { displayId } from '@/utils/id-display';
import { PatientFormTabs } from '../components/forms/PatientFormTabs';
import { calculateFormProgress } from '../utils/formProgressCalculator';
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
        subtitle={mode === 'edit' && patient ? displayId.patient(patient.id) : undefined}
        maxWidth="max-w-3xl"
      >
        <div className="h-full flex flex-col bg-slate-50">
          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
            <form id="patient-upsert-form" onSubmit={handleSubmit} className="max-w-4xl mx-auto">
              <TabbedSectionContainer
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                headerRight={
                  <CircularProgress
                    size={18}
                    percentage={formProgress.percentage}
                    trackColorClass="stroke-gray-200"
                    progressColorClass={
                      formProgress.percentage === 100 ? 'stroke-emerald-500' : 'stroke-sky-500'
                    }
                    label={`${formProgress.filled}/${formProgress.total}`}
                    className="h-7"
                  />
                }
                className="rounded-xl! shadow-none"
                contentClassName="!p-6"
                headerClassName="!px-6 !py-4"
              >
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
              </TabbedSectionContainer>
            </form>
          </div>

          {/* Fixed footer actions */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-white shrink-0">
            <Button type="button" variant="cancel" showIcon={true} onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="save"
              form="patient-upsert-form"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              {submitLabel}
            </Button>
          </div>
        </div>
      </Modal>
    </FormErrorBoundary>
  );
};
