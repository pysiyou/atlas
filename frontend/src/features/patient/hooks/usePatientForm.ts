import { useState } from 'react';
import type { Gender, AffiliationDuration, Patient, Relationship } from '@/types';
import { validatePatientForm } from '../utils/patientValidation';

// Re-export affiliation utilities for backward compatibility
export {
  generateAssuranceNumber,
  calculateEndDate,
  isAffiliationActive,
  getAffiliationStatus,
} from '../utils/affiliationUtils';

export interface PatientFormData {
  fullName: string;
  dateOfBirth: string;
  gender: Gender;
  phone: string;
  email: string;
  height: string;
  weight: string;
  street: string;
  city: string;
  postalCode: string;
  hasAffiliation: boolean;
  /** Optional when cleared via MultiSelectFilter; required when hasAffiliation is true */
  affiliationDuration?: AffiliationDuration;
  emergencyContactFullName: string;
  /** Optional when cleared via MultiSelectFilter; required for submit */
  emergencyContactRelationship?: Relationship;
  emergencyContactPhone: string;
  emergencyContactEmail: string;
  chronicConditions: string;
  currentMedications: string;
  allergies: string;
  previousSurgeries: string;
  familyHistory: string;
  smoking: boolean;
  alcohol: boolean;
  temperature: string;
  heartRate: string;
  systolicBP: string;
  diastolicBP: string;
  respiratoryRate: string;
  oxygenSaturation: string;
}

/**
 * Ensures familyHistory is always a string when hydrating from API.
 * Handles null/undefined, arrays (e.g. API returns string[]), and other types.
 */
const normalizeFamilyHistory = (value: unknown): string => {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(String).filter(Boolean).join('; ');
  return String(value);
};

// High complexity is necessary to map all patient fields from API to form data
// eslint-disable-next-line complexity
const createInitialFormData = (initialData?: Partial<Patient>): PatientFormData => {
  if (initialData) {
    return {
      fullName: initialData.fullName || '',
      dateOfBirth: initialData.dateOfBirth || '',
      gender: initialData.gender || 'male',
      phone: initialData.phone || '',
      email: initialData.email || '',
      height: initialData.height !== undefined ? String(initialData.height) : '',
      weight: initialData.weight !== undefined ? String(initialData.weight) : '',
      street: initialData.address?.street || '',
      city: initialData.address?.city || '',
      postalCode: initialData.address?.postalCode || '',
      hasAffiliation: !!initialData.affiliation,
      affiliationDuration: initialData.affiliation?.duration || 6,
      emergencyContactFullName: initialData.emergencyContact?.fullName || '',
      emergencyContactRelationship: initialData.emergencyContact?.relationship || 'spouse',
      emergencyContactPhone: initialData.emergencyContact?.phone || '',
      emergencyContactEmail: initialData.emergencyContact?.email || '',
      chronicConditions: initialData.medicalHistory?.chronicConditions?.join('; ') || '',
      currentMedications: initialData.medicalHistory?.currentMedications?.join('; ') || '',
      allergies: initialData.medicalHistory?.allergies?.join('; ') || '',
      previousSurgeries: initialData.medicalHistory?.previousSurgeries?.join('; ') || '',
      familyHistory: normalizeFamilyHistory(initialData.medicalHistory?.familyHistory),
      smoking: initialData.medicalHistory?.lifestyle?.smoking || false,
      alcohol: initialData.medicalHistory?.lifestyle?.alcohol || false,
      temperature:
        initialData.vitalSigns?.temperature !== undefined
          ? String(initialData.vitalSigns.temperature)
          : '',
      heartRate:
        initialData.vitalSigns?.heartRate !== undefined
          ? String(initialData.vitalSigns.heartRate)
          : '',
      systolicBP:
        initialData.vitalSigns?.systolicBP !== undefined
          ? String(initialData.vitalSigns.systolicBP)
          : '',
      diastolicBP:
        initialData.vitalSigns?.diastolicBP !== undefined
          ? String(initialData.vitalSigns.diastolicBP)
          : '',
      respiratoryRate:
        initialData.vitalSigns?.respiratoryRate !== undefined
          ? String(initialData.vitalSigns.respiratoryRate)
          : '',
      oxygenSaturation:
        initialData.vitalSigns?.oxygenSaturation !== undefined
          ? String(initialData.vitalSigns.oxygenSaturation)
          : '',
    };
  }

  return {
    fullName: '',
    dateOfBirth: '',
    gender: 'male',
    phone: '',
    email: '',
    height: '',
    weight: '',
    street: '',
    city: '',
    postalCode: '',
    hasAffiliation: false,
    affiliationDuration: 6,
    emergencyContactFullName: '',
    emergencyContactRelationship: 'spouse',
    emergencyContactPhone: '',
    emergencyContactEmail: '',
    chronicConditions: '',
    currentMedications: '',
    allergies: '',
    previousSurgeries: '',
    familyHistory: '',
    smoking: false,
    alcohol: false,
    temperature: '',
    heartRate: '',
    systolicBP: '',
    diastolicBP: '',
    respiratoryRate: '',
    oxygenSaturation: '',
  };
};

export const usePatientForm = (initialData?: Partial<Patient>) => {
  const [formData, setFormData] = useState<PatientFormData>(() =>
    createInitialFormData(initialData)
  );

  const getDefaultFormData = (): PatientFormData => ({
    fullName: '',
    dateOfBirth: '',
    gender: 'male',
    phone: '',
    email: '',
    height: '',
    weight: '',
    street: '',
    city: '',
    postalCode: '',
    hasAffiliation: false,
    affiliationDuration: 6,
    emergencyContactFullName: '',
    emergencyContactRelationship: 'spouse',
    emergencyContactPhone: '',
    emergencyContactEmail: '',
    chronicConditions: '',
    currentMedications: '',
    allergies: '',
    previousSurgeries: '',
    familyHistory: '',
    smoking: false,
    alcohol: false,
    temperature: '',
    heartRate: '',
    systolicBP: '',
    diastolicBP: '',
    respiratoryRate: '',
    oxygenSaturation: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = <K extends keyof PatientFormData>(field: K, value: PatientFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors = validatePatientForm(formData);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const reset = () => {
    setFormData(getDefaultFormData());
    setErrors({});
    setIsSubmitting(false);
  };

  return {
    formData,
    errors,
    isSubmitting,
    setIsSubmitting,
    updateField,
    validate,
    reset,
  };
};
