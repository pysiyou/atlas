/**
 * Toast copy for quality issue outcomes — backed by feedback catalog + lab contract rules.
 */
import type { FeedbackId } from '@/types/generated/feedbackCatalog';
import {
  DEFAULT_QUALITY_ISSUE_SUCCESS_TOAST,
  QUALITY_ISSUE_SUCCESS_TOAST_RULES,
  type QualityIssueSuccessToastWhen,
} from '@/types/generated/labContract';
import { notify } from '@/utils/feedback';
import type { QualityIssueResult } from '@/types/lab-operations';

function matchesToastWhen(when: QualityIssueSuccessToastWhen, result: QualityIssueResult): boolean {
  if (when.escalationRequired === true && !result.escalationRequired) {
    return false;
  }
  if (when.hasRecollectionRequestId === true && !result.recollectionRequestId) {
    return false;
  }
  return true;
}

export function resolveQualityIssueSuccessToast(
  result?: QualityIssueResult | null
): { id: FeedbackId; overrides?: { subtitle?: string } } {
  if (!result) {
    return { id: DEFAULT_QUALITY_ISSUE_SUCCESS_TOAST };
  }

  for (const rule of QUALITY_ISSUE_SUCCESS_TOAST_RULES) {
    if (rule.remedy !== result.remedy) {
      continue;
    }
    if (!matchesToastWhen(rule.when, result)) {
      continue;
    }
    return {
      id: rule.feedbackId,
      overrides: result.message ? { subtitle: result.message } : undefined,
    };
  }

  return {
    id: DEFAULT_QUALITY_ISSUE_SUCCESS_TOAST,
    overrides: result.message ? { subtitle: result.message } : undefined,
  };
}

/** Show success toast for a quality-issue / rejection outcome. */
export function notifyQualityIssueSuccess(result?: QualityIssueResult | null): void {
  const { id, overrides } = resolveQualityIssueSuccessToast(result);
  notify.toast(id, overrides);
}
