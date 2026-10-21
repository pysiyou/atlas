/**
 * EditPatientModal - Create/edit patient with tabs.
 * Form logic in useEditPatientForm.
 */

import React from 'react';
import { FormProvider } from 'react-hook-form';
import type { Patient } from '@/types';
import { FormDialogFooter, Modal, ModalPageShell } from '@/components/overlays';
import { FooterInfo } from '@/components/display';
import { SegmentedControl } from '@/components/inputs/SegmentedControl';
import { ErrorBoundary } from '@/components/feedback';
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
    <SegmentedControl
      options={tabs.map(tab => ({ id: tab.id, label: tab.label }))}
      activeId={activeTab}
      onActiveIdChange={onTabChange}
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
    form,
    handleSubmit,
    isSubmitting,
    activeTab,
    setActiveTab,
    tabs,
    modalTitle,
    subtitle,
    submitLabel,
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
        <ModalPageShell
          footer={
            <FormDialogFooter
              submitLabel={submitLabel}
              isSubmitting={isSubmitting}
              formId="patient-form"
              footerInfo={<FooterInfo icon={MODULE_ICONS.patients} label="Patients" size="md" />}
            />
          }
        >
          <FormProvider {...form}>
            <form id="patient-form" onSubmit={handleSubmit} className="max-w-full space-y-space-6">
              <TabNavigation tabs={[...tabs]} activeTab={activeTab} onTabChange={setActiveTab} />
              <PatientFormTabs
                activeTab={activeTab}
                existingAffiliation={patient?.affiliation}
              />
            </form>
          </FormProvider>
        </ModalPageShell>
      </Modal>
    </ErrorBoundary>
  );
};
