/**
 * Form Progress Calculator Utility
 * Calculates completion percentage for patient forms
 */

import type { PatientFormData } from '../hooks/usePatientForm';

export interface FormProgress {
  filled: number;
  total: number;
  percentage: number;
}

/**
 * Calculate form completion progress based on filled parameters
 */
export const calculateFormProgress = (formData: PatientFormData): FormProgress => {
  // Define all form parameters to track
  const parameters = [
    formData.fullName,
    formData.dateOfBirth,
    formData.gender,
    formData.phone,
    formData.email,
    formData.height,
    formData.weight,
    formData.street,
    formData.city,
    formData.postalCode,
    formData.emergencyContactFullName,
    formData.emergencyContactRelationship,
    formData.emergencyContactPhone,
    formData.emergencyContactEmail,
    formData.chronicConditions,
    formData.currentMedications,
    formData.allergies,
    formData.previousSurgeries,
    formData.familyHistory,
    // Vitals - count as one parameter if any are filled, or all are empty
    formData.temperature ||
      formData.heartRate ||
      formData.systolicBP ||
      formData.diastolicBP ||
      formData.respiratoryRate ||
      formData.oxygenSaturation,
  ];

  // Count filled parameters (non-empty strings, non-false booleans)
  const filled = parameters.filter(param => {
    if (typeof param === 'boolean') return param === true;
    if (typeof param === 'string') return param.trim() !== '';
    return param !== undefined && param !== null;
  }).length;

  const total = parameters.length;
  const percentage = total > 0 ? Math.round((filled / total) * 100) : 0;

  return { filled, total, percentage };
};
