/** Result entry analyte display and payload formatting. */
import type { AnalyteDefinition, CatalogReferenceRange, CriticalRange, Patient, OrderableTest } from '@/types';
import { formatReferenceRange, isCriticalValue } from '../utils';
import { notify } from '@/feedback';

export const getReferenceRangeDisplay = (analyte: AnalyteDefinition, patient?: Patient): string => {
  const range = analyte.reference_range as CatalogReferenceRange | null | undefined;
  if (range) {
    return formatReferenceRange(range, patient);
  }
  return 'N/A';
};

export const checkCriticalStatus = (analyte: AnalyteDefinition, value: string): boolean => {
  if (analyte.value_type !== 'NUMERIC') return false;
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return false;
  const crit = analyte.critical_range as CriticalRange | null | undefined;
  return isCriticalValue(numValue, crit ?? undefined);
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
    const code = analyte.analyte_code;
    const value = testResults[code]?.trim();
    if (!value) continue;

    if (analyte.value_type === 'SELECT' && analyte.allowed_values) {
      if (!analyte.allowed_values.includes(value)) {
        notify.show('lab.entry.selectInvalid');
        return null;
      }
    }

    if (analyte.value_type === 'NUMERIC') {
      const num = parseFloat(value);
      if (Number.isFinite(num)) {
        payload[code] = num;
        continue;
      }
    }

    payload[code] = value;
  }

  return payload;
}