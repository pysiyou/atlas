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

  // Convert null to undefined for optional fields (clean up after nullish() validation)
  if (payload.affiliation === null || payload.affiliation === undefined) {
    delete payload.affiliation;
  }
  if (payload.medicalHistory === null || payload.medicalHistory === undefined) {
    delete payload.medicalHistory;
  }
  if (payload.vitalSigns === null || payload.vitalSigns === undefined) {
    delete payload.vitalSigns;
  }

  // Transform affiliation: only generate full affiliation when duration is explicitly provided
  if (payload.affiliation && typeof payload.affiliation === 'object') {
    // Clean up null values in affiliation object (convert to undefined)
    const cleanedAffiliation: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(payload.affiliation)) {
      if (value !== null && value !== undefined) {
        cleanedAffiliation[key] = value;
      }
    }
    // If all values were null/undefined, remove affiliation entirely and skip processing
    if (Object.keys(cleanedAffiliation).length === 0) {
      delete payload.affiliation;
    } else {
      const cleaned = cleanedAffiliation as PatientFormInput['affiliation'];
      payload.affiliation = cleaned;
      
      // Convert duration from string to number if needed
      const duration =
        typeof cleaned.duration === 'string'
          ? (Number(cleaned.duration) as 6 | 12 | 24)
          : cleaned.duration;

      // Only auto-generate fields if duration is provided
      if (duration !== undefined && duration !== null) {
        // If only duration is provided, generate full affiliation object
        if (!cleaned.assuranceNumber && !cleaned.startDate) {
          const startDate = new Date().toISOString().slice(0, 10);
          payload.affiliation = {
            assuranceNumber: generateAssuranceNumber(),
            startDate,
            endDate: calculateEndDate(startDate, duration),
            duration,
          };
        } else if (cleaned.startDate && !cleaned.endDate) {
          // If startDate exists but no endDate, calculate it
          payload.affiliation = {
            ...cleaned,
            endDate: calculateEndDate(cleaned.startDate, duration),
            duration,
          };
        } else {
          // Ensure duration is set
          payload.affiliation = {
            ...cleaned,
            duration,
          };
        }
      } else {
        // No duration provided - check if affiliation object is empty/partial
        // If affiliation has no meaningful data, omit it entirely
        const hasData = cleaned.assuranceNumber || 
                       cleaned.startDate || 
                       cleaned.endDate;
        if (!hasData) {
          delete payload.affiliation;
        }
        // Otherwise, send partial affiliation as-is (backend will handle it)
      }
    }
  }
  
  // Clean up: remove affiliation if it's an empty object
  if (payload.affiliation && typeof payload.affiliation === 'object' && 
      Object.keys(payload.affiliation).length === 0) {
    delete payload.affiliation;
  }

  // Handle medical history: convert familyHistory to array, handle partial data
  if (payload.medicalHistory && typeof payload.medicalHistory === 'object') {
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

    // Convert null lifestyle to undefined, then provide default if needed
    if (payload.medicalHistory.lifestyle === null || payload.medicalHistory.lifestyle === undefined) {
      // Only provide default if medicalHistory has other data, otherwise let backend handle it
      const hasOtherData = 
        (Array.isArray(payload.medicalHistory.chronicConditions) && payload.medicalHistory.chronicConditions.length > 0) ||
        (Array.isArray(payload.medicalHistory.currentMedications) && payload.medicalHistory.currentMedications.length > 0) ||
        (Array.isArray(payload.medicalHistory.allergies) && payload.medicalHistory.allergies.length > 0) ||
        (Array.isArray(payload.medicalHistory.previousSurgeries) && payload.medicalHistory.previousSurgeries.length > 0) ||
        (Array.isArray(payload.medicalHistory.familyHistory) && payload.medicalHistory.familyHistory.length > 0);
      
      if (hasOtherData) {
        payload.medicalHistory.lifestyle = {
          smoking: false,
          alcohol: false,
        };
      } else {
        payload.medicalHistory.lifestyle = undefined;
      }
    }
  }

  // Vital signs: backend requires all fields when vitalSigns is present
  // Send all fields with null for missing, or omit vitalSigns if no values
  if (payload.vitalSigns) {
    const vs = payload.vitalSigns;
    const fields = ['temperature', 'heartRate', 'systolicBP', 'diastolicBP', 'respiratoryRate', 'oxygenSaturation'] as const;
    const cleaned: Record<(typeof fields)[number], number | null> = {} as Record<(typeof fields)[number], number | null>;
    let hasAnyValue = false;
    
    for (const field of fields) {
      const value = vs[field];
      if (value !== undefined && value !== null && !isNaN(Number(value))) {
        cleaned[field] = typeof value === 'number' ? value : Number(value);
        hasAnyValue = true;
      } else {
        cleaned[field] = null;
      }
    }
    
    if (!hasAnyValue) {
      delete payload.vitalSigns;
    } else {
      // Type assertion: backend expects all fields (with null for missing)
      payload.vitalSigns = cleaned as unknown as PatientFormInput['vitalSigns'];
    }
  }

  return payload;
}
