/**
 * Patient Management Types
 */

// Import types from enums for local use
import type { Gender as GenderType } from '@/types/enums';
import type { AffiliationDuration as AffiliationDurationType } from '@/types/enums';
import type { Relationship as RelationshipType } from '@/types/enums';

// Re-export types (Single Source of Truth)
export type { Gender } from '@/types/enums';
export type { AffiliationDuration } from '@/types/enums';
export type { Relationship } from '@/types/enums';

// Re-export the VALUES arrays for backwards compatibility
export { GENDER_VALUES } from '@/types/enums';
export { AFFILIATION_DURATION_VALUES } from '@/types/enums';
export { RELATIONSHIP_VALUES } from '@/types/enums';

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
  createdBy: string; // Backend returns string user ID
  createdAt: string;
  updatedAt: string;
  updatedBy: string; // Backend returns string user ID
}

/**
 * PatientContext — Superset type for all patient-facing views.
 *
 * Combines the full Patient record with pre-computed order statistics
 * to avoid redundant Order[] lookups in every component that renders
 * patient cards, rows, or detail views.
 *
 * Built by `usePatientContextList` — joins cached Patient[] + Order[].
 * No additional API calls required.
 *
 * Consumers: PatientList, PatientDetail, PatientTableConfig
 */
export interface PatientContext extends Patient {
  /** Total number of orders for this patient. */
  orderCount: number;
  /** Most recent order date (ISO string), or undefined if no orders. */
  lastOrderDate?: string;
  /** Most recent order's overall status, or undefined if no orders. */
  lastOrderStatus?: string;
  /** Whether the patient has any unpaid orders. */
  hasUnpaidOrders: boolean;
}
