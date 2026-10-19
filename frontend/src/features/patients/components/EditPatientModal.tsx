/**
 * EditPatientModal - Create/edit patient with tabs.
 * Form logic in useEditPatientForm.
 */

import React from 'react';
import type { Patient } from '@/types';
import { Modal, FormDialogFooter } from '@/components/overlays';
import { FooterInfo } from '@/components/display';
import { PanelHeaderSegmentTabs } from '@/components/display/PanelHeaderSegmentTabs';
import { ErrorBoundary } from '@/components/loaders';
import { MODULE_ICONS } from '@/config/icons';
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
}

const TabNavigation: React.FC<TabNavigationProps> = ({ tabs, activeTab, onTabChange }) => (
  <div className="flex items-center justify-start mb-space-6">
    <PanelHeaderSegmentTabs
      tabs={tabs.map(tab => ({ id: tab.id, label: tab.label }))}
      activeId={activeTab}
      onTabChange={onTabChange}
    />
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
    tabs,
    modalTitle,
    subtitle,
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
        subtitle={subtitle}
        size="3xl"
        disableClose={isSubmitting}
      >
        <div className="flex flex-col h-full bg-surface-page">
          <div className="flex-1 overflow-y-auto p-space-6">
            <form id="patient-form" onSubmit={handleSubmit} className="max-w-full space-y-space-6">
              <TabNavigation
                tabs={[...tabs]}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
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
            </form>
          </div>
          <FormDialogFooter
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
