/**
 * Patient Payload Builder Utilities
 * Handles construction of patient payloads for API operations
 */

import type { Patient, Affiliation } from '@/types';
import type { PatientFormData } from '../usePatientForm';
import { generateAssuranceNumber, calculateEndDate, isAffiliationActive } from './affiliationUtils';

/**
 * Creates affiliation data based on form state and existing patient data
 */
export const buildAffiliation = (
  formData: PatientFormData,
  existingAffiliation?: Affiliation,
  isRenewing?: boolean
): Affiliation | undefined => {
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
    const startDate = isActive
      ? existingAffiliation.endDate
      : new Date().toISOString().slice(0, 10);
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
 * Builds vital signs object from form data, only if any vital is provided
 */
export const buildVitalSigns = (
  formData: PatientFormData,
  existingVitals?: Patient['vitalSigns']
) => {
  const anyVitalProvided = Boolean(
    String(formData.temperature).trim() ||
    String(formData.heartRate).trim() ||
    String(formData.systolicBP).trim() ||
    String(formData.diastolicBP).trim() ||
    String(formData.respiratoryRate).trim() ||
    String(formData.oxygenSaturation).trim()
  );

  if (!anyVitalProvided) {
    return undefined;
  }

  return {
    temperature:
      formData.temperature.trim() !== ''
        ? parseFloat(formData.temperature)
        : (existingVitals?.temperature ?? 0),
    heartRate:
      formData.heartRate.trim() !== ''
        ? parseInt(formData.heartRate, 10)
        : (existingVitals?.heartRate ?? 0),
    systolicBP:
      formData.systolicBP.trim() !== ''
        ? parseInt(formData.systolicBP, 10)
        : (existingVitals?.systolicBP ?? 0),
    diastolicBP:
      formData.diastolicBP.trim() !== ''
        ? parseInt(formData.diastolicBP, 10)
        : (existingVitals?.diastolicBP ?? 0),
    respiratoryRate:
      formData.respiratoryRate.trim() !== ''
        ? parseInt(formData.respiratoryRate, 10)
        : (existingVitals?.respiratoryRate ?? 0),
    oxygenSaturation:
      formData.oxygenSaturation.trim() !== ''
        ? parseInt(formData.oxygenSaturation, 10)
        : (existingVitals?.oxygenSaturation ?? 0),
  };
};

/**
 * Parses semicolon-delimited string into array of trimmed, non-empty values
 */
const parseDelimitedString = (value: string): string[] =>
  value
    .split(';')
    .map(item => item.trim())
    .filter(item => item.length > 0);

/**
 * Maps the current form state into a Partial<Patient> suitable for update operations
 */
export const buildUpdatedPatientPayload = (
  formData: PatientFormData,
  existingPatient: Patient,
  currentUserId: number,
  isRenewing: boolean
): Partial<Patient> => {
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
    affiliation: buildAffiliation(formData, existingPatient.affiliation, isRenewing),
    emergencyContact: {
      fullName: formData.emergencyContactFullName.trim(),
      relationship: formData.emergencyContactRelationship,
      phone: formData.emergencyContactPhone.trim(),
      email: formData.emergencyContactEmail.trim() || undefined,
    },
    medicalHistory: {
      chronicConditions: parseDelimitedString(formData.chronicConditions),
      currentMedications: parseDelimitedString(formData.currentMedications),
      allergies: parseDelimitedString(formData.allergies),
      previousSurgeries: parseDelimitedString(formData.previousSurgeries),
      familyHistory: formData.familyHistory.trim(),
      lifestyle: {
        smoking: formData.smoking,
        alcohol: formData.alcohol,
      },
    },
    vitalSigns: buildVitalSigns(formData, existingPatient.vitalSigns),
    updatedBy: currentUserId,
  };
};

/**
 * Builds a complete Patient object from the current form state for create operations
 */
export const buildNewPatientPayload = (
  formData: PatientFormData,
  patientId: number,
  currentUserId: number
): Patient => {
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
    affiliation: buildAffiliation(formData),
    emergencyContact: {
      fullName: formData.emergencyContactFullName.trim(),
      relationship: formData.emergencyContactRelationship,
      phone: formData.emergencyContactPhone.trim(),
      email: formData.emergencyContactEmail.trim() || undefined,
    },
    medicalHistory: {
      chronicConditions: parseDelimitedString(formData.chronicConditions),
      currentMedications: parseDelimitedString(formData.currentMedications),
      allergies: parseDelimitedString(formData.allergies),
      previousSurgeries: parseDelimitedString(formData.previousSurgeries),
      familyHistory: formData.familyHistory.trim(),
      lifestyle: {
        smoking: formData.smoking,
        alcohol: formData.alcohol,
      },
    },
    vitalSigns: buildVitalSigns(formData),
    registrationDate: now,
    createdBy: currentUserId,
    createdAt: now,
    updatedAt: now,
    updatedBy: currentUserId,
  };
};
