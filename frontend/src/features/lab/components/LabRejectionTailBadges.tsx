/**
 * Rejection / retest / recollection badges — always last on card and modal badge rows.
 * Order: link badge (re-test of / recollection of) → attempt indicator (2/3).
 */

import type { BadgeSize } from '@/components/primitives';
import type { Sample } from '@/types';
import { AttemptIndicator } from './LabAttemptIndicators';
import { RecollectionOfBadge } from './LabLineageBadges';
import { RetestOfBadge } from './LabLineageBadges';
import { deriveRetestContextFromRow } from '../utils/deriveRetestContext';
import type { LabOrderTestQueueRow } from '../types/labQueueChrome';
import { LAB_CONFIG } from '../constants';

export interface LabRejectionTailBadgesProps {
  retestOfTestId?: number | null;
  originalSampleId?: number | null;
  showRetestLink?: boolean;
  showRecollectionLink?: boolean;
  attemptNumber: number;
  maxAttempts: number;
  attemptType: 'retest' | 'recollection';
  previousReason?: string;
  size?: BadgeSize;
}

export function LabRejectionTailBadges({
  retestOfTestId,
  originalSampleId,
  showRetestLink = false,
  showRecollectionLink = false,
  attemptNumber,
  maxAttempts,
  attemptType,
  previousReason,
  size,
}: LabRejectionTailBadgesProps) {
  const showAttempt = attemptNumber > 1;
  const hasLink =
    (showRetestLink && retestOfTestId != null) ||
    (showRecollectionLink && originalSampleId != null);

  if (!hasLink && !showAttempt) return null;

  return (
    <>
      {showRetestLink && retestOfTestId != null && (
        <RetestOfBadge retestOfTestId={retestOfTestId} size={size} />
      )}
      {showRecollectionLink && originalSampleId != null && (
        <RecollectionOfBadge originalSampleId={originalSampleId} size={size} />
      )}
      {showAttempt && (
        <AttemptIndicator
          attemptNumber={attemptNumber}
          maxAttempts={maxAttempts}
          type={attemptType}
          previousReason={previousReason}
        />
      )}
    </>
  );
}

export function LabRejectionTailBadgesFromWorkItem({ row, previousReason, size }: {
  row: LabOrderTestQueueRow;
  previousReason?: string;
  size?: BadgeSize;
}) {
  const ctx = deriveRetestContextFromRow(row);
  if (!ctx.showAttemptIndicator && !ctx.showRetestBadge && !ctx.showRecollectionLink) {
    return null;
  }

  return (
    <LabRejectionTailBadges
      retestOfTestId={row.retestOfTestId}
      originalSampleId={row.sampleOriginalSampleId}
      showRetestLink={ctx.showRetestBadge}
      showRecollectionLink={ctx.showRecollectionLink}
      attemptNumber={ctx.attemptNumber}
      maxAttempts={ctx.attemptMax}
      attemptType={ctx.attemptType}
      previousReason={previousReason}
      size={size}
    />
  );
}

export function LabRejectionTailBadgesFromSample({ sample, size }: {
  sample: Sample;
  size?: BadgeSize;
}) {
  if (!sample.isRecollection) return null;

  return (
    <LabRejectionTailBadges
      originalSampleId={sample.originalSampleId}
      showRecollectionLink={sample.originalSampleId != null}
      attemptNumber={sample.recollectionAttempt ?? 1}
      maxAttempts={LAB_CONFIG.MAX_RECOLLECTION_ATTEMPTS}
      attemptType="recollection"
      previousReason={sample.recollectionReason}
      size={size}
    />
  );
}
