/**
 * Rejection / retest / recollection badges — always last on card and modal badge rows.
 * Order: link badge (re-test of / recollection of) → attempt indicator (2/3).
 */

import React from 'react';
import type { BadgeSize } from '@/components';
import type { Sample, TestWithContext } from '@/types';
import { AttemptIndicator } from './AttemptIndicator';
import { RecollectionOfBadge } from './RecollectionOfBadge';
import { RetestOfBadge } from './RetestOfBadge';
import { deriveRetestContext } from '../utils/deriveRetestContext';
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

export const LabRejectionTailBadges: React.FC<LabRejectionTailBadgesProps> = ({
  retestOfTestId,
  originalSampleId,
  showRetestLink = false,
  showRecollectionLink = false,
  attemptNumber,
  maxAttempts,
  attemptType,
  previousReason,
  size,
}) => {
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
};

export const LabRejectionTailBadgesFromTest: React.FC<{
  test: TestWithContext;
  previousReason?: string;
  size?: BadgeSize;
}> = ({ test, previousReason, size }) => {
  const ctx = deriveRetestContext(test);
  if (!ctx.showAttemptIndicator && !ctx.showRetestBadge && !ctx.showRecollectionLink) {
    return null;
  }

  return (
    <LabRejectionTailBadges
      retestOfTestId={test.retestOfTestId}
      originalSampleId={test.sampleOriginalSampleId}
      showRetestLink={ctx.showRetestBadge}
      showRecollectionLink={ctx.showRecollectionLink}
      attemptNumber={ctx.attemptNumber}
      maxAttempts={ctx.attemptMax}
      attemptType={ctx.attemptType}
      previousReason={previousReason}
      size={size}
    />
  );
};

export const LabRejectionTailBadgesFromSample: React.FC<{
  sample: Sample;
  size?: BadgeSize;
}> = ({ sample, size }) => {
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
};
