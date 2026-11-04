import { describe, expect, it } from 'vitest';
import {
  buildEventLogHeadline,
  type EventLogHeadlineContext,
  validationRejectTrailingAction,
} from './catalog';
import type { EventLogRecord } from './types';

const labContext: EventLogHeadlineContext = {
  getTestName: code => (code === 'HCG' ? 'Pregnancy Test (Urine hCG)' : 'Glucose (Fasting)'),
  getPatientName: (id: number) => `patient-${id}`,
};

function labActor(name = 'Chantal Ndongo'): EventLogRecord['actorSnapshot'] {
  return { userId: 42, name, role: 'lab_technician' };
}

function baseRecord(overrides: Partial<EventLogRecord> & Pick<EventLogRecord, 'eventType'>): EventLogRecord {
  return {
    eventId: '00000000-0000-4000-8000-000000000001',
    createdAt: '2026-01-01T12:00:00.000Z',
    actorSnapshot: labActor(),
    targetType: 'sample',
    targetId: 167,
    orderId: 73,
    ...overrides,
  };
}

function headlineText(record: EventLogRecord): string {
  return buildEventLogHeadline(record, labContext).parts.map(p => p.text).join('');
}

function primaryTexts(record: EventLogRecord): string[] {
  return buildEventLogHeadline(record, labContext).parts.filter(p => p.main).map(p => p.text);
}

describe('lab audit headlines', () => {
  it('sample collect matches canonical sample template', () => {
    const record = baseRecord({ eventType: 'laboratory.sample.collect' });
    expect(headlineText(record)).toBe(
      'Sample #sam0167 collected for order #ord0073 by Chantal Ndongo'
    );
    expect(primaryTexts(record)).toEqual([
      'Sample #sam0167',
      'order #ord0073',
      'Chantal Ndongo',
    ]);
  });

  it('sample reject uses for order not on order', () => {
    const record = baseRecord({
      eventType: 'laboratory.sample.reject',
      metadata: { rejection_reason: 'hemolyzed' },
    });
    const text = headlineText(record);
    expect(text).toContain('Sample #sam0167 rejected for order #ord0073');
    expect(text).not.toContain(' on order ');
    expect(text).toContain('Reason: hemolyzed');
  });

  it('recollect request uses sample-first wording', () => {
    const record = baseRecord({ eventType: 'laboratory.sample.recollect_request' });
    expect(headlineText(record)).toBe(
      'Sample #sam0167 recollection requested for order #ord0073 by Chantal Ndongo'
    );
  });

  it('result enter uses order-test template', () => {
    const record = baseRecord({
      eventType: 'laboratory.result.enter',
      targetType: 'order_test',
      targetId: 501,
      testId: 501,
      metadata: { test_code: 'GLU' },
    });
    expect(headlineText(record)).toBe(
      'Results for test Glucose (Fasting) on order #ord0073 recorded by Chantal Ndongo'
    );
    expect(primaryTexts(record)).toEqual([
      'test',
      'Glucose (Fasting)',
      'order #ord0073',
      'Chantal Ndongo',
    ]);
  });

  it('validation reject states rejected with remedy and catalog reason label', () => {
    const record = baseRecord({
      eventType: 'laboratory.validation.reject',
      targetType: 'order_test',
      targetId: 501,
      testId: 501,
      metadata: {
        test_code: 'HCG',
        reason: 'lipemic',
        remedy: 'request_recollection',
      },
    });
    const text = headlineText(record);
    expect(text).toContain(
      'Results for test Pregnancy Test (Urine hCG) on order #ord0073 rejected with recollection requested'
    );
    expect(text).toContain('Reason: Lipemic sample');
    expect(text).not.toContain('returned for correction');
  });

  it('validation reject retest on same sample remedy', () => {
    const record = baseRecord({
      eventType: 'laboratory.validation.reject',
      targetType: 'order_test',
      targetId: 501,
      testId: 501,
      metadata: { test_code: 'GLU', reason: 'delta_check_failure_repeat_run', remedy: 'retry_same_sample' },
    });
    expect(headlineText(record)).toContain('rejected for retest on same sample');
    expect(validationRejectTrailingAction(record)).toBe('rejected for retest on same sample');
  });

  it('validation reject escalation remedy', () => {
    const record = baseRecord({
      eventType: 'laboratory.validation.reject',
      targetType: 'order_test',
      targetId: 501,
      testId: 501,
      metadata: { test_code: 'GLU', reason: 'qc_control_failure', remedy: 'escalate' },
    });
    expect(headlineText(record)).toContain('rejected and escalated');
  });

  it('validation reject on sample uses sample template', () => {
    const record = baseRecord({
      eventType: 'laboratory.validation.reject',
      targetType: 'sample',
      targetId: 167,
      metadata: { reason: 'lipemic', remedy: 'request_recollection' },
    });
    const text = headlineText(record);
    expect(text).toContain('Sample #sam0167 rejected with recollection requested for order #ord0073');
    expect(text).not.toContain('Results for test');
    expect(text).toContain('Reason: Lipemic sample');
  });
});
