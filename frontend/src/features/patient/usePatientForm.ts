import { useState } from 'react';
import type { Gender, AffiliationDuration, Affiliation, Patient, Relationship } from '@/types';
import {
  validateRequired,
  validateLength,
  validateEmail,
  validatePhoneNumber,
  validatePostalCode,
} from '@/utils';
import { VALIDATION_MESSAGES, VALIDATION_RULES } from '@/config';

interface PatientFormData {
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
  affiliationDuration: AffiliationDuration;  // Numeric: 1, 3, 6, 12, or 24 months
  emergencyContactFullName: string;
  emergencyContactRelationship: Relationship;
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

// Helper: Generate unique assurance number
export const generateAssuranceNumber = (): string => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ASS-${dateStr}-${randomSuffix}`;
};

// Helper: Calculate end date based on duration (duration is now in months)
export const calculateEndDate = (startDate: string, duration: AffiliationDuration): string => {
  const start = new Date(startDate);
  start.setMonth(start.getMonth() + duration);
  return start.toISOString().slice(0, 10);
};

// Helper: Check if affiliation is active
export const isAffiliationActive = (affiliation?: Affiliation): boolean => {
  if (!affiliation) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(affiliation.endDate);
  endDate.setHours(0, 0, 0, 0);
  return endDate >= today;
};

// Helper: Get affiliation status label
export const getAffiliationStatus = (affiliation?: Affiliation): 'active' | 'expired' | 'none' => {
  if (!affiliation) return 'none';
  return isAffiliationActive(affiliation) ? 'active' : 'expired';
};

export const usePatientForm = (initialData?: Partial<Patient>) => {
  const [formData, setFormData] = useState<PatientFormData>(() => {
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
        affiliationDuration: initialData.affiliation?.duration || 1,
        emergencyContactFullName: initialData.emergencyContact?.fullName || '',
        emergencyContactRelationship: initialData.emergencyContact?.relationship || 'spouse',
        emergencyContactPhone: initialData.emergencyContact?.phone || '',
        emergencyContactEmail: initialData.emergencyContact?.email || '',
        chronicConditions: initialData.medicalHistory?.chronicConditions?.join('; ') || '',
        currentMedications: initialData.medicalHistory?.currentMedications?.join('; ') || '',
        allergies: initialData.medicalHistory?.allergies?.join('; ') || '',
        previousSurgeries: initialData.medicalHistory?.previousSurgeries?.join('; ') || '',
        familyHistory: initialData.medicalHistory?.familyHistory || '',
        smoking: initialData.medicalHistory?.lifestyle?.smoking || false,
        alcohol: initialData.medicalHistory?.lifestyle?.alcohol || false,
        temperature: initialData.vitalSigns?.temperature !== undefined ? String(initialData.vitalSigns.temperature) : '',
        heartRate: initialData.vitalSigns?.heartRate !== undefined ? String(initialData.vitalSigns.heartRate) : '',
        systolicBP: initialData.vitalSigns?.systolicBP !== undefined ? String(initialData.vitalSigns.systolicBP) : '',
        diastolicBP: initialData.vitalSigns?.diastolicBP !== undefined ? String(initialData.vitalSigns.diastolicBP) : '',
        respiratoryRate: initialData.vitalSigns?.respiratoryRate !== undefined ? String(initialData.vitalSigns.respiratoryRate) : '',
        oxygenSaturation: initialData.vitalSigns?.oxygenSaturation !== undefined ? String(initialData.vitalSigns.oxygenSaturation) : '',
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
      affiliationDuration: 1,
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
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = <K extends keyof PatientFormData>(
    field: K,
    value: PatientFormData[K]
  ) => {
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
    const newErrors: Record<string, string> = {};

    if (!validateRequired(formData.fullName)) {
      newErrors.fullName = VALIDATION_MESSAGES.REQUIRED.FULL_NAME;
    } else if (!validateLength(formData.fullName, VALIDATION_RULES.NAME.MIN_LENGTH, VALIDATION_RULES.NAME.MAX_LENGTH)) {
      newErrors.fullName = VALIDATION_MESSAGES.LENGTH.NAME;
    }

    if (!formData.gender) {
      newErrors.gender = 'Please select a gender';
    }

    if (!validateRequired(formData.dateOfBirth)) {
      newErrors.dateOfBirth = VALIDATION_MESSAGES.REQUIRED.DATE_OF_BIRTH;
    } else {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      if (dob >= today) {
        newErrors.dateOfBirth = VALIDATION_MESSAGES.INVALID.DATE_PAST;
      }
      const age = today.getFullYear() - dob.getFullYear();
      if (age > VALIDATION_RULES.AGE.MAX) {
        newErrors.dateOfBirth = VALIDATION_MESSAGES.INVALID.DATE_OF_BIRTH;
      }
    }

    if (!validateRequired(formData.phone)) {
      newErrors.phone = VALIDATION_MESSAGES.REQUIRED.PHONE;
    } else if (!validatePhoneNumber(formData.phone)) {
      newErrors.phone = VALIDATION_MESSAGES.INVALID.PHONE;
    }

    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = VALIDATION_MESSAGES.INVALID.EMAIL;
    }

    // Validate height (optional, but if provided must be valid)
    if (formData.height) {
      const heightNum = parseFloat(formData.height);
      if (isNaN(heightNum) || heightNum < 30 || heightNum > 250) {
        newErrors.height = 'Height must be between 30 and 250 cm';
      }
    }

    // Validate weight (optional, but if provided must be valid)
    if (formData.weight) {
      const weightNum = parseFloat(formData.weight);
      if (isNaN(weightNum) || weightNum < 1 || weightNum > 500) {
        newErrors.weight = 'Weight must be between 1 and 500 kg';
      }
    }

    if (!validateRequired(formData.street)) {
      newErrors.street = VALIDATION_MESSAGES.REQUIRED.STREET;
    }

    if (!validateRequired(formData.city)) {
      newErrors.city = VALIDATION_MESSAGES.REQUIRED.CITY;
    }

    if (!validateRequired(formData.postalCode)) {
      newErrors.postalCode = VALIDATION_MESSAGES.REQUIRED.POSTAL_CODE;
    } else if (!validatePostalCode(formData.postalCode)) {
      newErrors.postalCode = VALIDATION_MESSAGES.INVALID.POSTAL_CODE;
    }

    if (!validateRequired(formData.emergencyContactFullName)) {
      newErrors.emergencyContactFullName = VALIDATION_MESSAGES.REQUIRED.EMERGENCY_CONTACT_NAME;
    }

    if (!formData.emergencyContactRelationship) {
      newErrors.emergencyContactRelationship = 'Please select a relationship';
    }

    if (!validateRequired(formData.emergencyContactPhone)) {
      newErrors.emergencyContactPhone = VALIDATION_MESSAGES.REQUIRED.EMERGENCY_CONTACT_PHONE;
    } else if (!validatePhoneNumber(formData.emergencyContactPhone)) {
      newErrors.emergencyContactPhone = VALIDATION_MESSAGES.INVALID.PHONE;
    }

    if (formData.emergencyContactEmail && !validateEmail(formData.emergencyContactEmail)) {
      newErrors.emergencyContactEmail = VALIDATION_MESSAGES.INVALID.EMAIL;
    }

    /**
     * Vital signs validation (all-or-none).
     * Rationale:
     * - Prevent accidental writes of partial vitals.
     * - Avoid converting blanks to 0 in payload construction.
     * - Enforce min/max constraints from `VitalSigns` interface comments.
     */
    const vitals = {
      temperature: formData.temperature,
      heartRate: formData.heartRate,
      systolicBP: formData.systolicBP,
      diastolicBP: formData.diastolicBP,
      respiratoryRate: formData.respiratoryRate,
      oxygenSaturation: formData.oxygenSaturation,
    };

    const anyVitalProvided = Object.values(vitals).some((v) => String(v || '').trim().length > 0);
    if (anyVitalProvided) {
      const missingKeys = Object.entries(vitals)
        .filter(([, v]) => String(v || '').trim().length === 0)
        .map(([k]) => k);

      if (missingKeys.length > 0) {
        // Mark all missing ones with a consistent message.
        for (const k of missingKeys) {
          newErrors[k] = 'Please complete all vital fields or leave all blank';
        }
      }

      const validateNumberInRange = (
        key: keyof typeof vitals,
        min: number,
        max: number,
        parse: (raw: string) => number
      ) => {
        const raw = String(vitals[key] || '').trim();
        if (!raw) return; // missing handled above
        const num = parse(raw);
        if (Number.isNaN(num) || num < min || num > max) {
          newErrors[key] = `Must be between ${min} and ${max}`;
        }
      };

      validateNumberInRange('temperature', 30.0, 45.0, (r) => parseFloat(r));
      validateNumberInRange('heartRate', 30, 250, (r) => parseInt(r, 10));
      validateNumberInRange('systolicBP', 50, 250, (r) => parseInt(r, 10));
      validateNumberInRange('diastolicBP', 30, 150, (r) => parseInt(r, 10));
      validateNumberInRange('respiratoryRate', 4, 60, (r) => parseInt(r, 10));
      validateNumberInRange('oxygenSaturation', 50, 100, (r) => parseInt(r, 10));
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const reset = () => {
    setFormData({
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
      affiliationDuration: 1,
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
