/**
 * Affiliation Utility Functions
 * Pure functions for affiliation management
 */

import type { Affiliation, AffiliationDuration } from '@/types';

/**
 * Generate unique assurance number
 */
export const generateAssuranceNumber = (): string => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
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
