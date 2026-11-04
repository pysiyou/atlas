import { describe, expect, it } from 'vitest';
import { resolveQualityIssueSuccessToast } from './qualityIssueToastMessages';
import type { QualityIssueResult } from '@/types/lab-operations';

const base: QualityIssueResult = {
  success: true,
  remedy: 'request_recollection',
  message: '',
  qualityIssueId: 1,
  orderId: 1,
  escalationRequired: false,
};

describe('resolveQualityIssueSuccessToast', () => {
  it('maps recollection with new sample to Recollection scheduled toast', () => {
    expect(
      resolveQualityIssueSuccessToast({ ...base, createdSampleId: 99 })
    ).toBe('lab.qualityIssue.recollection.requested');
  });

  it('maps reject-only recollection remedy without new sample to rejected toast', () => {
    expect(resolveQualityIssueSuccessToast({ ...base })).toBe('lab.qualityIssue.specimenRejected');
  });

  it('maps retry_same_sample to retest scheduled', () => {
    expect(
      resolveQualityIssueSuccessToast({
        ...base,
        remedy: 'retry_same_sample',
      })
    ).toBe('lab.qualityIssue.retest');
  });

  it('maps escalate with re-test limit message to retest escalated', () => {
    expect(
      resolveQualityIssueSuccessToast({
        ...base,
        remedy: 'escalate',
        escalationRequired: true,
        message: 'Re-test limit reached.',
      })
    ).toBe('lab.qualityIssue.retest.limitHit');
  });

  it('maps escalate with escalationRequired to generic limit toast', () => {
    expect(
      resolveQualityIssueSuccessToast({
        ...base,
        remedy: 'escalate',
        escalationRequired: true,
        message: 'Recollection limit reached.',
      })
    ).toBe('lab.qualityIssue.escalate.limitHit');
  });

  it('maps cancel to cancelled toast', () => {
    expect(
      resolveQualityIssueSuccessToast({
        ...base,
        remedy: 'cancel',
      })
    ).toBe('lab.qualityIssue.cancelled');
  });
});
