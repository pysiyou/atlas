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
 * Transform form input to API payload
 * Handles optional fields and nested structures
 */
export function formInputToPayload(
  formData: Partial<PatientFormInput>,
  _existingPatient?: Partial<PatientType>
): Partial<PatientFormInput> {
  // Transform affiliation duration from string to number
  const payload: Partial<PatientFormInput> = { ...formData };

  if (payload.affiliation && typeof payload.affiliation.duration === 'string') {
    payload.affiliation = {
      ...payload.affiliation,
      duration: Number(payload.affiliation.duration) as 6 | 12 | 24,
    };
  }

  // Handle medical history familyHistory (can be string or array)
  if (payload.medicalHistory?.familyHistory) {
    const familyHistory = payload.medicalHistory.familyHistory;
    if (typeof familyHistory === 'string') {
      // Convert semicolon-delimited string to array if needed
      payload.medicalHistory.familyHistory = familyHistory
        .split(';')
        .map(s => s.trim())
        .filter(Boolean);
    }
  }

  return payload;
}
