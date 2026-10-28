/**
 * Lab Formatters
 * Pure formatting functions for lab data display
 */

import type { RejectedSample, Sample } from '@/types';
import { resolveRejectionReasonLabel } from '@/types/generated/rejectionReasonRegistry';

/**
 * Format rejection reasons for display
 */
export const formatRejectionReasons = (reasons: string[] | undefined): string | null => {
  if (!reasons || reasons.length === 0) return null;
  return reasons.map(r => resolveRejectionReasonLabel(r)).join(', ');
};

/** Backend may expose a single rejectionReason string instead of rejectionReasons[]. */
type SampleWithOptionalRejectionReason = Sample & { rejectionReason?: string | null };

/**
 * Human-readable rejection reason for a sample (rejected samples only).
 */
export const getSampleRejectionReasonLabel = (sample: Sample): string | null => {
  if (sample.status !== 'rejected') return null;
  const fromList = formatRejectionReasons((sample as RejectedSample).rejectionReasons);
  if (fromList) return fromList;
  const singular = (sample as SampleWithOptionalRejectionReason).rejectionReason;
  if (singular?.trim()) return resolveRejectionReasonLabel(singular);
  return null;
};
