/**
 * Toast copy for quality issue outcomes — maps API {@link QualityIssueResult} to catalog ids.
 */
import type { FeedbackId } from '@/types/generated/feedback';
import { DEFAULT_QUALITY_ISSUE_SUCCESS_TOAST } from '@/types/generated/policies';
import { notify } from '@/feedback';
import type { QualityIssueResult } from '@/types';
import { VALIDATION_REMEDY_WIRES } from '@/types/generated/policies';

const RETRY_SAME_SAMPLE_WIRE = VALIDATION_REMEDY_WIRES[0];
const REQUEST_RECOLLECTION_WIRE = VALIDATION_REMEDY_WIRES[1];

/**
 * Pick catalog toast id from remedy outcome (recollection vs reject-only, retest vs escalate).
 */
export function resolveQualityIssueSuccessToast(result?: QualityIssueResult | null): FeedbackId {
  if (!result) {
    return DEFAULT_QUALITY_ISSUE_SUCCESS_TOAST;
  }

  const { remedy, escalationRequired, createdSampleId } = result;

  if (remedy === REQUEST_RECOLLECTION_WIRE) {
    return createdSampleId != null
      ? 'lab.qualityIssue.recollection.requested'
      : 'lab.qualityIssue.specimenRejected';
  }

  if (remedy === RETRY_SAME_SAMPLE_WIRE) {
    return escalationRequired ? 'lab.qualityIssue.retest.limitHit' : 'lab.qualityIssue.retest';
  }

  if (remedy === 'escalate') {
    return escalationRequired ? 'lab.qualityIssue.escalate.limitHit' : 'lab.qualityIssue.escalate';
  }

  if (remedy === 'cancel') {
    return 'lab.qualityIssue.cancelled';
  }

  return DEFAULT_QUALITY_ISSUE_SUCCESS_TOAST;
}

/** Show success toast for a quality-issue / rejection outcome. */
export function notifyQualityIssueSuccess(result?: QualityIssueResult | null): void {
  notify.show(resolveQualityIssueSuccessToast(result));
}
