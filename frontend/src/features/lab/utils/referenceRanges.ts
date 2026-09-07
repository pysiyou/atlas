/**
 * Reference Range Checking Utilities
 */

import type { ResultStatus } from '@/types/enums';
import type { CatalogReferenceRange, CriticalRange, TestParameter, Patient, Gender } from '@/types';
import { calculateAge } from '@/utils/string';

interface ParsedRange {
  min?: number;
  max?: number;
  type: 'range' | 'less-than' | 'greater-than' | 'text';
}

const parseReferenceRange = (range: string): ParsedRange => {
  if (range.startsWith('<')) return { max: parseFloat(range.slice(1)), type: 'less-than' };
  if (range.startsWith('>')) return { min: parseFloat(range.slice(1)), type: 'greater-than' };
  const rangeMatch = range.match(/^\s*(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*$/);
  if (rangeMatch) {
    const min = parseFloat(rangeMatch[1]);
    const max = parseFloat(rangeMatch[2]);
    if (Number.isFinite(min) && Number.isFinite(max)) return { min, max, type: 'range' };
  }
  return { type: 'text' };
};

export const checkReferenceRange = (value: number, referenceRange: string): ResultStatus => {
  if (Number.isNaN(value)) return 'normal';
  const parsed = parseReferenceRange(referenceRange);
  if (parsed.type === 'text') return 'normal';
  if (parsed.type === 'less-than') {
    if (parsed.max === undefined || Number.isNaN(parsed.max)) return 'normal';
    return value < parsed.max ? 'normal' : 'high';
  }
  if (parsed.type === 'greater-than') {
    if (parsed.min === undefined || Number.isNaN(parsed.min)) return 'normal';
    return value > parsed.min ? 'normal' : 'low';
  }
  if (parsed.type === 'range') {
    if (parsed.min === undefined || parsed.max === undefined) return 'normal';
    if (value < parsed.min) return value < parsed.min * 0.5 ? 'critical' : 'low';
    if (value > parsed.max) return value > parsed.max * 1.5 ? 'critical' : 'high';
    return 'normal';
  }
  return 'normal';
};


export interface ReferenceRangeDisplay {
  low?: number;
  high?: number;
  source: 'adult_male' | 'adult_female' | 'adult_general' | 'pediatric' | 'none';
}

export function getPatientSpecificRange(
  catalogRange: CatalogReferenceRange,
  patient?: Patient | { gender?: Gender; age?: number; dateOfBirth?: string }
): ReferenceRangeDisplay {
  let age: number | undefined;
  if (patient) {
    if ('age' in patient && patient.age !== undefined) age = patient.age;
    else if ('dateOfBirth' in patient && patient.dateOfBirth) age = calculateAge(patient.dateOfBirth);
  }
  if (patient?.gender === 'male' && catalogRange.adult_male)
    return { ...catalogRange.adult_male, source: 'adult_male' };
  if (patient?.gender === 'female' && catalogRange.adult_female)
    return { ...catalogRange.adult_female, source: 'adult_female' };
  if (age !== undefined && age < 18 && catalogRange.pediatric)
    return { ...catalogRange.pediatric, source: 'pediatric' };
  if (catalogRange.adult_general) return { ...catalogRange.adult_general, source: 'adult_general' };
  return { source: 'none' };
}

export function isCriticalValue(value: number, criticalRange?: CriticalRange): boolean {
  if (!criticalRange) return false;
  if (criticalRange.low !== undefined && value < criticalRange.low) return true;
  if (criticalRange.high !== undefined && value > criticalRange.high) return true;
  return false;
}

export function checkReferenceRangeWithDemographics(
  value: number,
  parameter: TestParameter,
  patient?: Patient | { gender?: Gender; age?: number }
): ResultStatus {
  if (parameter.criticalLow !== undefined && value < parameter.criticalLow) return 'critical';
  if (parameter.criticalHigh !== undefined && value > parameter.criticalHigh) return 'critical';
  if (parameter.catalogReferenceRange) {
    const range = getPatientSpecificRange(parameter.catalogReferenceRange, patient);
    if (range.low !== undefined && value < range.low) return 'low';
    if (range.high !== undefined && value > range.high) return 'high';
    return 'normal';
  }
  return checkReferenceRange(value, parameter.referenceRange);
}

export function formatReferenceRange(
  range: CatalogReferenceRange | ReferenceRangeDisplay,
  demographics?: { gender?: Gender; age?: number; dateOfBirth?: string }
): string {
  if ('source' in range && range.source !== 'none') {
    if (range.low !== undefined && range.high !== undefined) return `${range.low}-${range.high}`;
    if (range.low !== undefined) return `>${range.low}`;
    if (range.high !== undefined) return `<${range.high}`;
    return 'N/A';
  }
  if ('adult_general' in range || 'adult_male' in range || 'adult_female' in range) {
    const resolved = getPatientSpecificRange(range as CatalogReferenceRange, demographics);
    if (resolved.low !== undefined && resolved.high !== undefined)
      return `${resolved.low}-${resolved.high}`;
    if (resolved.low !== undefined) return `>${resolved.low}`;
    if (resolved.high !== undefined) return `<${resolved.high}`;
  }
  return 'N/A';
}
