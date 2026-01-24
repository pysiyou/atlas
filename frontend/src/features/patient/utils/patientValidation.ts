/**
 * Patient Form Validation Utilities
 * Extracted from usePatientForm for better maintainability
 */

import {
  validateRequired,
  validateLength,
  validateEmail,
  validatePhoneNumber,
  validatePostalCode,
} from '@/utils';
import { VALIDATION_MESSAGES, VALIDATION_RULES } from '@/config';
import type { PatientFormData } from '../hooks/usePatientForm';

/**
 * Validates patient form data and returns error messages
 * High complexity is necessary to validate all patient form fields comprehensively
 */
// eslint-disable-next-line complexity
export const validatePatientForm = (formData: PatientFormData): Record<string, string> => {
  const newErrors: Record<string, string> = {};

  // Full Name validation
  if (!validateRequired(formData.fullName)) {
    newErrors.fullName = VALIDATION_MESSAGES.REQUIRED.FULL_NAME;
  } else if (
    !validateLength(
      formData.fullName,
      VALIDATION_RULES.NAME.MIN_LENGTH,
      VALIDATION_RULES.NAME.MAX_LENGTH
    )
  ) {
    newErrors.fullName = VALIDATION_MESSAGES.LENGTH.NAME;
  }

  // Gender validation
  if (!formData.gender) {
    newErrors.gender = 'Please select a gender';
  }

  // Date of Birth validation
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

  // Phone validation
  if (!validateRequired(formData.phone)) {
    newErrors.phone = VALIDATION_MESSAGES.REQUIRED.PHONE;
  } else if (!validatePhoneNumber(formData.phone)) {
    newErrors.phone = VALIDATION_MESSAGES.INVALID.PHONE;
  }

  // Email validation (optional)
  if (formData.email && !validateEmail(formData.email)) {
    newErrors.email = VALIDATION_MESSAGES.INVALID.EMAIL;
  }

  // Height validation (optional)
  if (formData.height) {
    const heightNum = parseFloat(formData.height);
    if (isNaN(heightNum) || heightNum < 30 || heightNum > 250) {
      newErrors.height = 'Height must be between 30 and 250 cm';
    }
  }

  // Weight validation (optional)
  if (formData.weight) {
    const weightNum = parseFloat(formData.weight);
    if (isNaN(weightNum) || weightNum < 1 || weightNum > 500) {
      newErrors.weight = 'Weight must be between 1 and 500 kg';
    }
  }

  // Address validation
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

  // Affiliation duration required when user opts in to affiliation
  if (formData.hasAffiliation && !formData.affiliationDuration) {
    newErrors.affiliationDuration = 'Please select a duration';
  }

  // Emergency Contact validation
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

  // Vital signs validation (all-or-none)
  const vitals = {
    temperature: formData.temperature,
    heartRate: formData.heartRate,
    systolicBP: formData.systolicBP,
    diastolicBP: formData.diastolicBP,
    respiratoryRate: formData.respiratoryRate,
    oxygenSaturation: formData.oxygenSaturation,
  };

  const anyVitalProvided = Object.values(vitals).some(v => String(v || '').trim().length > 0);

  if (anyVitalProvided) {
    const missingKeys = Object.entries(vitals)
      .filter(([, v]) => String(v || '').trim().length === 0)
      .map(([k]) => k);

    if (missingKeys.length > 0) {
      for (const k of missingKeys) {
        newErrors[k] = 'Please complete all vital fields or leave all blank';
      }
    }

    validateVitalRange('temperature', vitals.temperature, 30.0, 45.0, parseFloat, newErrors);
    validateVitalRange('heartRate', vitals.heartRate, 30, 250, r => parseInt(r, 10), newErrors);
    validateVitalRange('systolicBP', vitals.systolicBP, 50, 250, r => parseInt(r, 10), newErrors);
    validateVitalRange('diastolicBP', vitals.diastolicBP, 30, 150, r => parseInt(r, 10), newErrors);
    validateVitalRange(
      'respiratoryRate',
      vitals.respiratoryRate,
      4,
      60,
      r => parseInt(r, 10),
      newErrors
    );
    validateVitalRange(
      'oxygenSaturation',
      vitals.oxygenSaturation,
      50,
      100,
      r => parseInt(r, 10),
      newErrors
    );
  }

  return newErrors;
};

/**
 * Validates a vital sign is within acceptable range
 */
const validateVitalRange = (
  key: string,
  value: string,
  min: number,
  max: number,
  parse: (raw: string) => number,
  errors: Record<string, string>
): void => {
  const raw = String(value || '').trim();
  if (!raw) return; // missing handled elsewhere

  const num = parse(raw);
  if (Number.isNaN(num) || num < min || num > max) {
    errors[key] = `Must be between ${min} and ${max}`;
  }
};
