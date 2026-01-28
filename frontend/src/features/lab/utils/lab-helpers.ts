/**
 * Lab Utility Functions
 *
 * Shared utility functions for lab workflow components.
 */

import toast from 'react-hot-toast';
import { printCollectionLabel } from '../collection/CollectionLabel';
import type { SampleDisplay } from '../types';

/**
 * Handle printing collection label with error handling
 */
export const handlePrintCollectionLabel = (display: SampleDisplay, patientName: string): void => {
  try {
    printCollectionLabel(display, patientName);
  } catch (error) {
    if (error instanceof Error) {
      toast.error(error.message);
    } else {
      toast.error('Failed to print label');
    }
  }
};

/**
 * Determine effective container type based on sample type
 */
export const getEffectiveContainerType = (
  actualContainerType: string | undefined,
  sampleType: string
): 'cup' | 'tube' => {
  if (actualContainerType === 'cup' || actualContainerType === 'tube') {
    return actualContainerType;
  }
  return sampleType === 'urine' || sampleType === 'stool' ? 'cup' : 'tube';
};

// Import ResultStatus from enums (single source of truth)
import type { ResultStatus } from '@/types/enums/result-status';
export type { ResultStatus };

const ABNORMAL_STATUSES: ResultStatus[] = [
  'high',
  'low',
  'critical',
  'critical-high',
  'critical-low',
];

/**
 * Check if a result status is critical
 */
export function isCritical(s: ResultStatus): boolean {
  return s === 'critical' || s === 'critical-high' || s === 'critical-low';
}

/**
 * Build result key -> status from test.flags.
 * Backend stores "itemCode:status" (e.g. "K:critical-high", "Na:low").
 */
export function statusMapFromFlags(
  flags: string[] | undefined
): Record<string, ResultStatus> {
  const map: Record<string, ResultStatus> = {};
  if (!flags?.length) return map;
  const valid = new Set(ABNORMAL_STATUSES);
  for (const f of flags) {
    const i = f.indexOf(':');
    if (i === -1) continue;
    const key = f.slice(0, i).trim();
    const status = f.slice(i + 1).trim().toLowerCase() as ResultStatus;
    if (key && valid.has(status)) map[key] = status;
  }
  return map;
}

/**
 * Parse a single result entry (value may be raw or { value, unit?, status? }).
 */
export function parseResultEntry(
  key: string,
  raw: unknown,
  flagStatusMap: Record<string, ResultStatus>
): { resultValue: string; unit: string; status: ResultStatus } {
  const obj =
    typeof raw === 'object' && raw !== null && 'value' in (raw as object)
      ? (raw as { value: unknown; unit?: string; status?: string })
      : null;
  const resultValue = obj ? String(obj.value) : String(raw);
  const unit = obj?.unit ?? '';
  const statusFromResult = obj?.status as ResultStatus | undefined;
  const status = flagStatusMap[key] ?? statusFromResult ?? 'normal';
  return { resultValue, unit, status };
}
