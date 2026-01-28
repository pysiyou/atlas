/**
 * Patient Helper Functions
 * Pure utility functions for patient data (no business logic)
 */

// PatientFormData type - temporary during migration
type PatientFormData = {
  fullName: string;
  dateOfBirth: string;
  gender?: 'male' | 'female';
  phone: string;
  email: string;
  height: string;
  weight: string;
  street: string;
  city: string;
  postalCode: string;
  emergencyContactFullName: string;
  emergencyContactRelationship?: 'spouse' | 'parent' | 'sibling' | 'child' | 'friend' | 'other';
  emergencyContactPhone: string;
  emergencyContactEmail: string;
  chronicConditions: string;
  currentMedications: string;
  allergies: string;
  previousSurgeries: string;
  familyHistory: string;
  temperature: string;
  heartRate: string;
  systolicBP: string;
  diastolicBP: string;
  respiratoryRate: string;
  oxygenSaturation: string;
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
 * Calculate form completion progress based on filled parameters (legacy)
 * @deprecated Use calculateFormProgressV2 for new code
 */
export const calculateFormProgress = (formData: PatientFormData): FormProgress => {
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

  const filled = parameters.filter(param => {
    if (typeof param === 'boolean') return param === true;
    if (typeof param === 'string') return param.trim() !== '';
    return param !== undefined && param !== null;
  }).length;

  const total = parameters.length;
  const percentage = total > 0 ? Math.round((filled / total) * 100) : 0;

  return { filled, total, percentage };
};

/**
 * Calculate form progress for PatientFormInput (schema-based)
 */
export const calculateFormProgressV2 = (formData: Partial<import('../schemas/patient.schema').PatientFormInput>): FormProgress => {
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
