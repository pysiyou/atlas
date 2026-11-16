/**
 * EditPatientModal - Create/edit patient with tabs.
 * Form logic in useEditPatientForm.
 */

import { FormProvider } from 'react-hook-form';
import type { Patient } from '@/types';
import { FormDialogFooter, Modal, ModalPageShell } from '@/components/overlays';
import { FooterInfo } from '@/components/display';

import { SegmentedControl } from '@/components/inputs/SegmentedControl';
import { ErrorBoundary } from '@/feedback';
import { IconKeys } from '@/icons';
import { useEditPatientForm } from '../hooks/useEditPatientForm';
import { PatientFormTabs } from './PatientFormTabs';

interface EditPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: Patient;
  mode: 'create' | 'edit';
  onCreated?: (patient: Patient) => void;
}

interface TabNavigationProps {
  tabs: Array<{ id: string; label: string }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

function TabNavigation({ tabs, activeTab, onTabChange }: TabNavigationProps) { return (
  <div className="flex items-center justify-start mb-space-6">
    <SegmentedControl
      options={tabs.map(tab => ({ id: tab.id, label: tab.label }))}
      activeId={activeTab}
      onActiveIdChange={onTabChange}
    />
  </div>
); }

export function EditPatientModal({
  isOpen,
  onClose,
  patient,
  mode,
  onCreated,
}: EditPatientModalProps) {
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
    duplicateMatches,
    onSelectExisting,
    onForceCreate,
    onDismissDuplicates,
  } = useEditPatientForm({ patient, mode, onClose, onCreated });

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
              footerInfo={<FooterInfo icon={IconKeys.modules.patients} label="Patients" size="md" />}
            />
          }
        >
          <FormProvider {...form}>
            <form id="patient-form" onSubmit={handleSubmit} className="max-w-full space-y-space-6">
              <TabNavigation tabs={[...tabs]} activeTab={activeTab} onTabChange={setActiveTab} />
              {duplicateMatches.length > 0 ? (
                <div className="rounded-md border border-border-default p-space-4 space-y-space-3">
                  <p className="text-sm">Possible existing patients match this identity.</p>
                  <ul className="space-y-space-2">
                    {duplicateMatches.map(match => (
                      <li key={match.id}>
                        <button
                          type="button"
                          className="w-full text-left px-space-3 py-space-2 hover:bg-surface-page rounded-md"
                          onClick={() => onSelectExisting(match as Patient)}
                        >
                          <span className="font-medium">{match.fullName}</span>
                          <span className="ml-space-2 text-sm opacity-70">
                            {match.mrn} · {match.phone}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-space-2">
                    <button type="button" className="text-sm underline" onClick={onDismissDuplicates}>
                      Edit details
                    </button>
                    <button type="button" className="text-sm underline" onClick={onForceCreate}>
                      Create anyway
                    </button>
                  </div>
                </div>
              ) : null}
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
}
