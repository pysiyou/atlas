/** Result entry analyte display and payload formatting. */
import type { AnalyteDefinition, Patient, OrderableTest } from '@/types';
import { formatReferenceRange, isCriticalValue } from '../utils';
import { notify } from '@/feedback';

export const getReferenceRangeDisplay = (analyte: AnalyteDefinition, patient?: Patient): string => {
  if (analyte.catalogReferenceRange) {
    return formatReferenceRange(analyte.catalogReferenceRange, patient);
  }
  return analyte.referenceRange || 'N/A';
};

export const checkCriticalStatus = (analyte: AnalyteDefinition, value: string): boolean => {
  if (analyte.valueType !== 'NUMERIC' && analyte.type !== 'numeric') return false;
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return false;
  return isCriticalValue(numValue, { low: analyte.criticalLow, high: analyte.criticalHigh });
};

/**
 * Build the POST body for result entry: raw analyte values only.
 * SELECT options are checked here for inline UX; flags and units are owned by the server.
 */
export function toRawResultPayload(
  testResults: Record<string, string>,
  testDef: OrderableTest
): Record<string, string | number> | null {
  const payload: Record<string, string | number> = {};

  for (const analyte of testDef.analytes ?? []) {
    const value = testResults[analyte.code]?.trim();
    if (!value) continue;

    if ((analyte.valueType === 'SELECT' || analyte.type === 'select') && analyte.allowedValues) {
      if (!analyte.allowedValues.includes(value)) {
        notify.show('lab.entry.selectInvalid');
        return null;
      }
    }

    if (analyte.valueType === 'NUMERIC' || analyte.type === 'numeric') {
      const num = parseFloat(value);
      if (Number.isFinite(num)) {
        payload[analyte.code] = num;
        continue;
      }
    }

    payload[analyte.code] = value;
  }

  return payload;
}