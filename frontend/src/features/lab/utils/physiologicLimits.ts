/**
 * Physiologic Limits — re-exports generated limits with validation helpers.
 */

export type { PhysiologicLimit } from '@/types/generated/physiologicLimits';
export { PHYSIOLOGIC_LIMITS } from '@/types/generated/physiologicLimits';

import type { PhysiologicLimit } from '@/types/generated/physiologicLimits';
import { PHYSIOLOGIC_LIMITS } from '@/types/generated/physiologicLimits';

export function getPhysiologicLimit(itemCode: string): PhysiologicLimit | undefined {
  if (PHYSIOLOGIC_LIMITS[itemCode]) return PHYSIOLOGIC_LIMITS[itemCode];
  const upperCode = itemCode.toUpperCase();
  for (const [key, limit] of Object.entries(PHYSIOLOGIC_LIMITS)) {
    if (key.toUpperCase() === upperCode) return limit;
  }
  for (const [key, limit] of Object.entries(PHYSIOLOGIC_LIMITS)) {
    if (
      key.toLowerCase().includes(itemCode.toLowerCase()) ||
      itemCode.toLowerCase().includes(key.toLowerCase())
    )
      return limit;
  }
  return undefined;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  limit?: PhysiologicLimit;
}

export function validatePhysiologicValue(
  itemCode: string,
  value: string | number
): ValidationResult {
  const limit = getPhysiologicLimit(itemCode);
  if (!limit) return { isValid: true };

  let numValue: number;
  if (typeof value === 'string') {
    numValue = parseFloat(value.replace(/^[<>]/, ''));
  } else {
    numValue = value;
  }

  if (Number.isNaN(numValue)) return { isValid: false, error: 'Value is not a valid number.', limit };
  if (numValue < limit.min)
    return {
      isValid: false,
      error: `Value ${numValue} is below physiologic minimum (${limit.min}). This value is not compatible with life.`,
      limit,
    };
  if (numValue > limit.max)
    return {
      isValid: false,
      error: `Value ${numValue} exceeds physiologic maximum (${limit.max}). This value is not compatible with life.`,
      limit,
    };
  return { isValid: true, limit };
}

export function isWithinPhysiologicLimits(itemCode: string, value: string | number): boolean {
  return validatePhysiologicValue(itemCode, value).isValid;
}
