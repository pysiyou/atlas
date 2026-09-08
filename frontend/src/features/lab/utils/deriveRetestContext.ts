/**
 * Derives retest / recollection display state from a TestWithContext.
 */
import { LAB_CONFIG } from '@/features/lab/constants';
import type { TestWithContext } from '@/types';

export interface TestRetestContext {
  isRetest: boolean;
  retestNumber: number;
  isSampleRecollection: boolean;
  sampleRecollectionAttempt: number;
  showAttemptIndicator: boolean;
  attemptNumber: number;
  attemptMax: number;
  attemptType: 'retest' | 'recollection';
  showRetestBadge: boolean;
  showRecollectionBadge: boolean;
}

export function deriveRetestContext(test: TestWithContext): TestRetestContext {
  const isRetest = test.isRetest === true;
  const retestNumber = test.retestNumber ?? 0;
  const isSampleRecollection = test.sampleIsRecollection === true;
  const sampleRecollectionAttempt = test.sampleRecollectionAttempt ?? 1;

  const showAttemptIndicator = isRetest || isSampleRecollection;
  const attemptNumber = isRetest ? retestNumber || 1 : sampleRecollectionAttempt;
  const attemptMax = isRetest
    ? LAB_CONFIG.MAX_RETEST_ATTEMPTS
    : LAB_CONFIG.MAX_RECOLLECTION_ATTEMPTS;
  const attemptType: 'retest' | 'recollection' = isRetest ? 'retest' : 'recollection';

  return {
    isRetest,
    retestNumber,
    isSampleRecollection,
    sampleRecollectionAttempt,
    showAttemptIndicator,
    attemptNumber,
    attemptMax,
    attemptType,
    showRetestBadge: isRetest && !!test.retestOfTestId,
    showRecollectionBadge: isSampleRecollection && !isRetest,
  };
}
