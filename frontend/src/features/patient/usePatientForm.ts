import { useState } from 'react';
import type { Gender, AffiliationDuration, Affiliation } from '@/types';
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
  street: string;
  city: string;
  postalCode: string;
  hasAffiliation: boolean;
  affiliationDuration: AffiliationDuration;  // Numeric: 1, 3, 6, 12, or 24 months
  emergencyContactName: string;
  emergencyContactPhone: string;
  chronicConditions: string;
  currentMedications: string;
  allergies: string;
  previousSurgeries: string;
  familyHistory: string;
  smoking: boolean;
  alcohol: boolean;
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

export const usePatientForm = (initialData?: any) => {
  const [formData, setFormData] = useState<PatientFormData>(() => {
    if (initialData) {
      return {
        fullName: initialData.fullName || '',
        dateOfBirth: initialData.dateOfBirth || '',
        gender: initialData.gender || 'male',
        phone: initialData.phone || '',
        email: initialData.email || '',
        street: initialData.address?.street || '',
        city: initialData.address?.city || '',
        postalCode: initialData.address?.postalCode || '',
        hasAffiliation: !!initialData.affiliation,
        affiliationDuration: initialData.affiliation?.duration || 1,
        emergencyContactName: initialData.emergencyContact?.name || '',
        emergencyContactPhone: initialData.emergencyContact?.phone || '',
        chronicConditions: initialData.medicalHistory?.chronicConditions?.join(', ') || '',
        currentMedications: initialData.medicalHistory?.currentMedications?.join(', ') || '',
        allergies: initialData.medicalHistory?.allergies?.join(', ') || '',
        previousSurgeries: initialData.medicalHistory?.previousSurgeries?.join(', ') || '',
        familyHistory: initialData.medicalHistory?.familyHistory || '',
        smoking: initialData.medicalHistory?.lifestyle?.smoking || false,
        alcohol: initialData.medicalHistory?.lifestyle?.alcohol || false,
      };
    }
    return {
      fullName: '',
      dateOfBirth: '',
      gender: 'male',
      phone: '',
      email: '',
      street: '',
      city: '',
      postalCode: '',
      hasAffiliation: false,
      affiliationDuration: 1,
      emergencyContactName: '',
      emergencyContactPhone: '',
      chronicConditions: '',
      currentMedications: '',
      allergies: '',
      previousSurgeries: '',
      familyHistory: '',
      smoking: false,
      alcohol: false,
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

    if (!validateRequired(formData.emergencyContactName)) {
      newErrors.emergencyContactName = VALIDATION_MESSAGES.REQUIRED.EMERGENCY_CONTACT_NAME;
    }

    if (!validateRequired(formData.emergencyContactPhone)) {
      newErrors.emergencyContactPhone = VALIDATION_MESSAGES.REQUIRED.EMERGENCY_CONTACT_PHONE;
    } else if (!validatePhoneNumber(formData.emergencyContactPhone)) {
      newErrors.emergencyContactPhone = VALIDATION_MESSAGES.INVALID.PHONE;
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
      street: '',
      city: '',
      postalCode: '',
      hasAffiliation: false,
      affiliationDuration: 1,
      emergencyContactName: '',
      emergencyContactPhone: '',
      chronicConditions: '',
      currentMedications: '',
      allergies: '',
      previousSurgeries: '',
      familyHistory: '',
      smoking: false,
      alcohol: false,
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
