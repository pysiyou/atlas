/**
 * Patient Management Types
 */

import type { Gender as GenderType } from '../contracts/enums/gender';
import type { AffiliationDuration } from '../contracts/enums/affiliation';
import type { Relationship } from '../contracts/enums/relationship';

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
  gender: GenderType;
  phone: string;
  email?: string;
  height?: number; // Height in centimeters
  weight?: number; // Weight in kilograms
  address: Address;
  affiliation?: Affiliation;
  emergencyContact: EmergencyContact;
  medicalHistory: MedicalHistory;
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
 * Built by `usePaginatedPatientContextList` — joins paginated patients with per-patient orders.
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
