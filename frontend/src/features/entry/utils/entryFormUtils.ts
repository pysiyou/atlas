/**
 * Entry form helper utilities for parameter display and validation.
 */

import type { TestParameter, Patient } from '@/types';
import { formatReferenceRange, isCriticalValue } from '@/features/lab/utils';

/** Title-case for option labels (first letter of each word capitalized) */
export const capitalizeOption = (s: string): string =>
  s
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

export const getReferenceRangeDisplay = (param: TestParameter, patient?: Patient): string => {
  if (param.catalogReferenceRange) {
    return formatReferenceRange(param.catalogReferenceRange, patient);
  }
  return param.referenceRange || 'N/A';
};

export const checkCriticalStatus = (param: TestParameter, value: string): boolean => {
  if (param.valueType !== 'NUMERIC' && param.type !== 'numeric') return false;
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return false;
  return isCriticalValue(numValue, { low: param.criticalLow, high: param.criticalHigh });
};
