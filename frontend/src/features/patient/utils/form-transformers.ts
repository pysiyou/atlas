/**
 * Form Data Transformers
 * Transforms between flat form structure (for UI) and nested schema structure (for API)
 */

import type { PatientFormInput } from '../schemas/patient.schema';
import type { Patient as PatientType } from '@/types';

/**
 * Transform Patient from API to form input structure
 * Handles nested objects and arrays
 */
export function patientToFormInput(patient?: Partial<PatientType>): Partial<PatientFormInput> {
  if (!patient) {
    return {};
  }

  return {
    fullName: patient.fullName || '',
    dateOfBirth: patient.dateOfBirth || '',
    gender: patient.gender,
    phone: patient.phone || '',
    email: patient.email || '',
    height: patient.height,
    weight: patient.weight,
    address: patient.address
      ? {
          street: patient.address.street || '',
          city: patient.address.city || '',
          postalCode: patient.address.postalCode || '',
        }
      : undefined,
    affiliation: patient.affiliation
      ? {
          assuranceNumber: patient.affiliation.assuranceNumber,
          startDate: patient.affiliation.startDate,
          endDate: patient.affiliation.endDate,
          duration: patient.affiliation.duration,
        }
      : undefined,
    emergencyContact: patient.emergencyContact
      ? {
          fullName: patient.emergencyContact.fullName || '',
          relationship: patient.emergencyContact.relationship,
          phone: patient.emergencyContact.phone || '',
          email: patient.emergencyContact.email || '',
        }
      : undefined,
    medicalHistory: patient.medicalHistory
      ? {
          chronicConditions: patient.medicalHistory.chronicConditions,
          currentMedications: patient.medicalHistory.currentMedications,
          allergies: patient.medicalHistory.allergies,
          previousSurgeries: patient.medicalHistory.previousSurgeries,
          familyHistory: Array.isArray(patient.medicalHistory.familyHistory)
            ? patient.medicalHistory.familyHistory
            : patient.medicalHistory.familyHistory || '',
          lifestyle: patient.medicalHistory.lifestyle,
        }
      : undefined,
    vitalSigns: patient.vitalSigns
      ? {
          temperature: patient.vitalSigns.temperature,
          heartRate: patient.vitalSigns.heartRate,
          systolicBP: patient.vitalSigns.systolicBP,
          diastolicBP: patient.vitalSigns.diastolicBP,
          respiratoryRate: patient.vitalSigns.respiratoryRate,
          oxygenSaturation: patient.vitalSigns.oxygenSaturation,
        }
      : undefined,
  };
}

/**
 * Generate unique assurance number (ASS-YYYYMMDD-XXX format)
 */
function generateAssuranceNumber(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `ASS-${dateStr}-${randomSuffix}`;
}

/**
 * Calculate end date based on duration (duration is in months)
 */
function calculateEndDate(startDate: string, duration: 6 | 12 | 24): string {
  const start = new Date(startDate);
  start.setMonth(start.getMonth() + duration);
  return start.toISOString().slice(0, 10);
}

/**
 * Transform form input to API payload
 * Handles optional fields and nested structures
 */
export function formInputToPayload(
  formData: Partial<PatientFormInput>,
  _existingPatient?: Partial<PatientType>
): Partial<PatientFormInput> {
  const payload: Partial<PatientFormInput> = { ...formData };

  // Transform affiliation: if only duration provided, generate full affiliation
  if (payload.affiliation) {
    // Convert duration from string to number if needed
    const duration =
      typeof payload.affiliation.duration === 'string'
        ? (Number(payload.affiliation.duration) as 6 | 12 | 24)
        : payload.affiliation.duration;

    // If only duration is provided, generate full affiliation object
    if (duration && !payload.affiliation.assuranceNumber && !payload.affiliation.startDate) {
      const startDate = new Date().toISOString().slice(0, 10);
      payload.affiliation = {
        assuranceNumber: generateAssuranceNumber(),
        startDate,
        endDate: calculateEndDate(startDate, duration),
        duration,
      };
    } else if (duration && payload.affiliation.startDate && !payload.affiliation.endDate) {
      // If startDate exists but no endDate, calculate it
      payload.affiliation = {
        ...payload.affiliation,
        endDate: calculateEndDate(payload.affiliation.startDate, duration),
        duration,
      };
    } else if (duration) {
      // Ensure duration is set
      payload.affiliation = {
        ...payload.affiliation,
        duration,
      };
    }
  }

  // Handle medical history familyHistory: always convert to array
  if (payload.medicalHistory) {
    const familyHistory = payload.medicalHistory.familyHistory;
    if (typeof familyHistory === 'string') {
      // Convert string to array (split by semicolon or use as single item)
      if (familyHistory.trim()) {
        payload.medicalHistory.familyHistory = familyHistory
          .split(';')
          .map(s => s.trim())
          .filter(Boolean);
      } else {
        // Empty string becomes empty array
        payload.medicalHistory.familyHistory = [];
      }
    } else if (!Array.isArray(familyHistory)) {
      // Ensure it's an array (fallback to empty array)
      payload.medicalHistory.familyHistory = [];
    }
  }

  return payload;
}
