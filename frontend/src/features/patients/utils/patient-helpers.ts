/**
 * Patient Helper Functions
 * Pure utility functions for patient data (no business logic)
 */

import type { Affiliation } from '@/types';

// ============================================================================
// AFFILIATION UTILITIES
// ============================================================================

/** Check if an affiliation is still active (end date >= today). */
export const isAffiliationActive = (affiliation?: Affiliation | null): boolean => {
  if (!affiliation) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(affiliation.endDate);
  endDate.setHours(0, 0, 0, 0);
  return endDate >= today;
};

// ============================================================================
// FORM PROGRESS UTILITIES
// ============================================================================

export interface FormProgress {
  filled: number;
  total: number;
  percentage: number;
}

/**
 * Calculate form progress for PatientFormInput (schema-based)
 */
export const calculateFormProgressV2 = (
  formData: Partial<import('../schemas/patient.schema').PatientFormInput>
): FormProgress => {
  const parameters = [
    formData.fullName,
    formData.dateOfBirth,
    formData.gender,
    formData.phone,
    formData.email,
    formData.height,
    formData.weight,
    formData.address?.street,
    formData.address?.city,
    formData.address?.postalCode,
    formData.emergencyContact?.fullName,
    formData.emergencyContact?.relationship,
    formData.emergencyContact?.phone,
    formData.emergencyContact?.email,
    formData.medicalHistory?.chronicConditions?.join(' '),
    formData.medicalHistory?.currentMedications?.join(' '),
    formData.medicalHistory?.allergies?.join(' '),
    formData.medicalHistory?.previousSurgeries?.join(' '),
    Array.isArray(formData.medicalHistory?.familyHistory)
      ? formData.medicalHistory.familyHistory.join(' ')
      : formData.medicalHistory?.familyHistory,
    // Vitals - count as one parameter
    formData.vitalSigns?.temperature ||
      formData.vitalSigns?.heartRate ||
      formData.vitalSigns?.systolicBP ||
      formData.vitalSigns?.diastolicBP ||
      formData.vitalSigns?.respiratoryRate ||
      formData.vitalSigns?.oxygenSaturation,
  ];

  const filled = parameters.filter(param => {
    if (typeof param === 'boolean') return param === true;
    if (typeof param === 'string') return param.trim() !== '';
    if (typeof param === 'number') return param !== 0;
    return param !== undefined && param !== null;
  }).length;

  const total = parameters.length;
  const percentage = total > 0 ? Math.round((filled / total) * 100) : 0;

  return { filled, total, percentage };
};
