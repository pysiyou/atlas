/**
 * Pure helpers for CollectionRejectionPopover.
 */

import type { RejectionReason } from '@/types';
import { REJECTION_REASON_CONFIG, REJECTION_REASON_VALUES } from '@/types/enums';

export const REJECTION_REASONS = REJECTION_REASON_VALUES.map(value => ({
  value,
  label: REJECTION_REASON_CONFIG[value].label,
  description: REJECTION_REASON_CONFIG[value].description,
}));

export function parseNumericSampleId(sampleId: string): number | undefined {
  return typeof sampleId === 'string' && /^\d+$/.test(sampleId)
    ? parseInt(sampleId, 10)
    : undefined;
}

export function isRejectionFormValid(reasons: RejectionReason[], notes: string): boolean {
  return reasons.length > 0 && (!reasons.includes('other') || Boolean(notes.trim()));
}

export function toggleRejectionReason(
  reasons: RejectionReason[],
  value: RejectionReason
): RejectionReason[] {
  return reasons.includes(value) ? reasons.filter(r => r !== value) : [...reasons, value];
}
