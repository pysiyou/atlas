/** Result entry parameter display and payload formatting. */
/**
 * Entry form helper utilities for parameter display and validation.
 */
import type { TestParameter, Patient, TestWithContext, Test } from '@/types';
import { formatReferenceRange, isCriticalValue } from '../utils';
import { notify } from '@/utils/feedback';

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

/**
 * Build the POST body for result entry: raw parameter values only.
 * SELECT options are checked here for inline UX; flags and units are owned by the server.
 */
export function toRawResultPayload(
  testResults: Record<string, string>,
  testDef: Test
): Record<string, string | number> | null {
  const payload: Record<string, string | number> = {};

  for (const param of testDef.parameters ?? []) {
    const value = testResults[param.code]?.trim();
    if (!value) continue;

    if ((param.valueType === 'SELECT' || param.type === 'select') && param.allowedValues) {
      if (!param.allowedValues.includes(value)) {
        notify.toast('lab.entry.selectInvalid', {
          title: `${param.name}: Invalid value. Must be one of: ${param.allowedValues.join(', ')}`,
        });
        return null;
      }
    }

    if (param.valueType === 'NUMERIC' || param.type === 'numeric') {
      const numValue = parseFloat(value);
      payload[param.code] = Number.isNaN(numValue) ? value : numValue;
    } else {
      payload[param.code] = value;
    }
  }

  return payload;
}

export function findTestById(
  allTests: TestWithContext[],
  orderTestId: number
): TestWithContext | undefined {
  return allTests.find(t => t.id === orderTestId);
}

