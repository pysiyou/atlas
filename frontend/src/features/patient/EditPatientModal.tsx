import React, { useMemo, useState } from 'react';
import type { Patient, Affiliation } from '@/types';
import { usePatients } from '@/hooks';
import { Button, Modal, TabbedSectionContainer } from '@/shared/ui';
import { useAuth } from '@/hooks';
import toast from 'react-hot-toast';
import { logger } from '@/utils/logger';
import {
  DemographicsSection,
  AddressSection,
  EmergencyContactSection,
  AffiliationSection,
  MedicalHistorySection,
} from './PatientForm';
import {
  usePatientForm,
  generateAssuranceNumber,
  calculateEndDate,
  isAffiliationActive,
} from './usePatientForm';
// ID generation removed - backend handles ID assignment
import { displayId } from '@/utils/id-display';
import { VitalsSection } from '@/features/patient/VitalsSection';

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
  const { currentUser } = useAuth();
  const { addPatient, updatePatient } = usePatients();
  const [isRenewing, setIsRenewing] = useState(false);

  const {
    formData,
    errors,
    isSubmitting,
    setIsSubmitting,
    updateField,
    validate,
    reset,
  } = usePatientForm(mode === 'edit' && patient ? patient : undefined);

  /**
   * Handles field updates in a type-safe way, delegating to the shared form hook.
   */
  const handleFieldChange = (field: string, value: string | boolean | number) => {
    updateField(field as keyof typeof formData, value as never);
  };

  /**
   * Handles the renewal button click - enables renewal mode
   */
  const handleRenew = () => {
    setIsRenewing(true);
    updateField('hasAffiliation', true);
  };

  /**
   * Creates affiliation data based on form state and existing patient data
   */
  const buildAffiliation = (existingAffiliation?: Affiliation): Affiliation | undefined => {
    // If user doesn't want affiliation, return undefined
    if (!formData.hasAffiliation && !existingAffiliation) {
      return undefined;
    }

    // If keeping existing affiliation without changes
    if (existingAffiliation && !isRenewing && !formData.hasAffiliation) {
      return existingAffiliation;
    }

    // If renewing or extending existing affiliation
    if (existingAffiliation && (isRenewing || formData.hasAffiliation)) {
      const isActive = isAffiliationActive(existingAffiliation);
      // If active, extend from current end date. If expired, extend from today.
      const startDate = isActive ? existingAffiliation.endDate : new Date().toISOString().slice(0, 10);
      const endDate = calculateEndDate(startDate, formData.affiliationDuration);

      return {
        assuranceNumber: existingAffiliation.assuranceNumber,
        startDate: existingAffiliation.startDate, // Keep original start date
        endDate,
        duration: formData.affiliationDuration,
      };
    }

    // Creating new affiliation
    if (formData.hasAffiliation) {
      const startDate = new Date().toISOString().slice(0, 10);
      const endDate = calculateEndDate(startDate, formData.affiliationDuration);

      return {
        assuranceNumber: generateAssuranceNumber(),
        startDate,
        endDate,
        duration: formData.affiliationDuration,
      };
    }

    return undefined;
  };

  /**
   * Maps the current form state into a `Partial<Patient>` suitable for update operations.
   */
  const buildUpdatedPatientPayload = (): Partial<Patient> => {
    /**
     * Build vitalSigns only if at least one field has a value.
     * Keeps payload clean and avoids sending an empty object.
     */
    const anyVitalProvided = Boolean(
      String(formData.temperature).trim() ||
        String(formData.heartRate).trim() ||
        String(formData.systolicBP).trim() ||
        String(formData.diastolicBP).trim() ||
        String(formData.respiratoryRate).trim() ||
        String(formData.oxygenSaturation).trim()
    );

    /**
     * NOTE:
     * Validation in `usePatientForm` enforces all-or-none vitals.
     * If any are provided, we can safely construct a complete object.
     * In edit mode, we also merge with existing values (defensive).
     */
    const vitalSigns = anyVitalProvided
      ? {
          temperature:
            formData.temperature.trim() !== ''
              ? parseFloat(formData.temperature)
              : patient?.vitalSigns?.temperature ?? 0,
          heartRate:
            formData.heartRate.trim() !== ''
              ? parseInt(formData.heartRate, 10)
              : patient?.vitalSigns?.heartRate ?? 0,
          systolicBP:
            formData.systolicBP.trim() !== ''
              ? parseInt(formData.systolicBP, 10)
              : patient?.vitalSigns?.systolicBP ?? 0,
          diastolicBP:
            formData.diastolicBP.trim() !== ''
              ? parseInt(formData.diastolicBP, 10)
              : patient?.vitalSigns?.diastolicBP ?? 0,
          respiratoryRate:
            formData.respiratoryRate.trim() !== ''
              ? parseInt(formData.respiratoryRate, 10)
              : patient?.vitalSigns?.respiratoryRate ?? 0,
          oxygenSaturation:
            formData.oxygenSaturation.trim() !== ''
              ? parseInt(formData.oxygenSaturation, 10)
              : patient?.vitalSigns?.oxygenSaturation ?? 0,
        }
      : undefined;

    return {
      fullName: formData.fullName.trim(),
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      phone: formData.phone.trim(),
      email: formData.email.trim() || undefined,
      height: formData.height ? parseFloat(formData.height) : undefined,
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
      address: {
        street: formData.street.trim(),
        city: formData.city.trim(),
        postalCode: formData.postalCode.trim(),
      },
      affiliation: buildAffiliation(patient?.affiliation),
      emergencyContact: {
        fullName: formData.emergencyContactFullName.trim(),
        relationship: formData.emergencyContactRelationship,
        phone: formData.emergencyContactPhone.trim(),
        email: formData.emergencyContactEmail.trim() || undefined,
      },
      medicalHistory: {
        chronicConditions: formData.chronicConditions
          .split(';')
          .map((c: string) => c.trim())
          .filter((c: string) => c.length > 0),
        currentMedications: formData.currentMedications
          .split(';')
          .map((m: string) => m.trim())
          .filter((m: string) => m.length > 0),
        allergies: formData.allergies
          .split(';')
          .map((a: string) => a.trim())
          .filter((a: string) => a.length > 0),
        previousSurgeries: formData.previousSurgeries
          .split(';')
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0),
        familyHistory: formData.familyHistory.trim(),
        lifestyle: {
          smoking: formData.smoking,
          alcohol: formData.alcohol,
        },
      },
      vitalSigns,
      updatedBy: typeof currentUser?.id === 'string' ? parseInt(currentUser.id, 10) : (currentUser?.id || 0),
    };
  };

  /**
   * Builds a complete `Patient` object from the current form state for create operations.
   */
  const buildNewPatient = (patientId: number): Patient => {
    const now = new Date().toISOString();
    const anyVitalProvided = Boolean(
      String(formData.temperature).trim() ||
        String(formData.heartRate).trim() ||
        String(formData.systolicBP).trim() ||
        String(formData.diastolicBP).trim() ||
        String(formData.respiratoryRate).trim() ||
        String(formData.oxygenSaturation).trim()
    );

    const vitalSigns = anyVitalProvided
      ? {
          temperature: parseFloat(formData.temperature),
          heartRate: parseInt(formData.heartRate, 10),
          systolicBP: parseInt(formData.systolicBP, 10),
          diastolicBP: parseInt(formData.diastolicBP, 10),
          respiratoryRate: parseInt(formData.respiratoryRate, 10),
          oxygenSaturation: parseInt(formData.oxygenSaturation, 10),
        }
      : undefined;

    return {
      id: patientId,
      fullName: formData.fullName.trim(),
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      phone: formData.phone.trim(),
      email: formData.email.trim() || undefined,
      height: formData.height ? parseFloat(formData.height) : undefined,
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
      address: {
        street: formData.street.trim(),
        city: formData.city.trim(),
        postalCode: formData.postalCode.trim(),
      },
      affiliation: buildAffiliation(),
      emergencyContact: {
        fullName: formData.emergencyContactFullName.trim(),
        relationship: formData.emergencyContactRelationship,
        phone: formData.emergencyContactPhone.trim(),
        email: formData.emergencyContactEmail.trim() || undefined,
      },
      medicalHistory: {
        chronicConditions: formData.chronicConditions
          .split(';')
          .map((c) => c.trim())
          .filter((c) => c.length > 0),
        currentMedications: formData.currentMedications
          .split(';')
          .map((m) => m.trim())
          .filter((m) => m.length > 0),
        allergies: formData.allergies
          .split(';')
          .map((a) => a.trim())
          .filter((a) => a.length > 0),
        previousSurgeries: formData.previousSurgeries
          .split(';')
          .map((s) => s.trim())
          .filter((s) => s.length > 0),
        familyHistory: formData.familyHistory.trim(),
        lifestyle: {
          smoking: formData.smoking,
          alcohol: formData.alcohol,
        },
      },
      vitalSigns,
      registrationDate: now,
      createdBy: typeof currentUser?.id === 'string' ? parseInt(currentUser.id, 10) : (currentUser?.id || 0),
      createdAt: now,
      updatedAt: now,
      updatedBy: typeof currentUser?.id === 'string' ? parseInt(currentUser.id, 10) : (currentUser?.id || 0),
    };
  };

  /**
   * Handles submit for both create and edit modes, with validation and error handling.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Synchronous validation first, with user feedback
    if (!validate()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    // In edit mode we must have an existing patient
    if (mode === 'edit' && !patient) {
      toast.error('Missing patient data for edit');
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'edit' && patient) {
        // Build and send partial update payload
        const updatedPatient = buildUpdatedPatientPayload();
        await updatePatient(patient.id, updatedPatient);

        if (isRenewing) {
          toast.success('Affiliation renewed successfully');
        } else {
          toast.success('Patient updated successfully');
        }
      } else {
        // Create new patient - backend will assign ID
        const newPatient = buildNewPatient(0); // Temporary ID, backend will assign real ID
        await addPatient(newPatient);
        toast.success(`Patient ${newPatient.fullName} registered successfully!`);
      }

      // Reset states
      setIsRenewing(false);
      reset();
      onClose();
    } catch (error) {
      logger.error('Error saving patient', error instanceof Error ? error : undefined);
      toast.error('Failed to save patient');
    } finally {
      setIsSubmitting(false);
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
      { id: 'affiliation', label: 'Affiliation & Emergency' },
    ],
    []
  );

  const [activeTab, setActiveTab] = useState<string>('general');

  /**
   * Render active tab content (kept as a function to mirror CargoPlan’s TabbedSectionContainer usage).
   */
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <div className="text-xs font-medium text-slate-500">General</div>
              <div className="text-sm font-semibold text-slate-900">Identity & contact</div>
            </div>
            <DemographicsSection formData={formData} errors={errors} onFieldChange={handleFieldChange} />
            <AddressSection formData={formData} errors={errors} onFieldChange={handleFieldChange} />
          </div>
        );
      case 'medical':
        return (
          <div className="space-y-4">
            <div>
              <div className="text-xs font-medium text-slate-500">Medical Background</div>
              <div className="text-sm font-semibold text-slate-900">History, conditions, lifestyle</div>
            </div>
            <MedicalHistorySection formData={formData} onFieldChange={handleFieldChange} />
          </div>
        );
      case 'vitals':
        return (
          <div className="space-y-4">
            <div>
              <div className="text-xs font-medium text-slate-500">Vitals</div>
              <div className="text-sm font-semibold text-slate-900">Measurements</div>
              <div className="text-xs text-slate-500 mt-1">
                Fill all vitals or leave all blank. Hints show typical ranges.
              </div>
            </div>
            <VitalsSection
              vitalSigns={{
                temperature: formData.temperature,
                heartRate: formData.heartRate,
                systolicBP: formData.systolicBP,
                diastolicBP: formData.diastolicBP,
                respiratoryRate: formData.respiratoryRate,
                oxygenSaturation: formData.oxygenSaturation,
              }}
              errors={errors}
              onFieldChange={handleFieldChange}
            />
          </div>
        );
      case 'affiliation':
        return (
          <div className="space-y-8">
            <div>
              <div className="text-xs font-medium text-slate-500">Affiliation</div>
              <div className="text-sm font-semibold text-slate-900">Auto-generated assurance</div>
              <div className="text-xs text-slate-500 mt-1">
                Assurance details are auto-generated for new affiliations.
              </div>
              <div className="mt-4">
                <AffiliationSection
                  formData={formData}
                  onFieldChange={handleFieldChange}
                  existingAffiliation={patient?.affiliation}
                  onRenew={handleRenew}
                />
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-slate-500">Emergency Contact</div>
              <div className="text-sm font-semibold text-slate-900">Primary contact</div>
              <div className="mt-4">
                <EmergencyContactSection
                  formData={formData}
                  errors={errors}
                  onFieldChange={handleFieldChange}
                />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      maxWidth="max-w-4xl"
    >
      <div className="h-full flex flex-col bg-slate-50">
        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <form id="patient-upsert-form" onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <TabbedSectionContainer
              title={mode === 'edit' && patient ? displayId.patient(patient.id) : 'New Patient'}
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              className="rounded-xl! shadow-none"
              contentClassName="!p-6"
              headerClassName="!px-6 !py-4"
            >
              {renderActiveTab()}
            </TabbedSectionContainer>
          </form>
        </div>

        {/* Fixed footer actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-white shrink-0">
          <Button type="button" variant="cancel" showIcon={false} onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="save" form="patient-upsert-form" isLoading={isSubmitting} disabled={isSubmitting}>
            {submitLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
