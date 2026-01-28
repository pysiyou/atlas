/**
 * Reference Range Checking Utilities
 * Enhanced to support demographic-specific ranges and critical value checking
 */

import type { ResultStatus } from '@/types/enums/result-status';
import type { CatalogReferenceRange, CriticalRange, TestParameter, Patient, Gender } from '@/types';

/**
 * Parse reference range string (e.g., "13.5-17.5", "<5.2", ">1.0")
 */
interface ParsedRange {
  min?: number;
  max?: number;
  type: 'range' | 'less-than' | 'greater-than' | 'text';
}

const parseReferenceRange = (range: string): ParsedRange => {
  // Check for less than (e.g., "<5.2")
  if (range.startsWith('<')) {
    return {
      max: parseFloat(range.slice(1)),
      type: 'less-than',
    };
  }

  // Check for greater than (e.g., ">1.0")
  if (range.startsWith('>')) {
    return {
      min: parseFloat(range.slice(1)),
      type: 'greater-than',
    };
  }

  // Check for range (e.g., "13.5-17.5")
  if (range.includes('-')) {
    const [minStr, maxStr] = range.split('-');
    return {
      min: parseFloat(minStr),
      max: parseFloat(maxStr),
      type: 'range',
    };
  }

  return { type: 'text' };
};

/**
 * Check if a value is within reference range
 * @param value - The test result value
 * @param referenceRange - The reference range string
 * @returns Status: 'normal', 'high', 'low', or 'critical'
 */
export const checkReferenceRange = (value: number, referenceRange: string): ResultStatus => {
  const parsed = parseReferenceRange(referenceRange);

  if (parsed.type === 'text') {
    return 'normal'; // Can't determine for text ranges
  }

  if (parsed.type === 'less-than') {
    if (parsed.max === undefined) return 'normal';
    return value < parsed.max ? 'normal' : 'high';
  }

  if (parsed.type === 'greater-than') {
    if (parsed.min === undefined) return 'normal';
    return value > parsed.min ? 'normal' : 'low';
  }

  if (parsed.type === 'range') {
    if (parsed.min === undefined || parsed.max === undefined) return 'normal';

    if (value < parsed.min) {
      // Check if critically low (less than 50% of minimum)
      if (value < parsed.min * 0.5) {
        return 'critical';
      }
      return 'low';
    }

    if (value > parsed.max) {
      // Check if critically high (more than 150% of maximum)
      if (value > parsed.max * 1.5) {
        return 'critical';
      }
      return 'high';
    }

    return 'normal';
  }

  return 'normal';
};

/**
 * Check if result is abnormal
 */
export const isAbnormal = (status: ResultStatus): boolean => {
  return status === 'high' || status === 'low' || status === 'critical';
};

/**
 * Check if result is critical
 */
export const isCritical = (status: ResultStatus): boolean => {
  return status === 'critical';
};

/**
 * Get applicable reference range based on patient demographics
 */
export interface ReferenceRangeDisplay {
  low?: number;
  high?: number;
  source: 'adult_male' | 'adult_female' | 'adult_general' | 'pediatric' | 'none';
}

/**
 * Calculate age from date of birth
 */
function calculateAge(dateOfBirth: string): number {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * Get patient-specific reference range from catalog structure
 */
export function getPatientSpecificRange(
  catalogRange: CatalogReferenceRange,
  patient?: Patient | { gender?: Gender; age?: number; dateOfBirth?: string }
): ReferenceRangeDisplay {
  // Calculate age if dateOfBirth is provided
  let age: number | undefined;
  if (patient) {
    if ('age' in patient && patient.age !== undefined) {
      age = patient.age;
    } else if ('dateOfBirth' in patient && patient.dateOfBirth) {
      age = calculateAge(patient.dateOfBirth);
    }
  }

  // Check for gender-specific ranges first
  if (patient?.gender === 'male' && catalogRange.adult_male) {
    return {
      ...catalogRange.adult_male,
      source: 'adult_male',
    };
  }

  if (patient?.gender === 'female' && catalogRange.adult_female) {
    return {
      ...catalogRange.adult_female,
      source: 'adult_female',
    };
  }

  // Check pediatric if age is available and patient is under 18
  if (age !== undefined && age < 18 && catalogRange.pediatric) {
    return {
      ...catalogRange.pediatric,
      source: 'pediatric',
    };
  }

  // Fall back to general adult range
  if (catalogRange.adult_general) {
    return {
      ...catalogRange.adult_general,
      source: 'adult_general',
    };
  }

  return { source: 'none' };
}

/**
 * Check if a numeric value is in critical range
 */
export function isCriticalValue(value: number, criticalRange?: CriticalRange): boolean {
  if (!criticalRange) return false;

  if (criticalRange.low !== undefined && value < criticalRange.low) {
    return true;
  }

  if (criticalRange.high !== undefined && value > criticalRange.high) {
    return true;
  }

  return false;
}

/**
 * Check reference range with demographic support and critical value detection
 */
export function checkReferenceRangeWithDemographics(
  value: number,
  parameter: TestParameter,
  patient?: Patient | { gender?: Gender; age?: number }
): ResultStatus {
  // Check critical range first
  if (parameter.criticalLow !== undefined && value < parameter.criticalLow) {
    return 'critical';
  }

  if (parameter.criticalHigh !== undefined && value > parameter.criticalHigh) {
    return 'critical';
  }

  // Check catalog reference range if available
  if (parameter.catalogReferenceRange) {
    const range = getPatientSpecificRange(parameter.catalogReferenceRange, patient);

    if (range.low !== undefined && value < range.low) {
      // Check if critically low (less than 50% of minimum)
      if (parameter.criticalLow !== undefined && value < parameter.criticalLow) {
        return 'critical';
      }
      return 'low';
    }

    if (range.high !== undefined && value > range.high) {
      // Check if critically high (more than 150% of maximum)
      if (parameter.criticalHigh !== undefined && value > parameter.criticalHigh) {
        return 'critical';
      }
      return 'high';
    }

    return 'normal';
  }

  // Fall back to legacy string-based range checking
  return checkReferenceRange(value, parameter.referenceRange);
}

/**
 * Format reference range for display with demographic context
 */
export function formatReferenceRange(
  range: CatalogReferenceRange | ReferenceRangeDisplay,
  demographics?: { gender?: Gender; age?: number; dateOfBirth?: string }
): string {
  // Handle ReferenceRangeDisplay (already resolved)
  if ('source' in range && range.source !== 'none') {
    if (range.low !== undefined && range.high !== undefined) {
      return `${range.low}-${range.high}`;
    }
    if (range.low !== undefined) {
      return `>${range.low}`;
    }
    if (range.high !== undefined) {
      return `<${range.high}`;
    }
    return 'N/A';
  }

  // Handle CatalogReferenceRange (needs resolution)
  if ('adult_general' in range || 'adult_male' in range || 'adult_female' in range) {
    const resolved = getPatientSpecificRange(range as CatalogReferenceRange, demographics);
    if (resolved.low !== undefined && resolved.high !== undefined) {
      return `${resolved.low}-${resolved.high}`;
    }
    if (resolved.low !== undefined) {
      return `>${resolved.low}`;
    }
    if (resolved.high !== undefined) {
      return `<${resolved.high}`;
    }
  }

  return 'N/A';
}
