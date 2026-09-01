/**
 * EditPatientModal - Create/edit patient with tabs and progress.
 * Form logic in useEditPatientForm.
 */

import React from 'react';
import type { Patient } from '@/types';
import { Button, Modal, CircularProgress, FooterInfo } from '@/components';
import { MODULE_ICONS } from '@/config/icons';
import { ErrorBoundary } from '@/components';
import { useEditPatientForm } from '../hooks/useEditPatientForm';
import { PatientFormTabs } from './PatientFormTabs';

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
            className={
              isActive
                ? 'relative flex items-center gap-2 px-3 py-1.5 rounded text-xs font-normal cursor-pointer bg-surface text-brand shadow-sm ring-1 ring-black/5'
                : 'relative flex items-center gap-2 px-3 py-1.5 rounded text-xs font-normal cursor-pointer text-text-tertiary hover:text-text-primary hover:bg-neutral-200/50'
            }
          >
            {tab.label}
          </button>
        );
      })}
    </div>
    <CircularProgress
      size={18}
      percentage={formProgress.percentage}
      trackColorClass="stroke-border-default"
      progressColorClass={formProgress.percentage === 100 ? 'stroke-success' : 'stroke-brand'}
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
  <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border-default bg-surface shrink-0 shadow-[var(--shadow-footer)]">
    {footerInfo}
    <div className="flex items-center gap-3">
      <Button type="button" variant="cancel" showIcon onClick={onClose} disabled={isSubmitting}>
        Cancel
      </Button>
      <Button type="submit" variant="save" form={formId} isLoading={isSubmitting} disabled={isSubmitting}>
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
  const {
    register,
    handleSubmit,
    control,
    errors,
    isSubmitting,
    activeTab,
    setActiveTab,
    formProgress,
    tabs,
    modalTitle,
    submitLabel,
    watch,
    setValue,
  } = useEditPatientForm({ patient, mode, onClose });

  return (
    <ErrorBoundary>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={modalTitle}
        maxWidth="max-w-3xl"
        disableClose={isSubmitting}
      >
        <div className="flex flex-col h-full bg-surface-page">
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <form id="patient-form" onSubmit={handleSubmit} className="max-w-full">
              <TabNavigation
                tabs={[...tabs]}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                formProgress={formProgress}
              />
              <div className="rounded-lg border border-border-default bg-surface p-6">
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
            isSubmitting={isSubmitting}
            formId="patient-form"
            footerInfo={<FooterInfo icon={MODULE_ICONS.patients} label="Patients" size="md" />}
          />
        </div>
      </Modal>
    </ErrorBoundary>
  );
};
