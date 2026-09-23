/**
 * Patient Formatters
 * Pure formatting functions for patient data display
 */

import type { Patient, Order, Relationship } from '@/types';
import { RELATIONSHIP_CONFIG, RELATIONSHIP_VALUES } from '@/types';
import { formatDetailDate as formatDetailDateUtil, formatArrayWithFallback, formatOrderDate } from '@/utils';

export const formatPatientDetailDate = (
  date: string | Date | undefined | null,
  format: 'long' | 'short' = 'long'
): string => {
  if (format === 'long') {
    return formatDetailDateUtil(date);
  }
  return formatOrderDate(date, 'short');
};

/**
 * Formats an array of strings into a comma-separated list or returns fallback
 */
export const formatList = (items: string[] | undefined, fallback: string = 'None'): string => {
  return formatArrayWithFallback(items, fallback);
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
  return orders.filter(order => (order.tests ?? []).some(test => test.status === 'validated'));
};

/** WHO body-mass categories used on the care snapshot. */
export type BodyMassCategory = 'Underweight' | 'Normal' | 'Overweight' | 'Obese';

export interface BodyMassIndex {
  /** Rounded to one decimal place. */
  value: number;
  category: BodyMassCategory;
}

/**
 * Maps a BMI value to a clinical category.
 * Boundaries follow standard adult ranges: under 18.5, 18.5–24.9, 25–29.9, 30+.
 */
function categorizeBodyMassIndex(bmi: number): BodyMassCategory {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

/**
 * Calculates BMI from height (cm) and weight (kg).
 * Returns null when either measurement is missing or not a positive finite number.
 */
export function calculateBodyMassIndex(
  heightCm: number | null | undefined,
  weightKg: number | null | undefined
): BodyMassIndex | null {
  if (typeof heightCm !== 'number' || typeof weightKg !== 'number') return null;
  if (!Number.isFinite(heightCm) || !Number.isFinite(weightKg)) return null;
  if (heightCm <= 0 || weightKg <= 0) return null;

  const meters = heightCm / 100;
  const bmi = weightKg / (meters * meters);
  if (!Number.isFinite(bmi)) return null;

  const value = Math.round(bmi * 10) / 10;
  return { value, category: categorizeBodyMassIndex(value) };
}

/**
 * Formats a measurement with its unit, or "N/A" when the value is missing.
 */
export function formatMeasurement(
  value: number | null | undefined,
  unit: string
): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'N/A';
  return `${value} ${unit}`;
}

/**
 * Resolves an emergency-contact relationship to its display label.
 * Unknown values are returned as stored so unexpected API data still shows.
 */
export function formatRelationship(relationship: string | null | undefined): string {
  if (!relationship || relationship.trim() === '') return 'N/A';
  const known = RELATIONSHIP_VALUES as readonly string[];
  if (known.includes(relationship)) {
    return RELATIONSHIP_CONFIG[relationship as Relationship].label;
  }
  return relationship;
}

/**
 * Formats smoking and alcohol flags.
 * A missing lifestyle object stays "Not recorded" so an empty chart is not shown as "No".
 */
export function formatLifestyle(
  lifestyle: { smoking?: boolean | null; alcohol?: boolean | null } | null | undefined
): string {
  if (lifestyle == null) return 'Not recorded';

  const smoking = formatYesNo(lifestyle.smoking);
  const alcohol = formatYesNo(lifestyle.alcohol);
  return `Smoking ${smoking} · Alcohol ${alcohol}`;
}

/** Formats a boolean flag. Null and undefined stay "Not recorded". */
function formatYesNo(value: boolean | null | undefined): string {
  if (value == null) return 'Not recorded';
  return value ? 'Yes' : 'No';
}
