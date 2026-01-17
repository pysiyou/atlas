/**
 * Patient Management Types
 */

// Import types from enums for local use
import type { Gender as GenderType } from './enums/gender';
import type { AffiliationDuration as AffiliationDurationType } from './enums/affiliation-duration';

// Re-export types (Single Source of Truth)
export type { Gender } from './enums/gender';
export type { AffiliationDuration } from './enums/affiliation-duration';

// Re-export the VALUES arrays for backwards compatibility
export { GENDER_VALUES } from './enums/gender';
export { AFFILIATION_DURATION_VALUES } from './enums/affiliation-duration';

// Local type aliases for use in this file
type Gender = GenderType;
type AffiliationDuration = AffiliationDurationType;

export interface Affiliation {
  assuranceNumber: string;    // Auto-generated: ASS-YYYYMMDD-XXX
  startDate: string;          // ISO date
  endDate: string;            // ISO date (calculated from duration)
  duration: AffiliationDuration;  // Duration in months
}

export interface EmergencyContact {
  name: string;
  phone: string;
}

export interface Address {
  street: string;
  city: string;
  postalCode: string;
}

export interface MedicalHistory {
  chronicConditions: string[];
  currentMedications: string[];
  allergies: string[];
  previousSurgeries: string[];
  familyHistory: string;
  lifestyle: {
    smoking: boolean;
    alcohol: boolean;
  };
}

export interface Patient {
  id: string; // PAT-YYYYMMDD-XXX
  fullName: string;
  dateOfBirth: string;
  gender: Gender;
  phone: string;
  email?: string;
  address: Address;
  affiliation?: Affiliation;
  emergencyContact: EmergencyContact;
  medicalHistory: MedicalHistory;
  registrationDate: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}
