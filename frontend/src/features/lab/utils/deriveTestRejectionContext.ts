/**
 * Derives shared retest / recollection state from a TestWithContext.
 * Used by lab workflow cards and detail modals to avoid duplicated logic.
 */

import { LAB_CONFIG } from '@/features/lab/constants';
import type { RejectionRecord, TestWithContext } from '@/types';
import type { ResultRejectionRecord } from '@/types/order';
import { getResultRejectionType } from '@/types/order';

export interface TestRejectionContext {
  isRetest: boolean;
  retestNumber: number;
  resultRejectionHistory: ResultRejectionRecord[];
  lastResultRejection: ResultRejectionRecord | null;
  hasResultRejectionHistory: boolean;
  /** True when the last result rejection was type 're-collect' (validation flow). */
  isResultRecollection: boolean;

  isSampleRecollection: boolean;
  sampleRecollectionAttempt: number;
  sampleRejectionHistory: RejectionRecord[];
  lastSampleRejection: RejectionRecord | null;

  hasAnyRejectionHistory: boolean;

  showAttemptIndicator: boolean;
  attemptNumber: number;
  attemptMax: number;
  attemptType: 'retest' | 'recollection';
  previousReason?: string;

  showRetestBadge: boolean;
  showRecollectionBadge: boolean;

  rejectionHistoryTitle: string;
}

/**
 * Builds rejection/retest/recollection context for a test in the lab pipeline.
 */
export function deriveTestRejectionContext(test: TestWithContext): TestRejectionContext {
  const isRetest = test.isRetest === true;
  const retestNumber = test.retestNumber ?? 0;
  const resultRejectionHistory = test.resultRejectionHistory ?? [];
  const lastResultRejection = resultRejectionHistory.at(-1) ?? null;
  const hasResultRejectionHistory = resultRejectionHistory.length > 0;
  const isResultRecollection = lastResultRejection
    ? getResultRejectionType(lastResultRejection) === 're-collect'
    : false;

  const isSampleRecollection = test.sampleIsRecollection === true;
  const sampleRecollectionAttempt = test.sampleRecollectionAttempt ?? 1;
  const sampleRejectionHistory = test.sampleRejectionHistory ?? [];
  const lastSampleRejection = sampleRejectionHistory.at(-1) ?? null;

  const hasAnyRejectionHistory =
    isRetest || isSampleRecollection || hasResultRejectionHistory;

  const showAttemptIndicator = hasResultRejectionHistory && (isRetest || isResultRecollection);
  const attemptNumber = isRetest ? (test.retestNumber ?? 1) : resultRejectionHistory.length + 1;
  const attemptMax = isRetest
    ? LAB_CONFIG.MAX_RETEST_ATTEMPTS
    : LAB_CONFIG.MAX_RECOLLECTION_ATTEMPTS;
  const attemptType: 'retest' | 'recollection' = isRetest ? 'retest' : 'recollection';
  const previousReason = lastResultRejection?.rejectionReason ?? lastResultRejection?.reason;

  const showRetestBadge = isRetest && !!test.retestOfTestId;
  const showRecollectionBadge = isResultRecollection && !isRetest;

  const rejectionHistoryTitle = isRetest
    ? `Previous Rejection${resultRejectionHistory.length > 1 ? ` (${resultRejectionHistory.length} attempts)` : ''}`
    : `Recollection History (${resultRejectionHistory.length} attempt${resultRejectionHistory.length > 1 ? 's' : ''})`;

  return {
    isRetest,
    retestNumber,
    resultRejectionHistory,
    lastResultRejection,
    hasResultRejectionHistory,
    isResultRecollection,
    isSampleRecollection,
    sampleRecollectionAttempt,
    sampleRejectionHistory,
    lastSampleRejection,
    hasAnyRejectionHistory,
    showAttemptIndicator,
    attemptNumber,
    attemptMax,
    attemptType,
    previousReason,
    showRetestBadge,
    showRecollectionBadge,
    rejectionHistoryTitle,
  };
}
