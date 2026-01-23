import React, { useState } from 'react';
import type { Patient, Affiliation } from '@/types';
import { usePatients } from '@/hooks';
import { Button, Modal, SectionContainer } from '@/shared/ui';
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
import { Icon } from '@/shared/ui';

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
 * Section Icon Badge Component
 */
interface SectionIconProps {
  icon: React.ReactNode;
  color: 'sky' | 'emerald' | 'violet' | 'amber' | 'rose';
}

const SectionIcon: React.FC<SectionIconProps> = ({ icon, color }) => {
  const colorClasses = {
    sky: 'bg-sky-100 text-sky-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    violet: 'bg-violet-100 text-violet-600',
    amber: 'bg-amber-100 text-amber-600',
    rose: 'bg-rose-100 text-rose-600',
  };

  return (
    <div className={`w-7 h-7 rounded ${colorClasses[color]} flex items-center justify-center shrink-0`}>
      {icon}
    </div>
  );
};

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
      updatedBy: typeof currentUser?.id === 'string' ? parseInt(currentUser.id, 10) : (currentUser?.id || 0),
    };
  };

  /**
   * Builds a complete `Patient` object from the current form state for create operations.
   */
  const buildNewPatient = (patientId: number): Patient => {
    const now = new Date().toISOString();

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      maxWidth="max-w-4xl"
    >
      <div className="h-full flex flex-col bg-gray-50">
        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin space-y-4">
          <form
            id="patient-upsert-form"
            onSubmit={handleSubmit}
            className="space-y-4 max-w-4xl mx-auto"
          >
            {/* Personal Information Section */}
            <SectionContainer
              title="Personal Information"
              headerLeft={<SectionIcon icon={<Icon name="user" className="w-4 h-4" />} color="sky" />}
            >
              <div className="pl-4 space-y-6">
                <DemographicsSection
                  formData={formData}
                  errors={errors}
                  onFieldChange={handleFieldChange}
                />
                <AddressSection
                  formData={formData}
                  errors={errors}
                  onFieldChange={handleFieldChange}
                />
                <EmergencyContactSection
                  formData={formData}
                  errors={errors}
                  onFieldChange={handleFieldChange}
                />
              </div>
            </SectionContainer>

            {/* Lab Affiliation Section */}
            <SectionContainer
              title="Lab Affiliation"
              headerLeft={<SectionIcon icon={<Icon name="shield" className="w-4 h-4" />} color="emerald" />}
            >
              <div className="pl-4">
                <AffiliationSection
                  formData={formData}
                  onFieldChange={handleFieldChange}
                  existingAffiliation={patient?.affiliation}
                  onRenew={handleRenew}
                />
              </div>
            </SectionContainer>

            {/* Medical History Section */}
            <SectionContainer
              title="Medical History"
              headerLeft={<SectionIcon icon={<Icon name="stethoscope" className="w-4 h-4" />} color="rose" />}
            >
              <div className="pl-4">
                <MedicalHistorySection
                  formData={formData}
                  onFieldChange={handleFieldChange}
                />
              </div>
            </SectionContainer>
          </form>
        </div>

        {/* Fixed footer actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-white shrink-0">
          <Button type="button" variant="cancel" showIcon={false} onClick={onClose}>
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
  );
};
