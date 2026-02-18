/**
 * Form Data Transformers
 * Transforms between flat form structure (for UI) and nested schema structure (for API)
 */

import type { PatientFormInput } from '../schemas/patient.schema';
import type { FieldErrors } from 'react-hook-form';
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
// eslint-disable-next-line complexity
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

    if (vs.temperature !== undefined && vs.temperature !== null)
      vitalSigns.temperature = vs.temperature;
    if (vs.heartRate !== undefined && vs.heartRate !== null) vitalSigns.heartRate = vs.heartRate;
    if (vs.systolicBP !== undefined && vs.systolicBP !== null)
      vitalSigns.systolicBP = vs.systolicBP;
    if (vs.diastolicBP !== undefined && vs.diastolicBP !== null)
      vitalSigns.diastolicBP = vs.diastolicBP;
    if (vs.respiratoryRate !== undefined && vs.respiratoryRate !== null)
      vitalSigns.respiratoryRate = vs.respiratoryRate;
    if (vs.oxygenSaturation !== undefined && vs.oxygenSaturation !== null)
      vitalSigns.oxygenSaturation = vs.oxygenSaturation;

    // Only include vitalSigns if at least one field has a value
    if (Object.keys(vitalSigns).length > 0) {
      payload.vitalSigns = vitalSigns;
    }
  }

  return payload;
}

// ─── React Hook Form ↔ Legacy Flat-Field Adapters ────────────────────────────
// These bridge React Hook Form's nested PatientFormInput structure to the flat
// field names expected by the existing form section components (DemographicsSection,
// AddressSection, etc.) which were built before the RHF migration.

/**
 * Converts the nested React Hook Form state into the flat object shape
 * expected by the legacy form section components.
 */
// eslint-disable-next-line complexity
export function createFormDataAdapter(
  watch: import('react-hook-form').UseFormWatch<import('../schemas/patient.schema').PatientFormInput>,
  hasAffiliationChecked: boolean
) {
  const formValues = watch();

  return {
    fullName: formValues.fullName || '',
    dateOfBirth: formValues.dateOfBirth || '',
    gender: formValues.gender,
    phone: formValues.phone || '',
    email: formValues.email || '',
    height: formValues.height?.toString() || '',
    weight: formValues.weight?.toString() || '',
    street: formValues.address?.street || '',
    city: formValues.address?.city || '',
    postalCode: formValues.address?.postalCode || '',
    hasAffiliation: hasAffiliationChecked || !!formValues.affiliation,
    affiliationDuration: formValues.affiliation?.duration ?? undefined,
    emergencyContactFullName: formValues.emergencyContact?.fullName || '',
    emergencyContactRelationship: formValues.emergencyContact?.relationship,
    emergencyContactPhone: formValues.emergencyContact?.phone || '',
    emergencyContactEmail: formValues.emergencyContact?.email || '',
    chronicConditions: Array.isArray(formValues.medicalHistory?.chronicConditions)
      ? formValues.medicalHistory.chronicConditions.join('; ')
      : formValues.medicalHistory?.chronicConditions || '',
    currentMedications: Array.isArray(formValues.medicalHistory?.currentMedications)
      ? formValues.medicalHistory.currentMedications.join('; ')
      : formValues.medicalHistory?.currentMedications || '',
    allergies: Array.isArray(formValues.medicalHistory?.allergies)
      ? formValues.medicalHistory.allergies.join('; ')
      : formValues.medicalHistory?.allergies || '',
    previousSurgeries: Array.isArray(formValues.medicalHistory?.previousSurgeries)
      ? formValues.medicalHistory.previousSurgeries.join('; ')
      : formValues.medicalHistory?.previousSurgeries || '',
    familyHistory:
      typeof formValues.medicalHistory?.familyHistory === 'string'
        ? formValues.medicalHistory.familyHistory
        : Array.isArray(formValues.medicalHistory?.familyHistory)
          ? formValues.medicalHistory.familyHistory.join('; ')
          : '',
    smoking: formValues.medicalHistory?.lifestyle?.smoking ?? false,
    alcohol: formValues.medicalHistory?.lifestyle?.alcohol ?? false,
    temperature: formValues.vitalSigns?.temperature?.toString() || '',
    heartRate: formValues.vitalSigns?.heartRate?.toString() || '',
    systolicBP: formValues.vitalSigns?.systolicBP?.toString() || '',
    diastolicBP: formValues.vitalSigns?.diastolicBP?.toString() || '',
    respiratoryRate: formValues.vitalSigns?.respiratoryRate?.toString() || '',
    oxygenSaturation: formValues.vitalSigns?.oxygenSaturation?.toString() || '',
  };
}

/**
 * Flattens the nested FieldErrors from React Hook Form into the flat
 * `Record<string, string>` shape expected by the legacy form section components.
 */
// eslint-disable-next-line complexity
export function createErrorsAdapter(errors: FieldErrors<PatientFormInput>): Record<string, string> {
  const flatErrors: Record<string, string> = {};

  if (errors.fullName) flatErrors.fullName = errors.fullName.message || '';
  if (errors.dateOfBirth) flatErrors.dateOfBirth = errors.dateOfBirth.message || '';
  if (errors.gender) flatErrors.gender = errors.gender.message || '';
  if (errors.phone) flatErrors.phone = errors.phone.message || '';
  if (errors.email) flatErrors.email = errors.email.message || '';
  if (errors.height) flatErrors.height = errors.height.message || '';
  if (errors.weight) flatErrors.weight = errors.weight.message || '';

  if (errors.address) {
    if (errors.address.street) flatErrors.street = errors.address.street.message || '';
    if (errors.address.city) flatErrors.city = errors.address.city.message || '';
    if (errors.address.postalCode) flatErrors.postalCode = errors.address.postalCode.message || '';
  }

  if (errors.emergencyContact) {
    if (errors.emergencyContact.fullName)
      flatErrors.emergencyContactFullName = errors.emergencyContact.fullName.message || '';
    if (errors.emergencyContact.relationship)
      flatErrors.emergencyContactRelationship =
        errors.emergencyContact.relationship.message || '';
    if (errors.emergencyContact.phone)
      flatErrors.emergencyContactPhone = errors.emergencyContact.phone.message || '';
    if (errors.emergencyContact.email)
      flatErrors.emergencyContactEmail = errors.emergencyContact.email.message || '';
  }

  if (errors.vitalSigns) {
    if (errors.vitalSigns.temperature)
      flatErrors.temperature = errors.vitalSigns.temperature.message || '';
    if (errors.vitalSigns.heartRate)
      flatErrors.heartRate = errors.vitalSigns.heartRate.message || '';
    if (errors.vitalSigns.systolicBP)
      flatErrors.systolicBP = errors.vitalSigns.systolicBP.message || '';
    if (errors.vitalSigns.diastolicBP)
      flatErrors.diastolicBP = errors.vitalSigns.diastolicBP.message || '';
    if (errors.vitalSigns.respiratoryRate)
      flatErrors.respiratoryRate = errors.vitalSigns.respiratoryRate.message || '';
    if (errors.vitalSigns.oxygenSaturation)
      flatErrors.oxygenSaturation = errors.vitalSigns.oxygenSaturation.message || '';
  }

  return flatErrors;
}
