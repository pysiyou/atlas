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

  // Guard: duration required when hasAffiliation (validation should catch before submit)
  if (formData.hasAffiliation && formData.affiliationDuration == null) {
    return undefined;
  }

  // If keeping existing affiliation without changes
  if (existingAffiliation && !isRenewing && !formData.hasAffiliation) {
    return existingAffiliation;
  }

  // If renewing or extending existing affiliation
  if (existingAffiliation && (isRenewing || formData.hasAffiliation)) {
    const duration = formData.affiliationDuration!;
    const isActive = isAffiliationActive(existingAffiliation);
    // If active, extend from current end date. If expired, extend from today.
    const startDate = isActive
      ? existingAffiliation.endDate
      : new Date().toISOString().slice(0, 10);
    const endDate = calculateEndDate(startDate, duration);

    return {
      assuranceNumber: existingAffiliation.assuranceNumber,
      startDate: existingAffiliation.startDate, // Keep original start date
      endDate,
      duration,
    };
  }

  // Creating new affiliation
  if (formData.hasAffiliation) {
    const duration = formData.affiliationDuration!;
    const startDate = new Date().toISOString().slice(0, 10);
    const endDate = calculateEndDate(startDate, duration);

    return {
      assuranceNumber: generateAssuranceNumber(),
      startDate,
      endDate,
      duration,
    };
  }

  return undefined;
};

/**
 * Builds vital signs object from form data.
 * Only returns vitals when ALL six fields are provided; otherwise undefined.
 * Backend VitalSigns schema requires all fields with strict ranges (no 0 fallbacks).
 */
export const buildVitalSigns = (formData: PatientFormData) => {
  const t = String(formData.temperature ?? '').trim();
  const hr = String(formData.heartRate ?? '').trim();
  const sbp = String(formData.systolicBP ?? '').trim();
  const dbp = String(formData.diastolicBP ?? '').trim();
  const rr = String(formData.respiratoryRate ?? '').trim();
  const spo2 = String(formData.oxygenSaturation ?? '').trim();

  const allProvided = Boolean(t && hr && sbp && dbp && rr && spo2);
  if (!allProvided) {
    return undefined;
  }

  return {
    temperature: parseFloat(t),
    heartRate: parseInt(hr, 10),
    systolicBP: parseInt(sbp, 10),
    diastolicBP: parseInt(dbp, 10),
    respiratoryRate: parseInt(rr, 10),
    oxygenSaturation: parseInt(spo2, 10),
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
 * Ensures a value is a string before calling .trim().
 * Handles null, undefined, arrays (joined with '; '), and other types.
 * Used for fields like familyHistory that may come from API as array or non-string.
 */
const ensureString = (value: unknown): string => {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(String).filter(Boolean).join('; ');
  return String(value);
};

/**
 * Maps the current form state into a payload for PUT /patients/:id.
 * Includes all editable patient data; backend sets updatedBy from current user.
 */
export const buildUpdatedPatientPayload = (
  formData: PatientFormData,
  existingPatient: Patient,
  _currentUserId: number,
  isRenewing: boolean
): Partial<Patient> => {
  const payload: Partial<Patient> = {
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
    emergencyContact: {
      fullName: formData.emergencyContactFullName.trim(),
      relationship: formData.emergencyContactRelationship!,
      phone: formData.emergencyContactPhone.trim(),
      email: formData.emergencyContactEmail.trim() || undefined,
    },
    medicalHistory: {
      chronicConditions: parseDelimitedString(ensureString(formData.chronicConditions)),
      currentMedications: parseDelimitedString(ensureString(formData.currentMedications)),
      allergies: parseDelimitedString(ensureString(formData.allergies)),
      previousSurgeries: parseDelimitedString(ensureString(formData.previousSurgeries)),
      familyHistory: parseDelimitedString(ensureString(formData.familyHistory)),
      lifestyle: {
        smoking: formData.smoking,
        alcohol: formData.alcohol,
      },
    },
    affiliation: buildAffiliation(formData, existingPatient.affiliation, isRenewing),
  };

  const vitalSigns = buildVitalSigns(formData);
  if (vitalSigns) payload.vitalSigns = vitalSigns;

  return payload;
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
      relationship: formData.emergencyContactRelationship!,
      phone: formData.emergencyContactPhone.trim(),
      email: formData.emergencyContactEmail.trim() || undefined,
    },
    medicalHistory: {
      chronicConditions: parseDelimitedString(ensureString(formData.chronicConditions)),
      currentMedications: parseDelimitedString(ensureString(formData.currentMedications)),
      allergies: parseDelimitedString(ensureString(formData.allergies)),
      previousSurgeries: parseDelimitedString(ensureString(formData.previousSurgeries)),
      /** Backend expects list[str]; form stores semicolon-delimited, send as array */
      familyHistory: parseDelimitedString(ensureString(formData.familyHistory)),
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
