/**
 * Patient Management Types
 */

// Import types from enums for local use
import type { Gender as GenderType } from './enums/gender';
import type { AffiliationDuration as AffiliationDurationType } from './enums/affiliation-duration';
import type { Relationship as RelationshipType } from './enums/relationship';

// Re-export types (Single Source of Truth)
export type { Gender } from './enums/gender';
export type { AffiliationDuration } from './enums/affiliation-duration';
export type { Relationship } from './enums/relationship';

// Re-export the VALUES arrays for backwards compatibility
export { GENDER_VALUES } from './enums/gender';
export { AFFILIATION_DURATION_VALUES } from './enums/affiliation-duration';
export { RELATIONSHIP_VALUES } from './enums/relationship';

// Local type aliases for use in this file
type Gender = GenderType;
type AffiliationDuration = AffiliationDurationType;
type Relationship = RelationshipType;

export interface Affiliation {
  assuranceNumber: string; // Auto-generated: ASS-YYYYMMDD-XXX
  startDate: string; // ISO date
  endDate: string; // ISO date (calculated from duration)
  duration: AffiliationDuration; // Duration in months
}

export interface EmergencyContact {
  fullName: string;
  relationship: Relationship;
  phone: string;
  email?: string;
}

export interface VitalSigns {
  temperature: number; // Celsius, 30.0-45.0, Normal: 36.5-37.3
  heartRate: number; // BPM, 30-250, Normal: 60-100
  systolicBP: number; // mmHg, 50-250, Normal: <120
  diastolicBP: number; // mmHg, 30-150, Normal: <80
  respiratoryRate: number; // breaths/min, 4-60, Normal: 12-20
  oxygenSaturation: number; // SpO2 %, 50-100, Normal: 95-100
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
  /** Backend uses list[str]; we send array, store as string in form (semicolon-delimited) */
  familyHistory: string | string[];
  lifestyle: {
    smoking: boolean;
    alcohol: boolean;
  };
}

export interface Patient {
  id: number; // Integer ID, displayed as PAT{id}
  fullName: string;
  dateOfBirth: string;
  gender: Gender;
  phone: string;
  email?: string;
  height?: number; // Height in centimeters
  weight?: number; // Weight in kilograms
  address: Address;
  affiliation?: Affiliation;
  emergencyContact: EmergencyContact;
  medicalHistory: MedicalHistory;
  vitalSigns?: VitalSigns;
  registrationDate: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  updatedBy: number;
}
