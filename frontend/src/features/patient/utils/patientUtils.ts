/**
 * Patient Utility Functions
 * Consolidated utilities for patient data management, formatting, and calculations
 */

import type { Patient, Order, Affiliation, AffiliationDuration } from '@/types';
import {
  formatDetailDate as formatDetailDateShared,
  formatArray,
  formatOrderDate,
} from '@/shared/utils/data';
// PatientFormData type removed - using PatientFormInput from schemas instead
// Keeping calculateFormProgress for backward compatibility during migration
type PatientFormData = {
  fullName: string;
  dateOfBirth: string;
  gender?: 'male' | 'female';
  phone: string;
  email: string;
  height: string;
  weight: string;
  street: string;
  city: string;
  postalCode: string;
  emergencyContactFullName: string;
  emergencyContactRelationship?: 'spouse' | 'parent' | 'sibling' | 'child' | 'friend' | 'other';
  emergencyContactPhone: string;
  emergencyContactEmail: string;
  chronicConditions: string;
  currentMedications: string;
  allergies: string;
  previousSurgeries: string;
  familyHistory: string;
  temperature: string;
  heartRate: string;
  systolicBP: string;
  diastolicBP: string;
  respiratoryRate: string;
  oxygenSaturation: string;
};

// ============================================================================
// AFFILIATION UTILITIES
// ============================================================================

/**
 * Generate unique assurance number
 */
export const generateAssuranceNumber = (): string => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `ASS-${dateStr}-${randomSuffix}`;
};

/**
 * Calculate end date based on duration (duration is in months)
 */
export const calculateEndDate = (startDate: string, duration: AffiliationDuration): string => {
  const start = new Date(startDate);
  start.setMonth(start.getMonth() + duration);
  return start.toISOString().slice(0, 10);
};

/**
 * Check if affiliation is active
 */
export const isAffiliationActive = (affiliation?: Affiliation): boolean => {
  if (!affiliation) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(affiliation.endDate);
  endDate.setHours(0, 0, 0, 0);
  return endDate >= today;
};

/**
 * Get affiliation status label
 */
export const getAffiliationStatus = (affiliation?: Affiliation): 'active' | 'expired' | 'none' => {
  if (!affiliation) return 'none';
  return isAffiliationActive(affiliation) ? 'active' : 'expired';
};

// ============================================================================
// FORM PROGRESS UTILITIES
// ============================================================================

export interface FormProgress {
  filled: number;
  total: number;
  percentage: number;
}

/**
 * Calculate form completion progress based on filled parameters
 */
export const calculateFormProgress = (formData: PatientFormData): FormProgress => {
  // Define all form parameters to track
  const parameters = [
    formData.fullName,
    formData.dateOfBirth,
    formData.gender,
    formData.phone,
    formData.email,
    formData.height,
    formData.weight,
    formData.street,
    formData.city,
    formData.postalCode,
    formData.emergencyContactFullName,
    formData.emergencyContactRelationship,
    formData.emergencyContactPhone,
    formData.emergencyContactEmail,
    formData.chronicConditions,
    formData.currentMedications,
    formData.allergies,
    formData.previousSurgeries,
    formData.familyHistory,
    // Vitals - count as one parameter if any are filled, or all are empty
    formData.temperature ||
      formData.heartRate ||
      formData.systolicBP ||
      formData.diastolicBP ||
      formData.respiratoryRate ||
      formData.oxygenSaturation,
  ];

  // Count filled parameters (non-empty strings, non-false booleans)
  const filled = parameters.filter(param => {
    if (typeof param === 'boolean') return param === true;
    if (typeof param === 'string') return param.trim() !== '';
    return param !== undefined && param !== null;
  }).length;

  const total = parameters.length;
  const percentage = total > 0 ? Math.round((filled / total) * 100) : 0;

  return { filled, total, percentage };
};

/**
 * Calculate form progress for PatientFormInput (schema-based)
 */
export const calculateFormProgressV2 = (formData: Partial<import('../schemas/patient.schema').PatientFormInput>): FormProgress => {
  const parameters = [
    formData.fullName,
    formData.dateOfBirth,
    formData.gender,
    formData.phone,
    formData.email,
    formData.height,
    formData.weight,
    formData.address?.street,
    formData.address?.city,
    formData.address?.postalCode,
    formData.emergencyContact?.fullName,
    formData.emergencyContact?.relationship,
    formData.emergencyContact?.phone,
    formData.emergencyContact?.email,
    formData.medicalHistory?.chronicConditions?.join(' '),
    formData.medicalHistory?.currentMedications?.join(' '),
    formData.medicalHistory?.allergies?.join(' '),
    formData.medicalHistory?.previousSurgeries?.join(' '),
    Array.isArray(formData.medicalHistory?.familyHistory)
      ? formData.medicalHistory.familyHistory.join(' ')
      : formData.medicalHistory?.familyHistory,
    // Vitals - count as one parameter
    formData.vitalSigns?.temperature ||
      formData.vitalSigns?.heartRate ||
      formData.vitalSigns?.systolicBP ||
      formData.vitalSigns?.diastolicBP ||
      formData.vitalSigns?.respiratoryRate ||
      formData.vitalSigns?.oxygenSaturation,
  ];

  const filled = parameters.filter(param => {
    if (typeof param === 'boolean') return param === true;
    if (typeof param === 'string') return param.trim() !== '';
    if (typeof param === 'number') return param !== 0;
    return param !== undefined && param !== null;
  }).length;

  const total = parameters.length;
  const percentage = total > 0 ? Math.round((filled / total) * 100) : 0;

  return { filled, total, percentage };
};

// ============================================================================
// DETAIL FORMATTING UTILITIES
// ============================================================================

/**
 * Formats a date to a readable string
 * Re-exports shared utility for backward compatibility
 */
export const formatDetailDate = (
  date: string | Date | undefined | null,
  format: 'long' | 'short' = 'long'
): string => {
  if (format === 'long') {
    return formatDetailDateShared(date);
  }
  // For short format, use the order date formatter
  return formatOrderDate(date, 'short');
};

/**
 * Formats an array of strings into a comma-separated list or returns fallback
 */
export const formatList = (items: string[] | undefined, fallback: string = 'None'): string => {
  const formatted = formatArray(items);
  return formatted || fallback;
};

/**
 * Formats familyHistory (string or string[] from API) for display
 */
export const formatFamilyHistory = (
  value: string | string[] | undefined,
  fallback: string = 'None'
): string => {
  if (value == null) return fallback;
  if (Array.isArray(value)) return formatList(value, fallback);
  return String(value).trim() || fallback;
};

/**
 * Formats an address into a single string
 */
export const formatAddress = (address: Patient['address']): string => {
  if (!address) return 'N/A';
  const parts = [address.street || 'N/A', address.city || '', address.postalCode || ''].filter(
    Boolean
  );
  return parts.join(', ') || 'N/A';
};

/**
 * Gets reportable orders (orders with validated tests)
 */
export const getReportableOrders = (orders: Order[]): Order[] => {
  return orders.filter(order => order.tests.some(test => test.status === 'validated'));
};

/**
 * Formats currency for display
 * Re-exports shared utility for backward compatibility
 */
export { formatCurrency as formatOrderPrice } from '@/shared/utils/data/currencyFormatters';
