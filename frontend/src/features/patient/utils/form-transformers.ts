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
          // Convert null to undefined for form schema compatibility
          temperature: patient.vitalSigns.temperature ?? undefined,
          heartRate: patient.vitalSigns.heartRate ?? undefined,
          systolicBP: patient.vitalSigns.systolicBP ?? undefined,
          diastolicBP: patient.vitalSigns.diastolicBP ?? undefined,
          respiratoryRate: patient.vitalSigns.respiratoryRate ?? undefined,
          oxygenSaturation: patient.vitalSigns.oxygenSaturation ?? undefined,
        }
      : undefined,
  };
}

/**
 * Transform form input to API payload
 * Simplified - let schema validation and backend handle most transformations
 */
export function formInputToPayload(
  formData: Partial<PatientFormInput>,
  _existingPatient?: Partial<PatientType>
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  // Copy all primitive fields directly
  if (formData.fullName !== undefined) payload.fullName = formData.fullName;
  if (formData.dateOfBirth !== undefined) payload.dateOfBirth = formData.dateOfBirth;
  if (formData.gender !== undefined) payload.gender = formData.gender;
  if (formData.phone !== undefined) payload.phone = formData.phone;
  
  // Email: convert empty string to undefined (backend treats as null)
  if (formData.email !== undefined) {
    payload.email = formData.email === '' ? undefined : formData.email;
  }
  
  if (formData.height !== undefined) payload.height = formData.height;
  if (formData.weight !== undefined) payload.weight = formData.weight;

  // Copy nested objects (backend handles validation)
  if (formData.address !== undefined) payload.address = formData.address;
  
  // Emergency contact: clean up empty email
  if (formData.emergencyContact !== undefined) {
    const emergencyContact = { ...formData.emergencyContact };
    if (emergencyContact.email === '') {
      emergencyContact.email = undefined;
    }
    payload.emergencyContact = emergencyContact;
  }

  // Affiliation: backend auto-generates fields when only duration is provided
  if (formData.affiliation !== undefined && formData.affiliation !== null) {
    payload.affiliation = formData.affiliation;
  }

  // Medical history: ensure familyHistory is array format
  if (formData.medicalHistory !== undefined && formData.medicalHistory !== null) {
    const medicalHistory = { ...formData.medicalHistory };
    
    // Convert familyHistory string to array if needed
    if (typeof medicalHistory.familyHistory === 'string') {
      medicalHistory.familyHistory = medicalHistory.familyHistory
        .split(';')
        .map(s => s.trim())
        .filter(Boolean);
    }
    
    payload.medicalHistory = medicalHistory;
  }

  // Vital signs: send partial updates (backend accepts optional fields)
  if (formData.vitalSigns !== undefined && formData.vitalSigns !== null) {
    // Filter out undefined/null values - only send provided vitals
    const vs = formData.vitalSigns;
    const vitalSigns: Record<string, number> = {};
    
    if (vs.temperature !== undefined && vs.temperature !== null) vitalSigns.temperature = vs.temperature;
    if (vs.heartRate !== undefined && vs.heartRate !== null) vitalSigns.heartRate = vs.heartRate;
    if (vs.systolicBP !== undefined && vs.systolicBP !== null) vitalSigns.systolicBP = vs.systolicBP;
    if (vs.diastolicBP !== undefined && vs.diastolicBP !== null) vitalSigns.diastolicBP = vs.diastolicBP;
    if (vs.respiratoryRate !== undefined && vs.respiratoryRate !== null) vitalSigns.respiratoryRate = vs.respiratoryRate;
    if (vs.oxygenSaturation !== undefined && vs.oxygenSaturation !== null) vitalSigns.oxygenSaturation = vs.oxygenSaturation;
    
    // Only include vitalSigns if at least one field has a value
    if (Object.keys(vitalSigns).length > 0) {
      payload.vitalSigns = vitalSigns;
    }
  }

  return payload;
}
