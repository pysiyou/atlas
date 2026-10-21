import { describe, expect, it } from 'vitest';
import { DEFAULT_EVENT_LOG_USER_FILTERS, type EventLogUserFilters } from './types';
import { decodeEventLogUrlFilters, writeEventLogUrlFilters } from './eventLogUrlCodec';

describe('eventLogUrlCodec', () => {
  it('round-trips user filters and record id', () => {
    const userFilters: EventLogUserFilters = {
      ...DEFAULT_EVENT_LOG_USER_FILTERS,
      kinds: ['order'],
      search: 'hemoglobin',
      actorSearch: 'jdoe',
      actorRoles: ['administrator'],
      includeAccess: true,
      verbosity: 'detailed',
      dateRange: [
        new Date(Date.UTC(2026, 0, 1)),
        new Date(Date.UTC(2026, 0, 31)),
      ] as [Date, Date],
      orderId: null,
      testId: null,
      sampleId: null,
      patientId: null,
    };
    const recordIdInput = 'ORD-42';

    const params = new URLSearchParams();
    writeEventLogUrlFilters(params, userFilters, recordIdInput);

    const decoded = decodeEventLogUrlFilters(params);
    expect(decoded.recordIdInput).toBe(recordIdInput);
    expect(decoded.userFilters.kinds).toEqual(userFilters.kinds);
    expect(decoded.userFilters.search).toBe('hemoglobin');
    expect(decoded.userFilters.actorSearch).toBe('jdoe');
    expect(decoded.userFilters.actorRoles).toEqual(['administrator']);
    expect(decoded.userFilters.includeAccess).toBe(true);
    expect(decoded.userFilters.verbosity).toBe('detailed');
    expect(decoded.userFilters.dateRange).not.toBeNull();
    expect(params.get('eventDateFrom')).toBeTruthy();
    expect(params.get('eventDateTo')).toBeTruthy();
  });

  it('ignores unknown params and uses defaults for missing keys', () => {
    const params = new URLSearchParams('foo=bar&eventSearch=alpha');
    const decoded = decodeEventLogUrlFilters(params);
    expect(decoded.userFilters.search).toBe('alpha');
    expect(decoded.userFilters.kinds).toEqual(DEFAULT_EVENT_LOG_USER_FILTERS.kinds);
    expect(decoded.recordIdInput).toBe('');
  });

  it('clears prior event keys on write', () => {
    const params = new URLSearchParams('eventSearch=old&eventKinds=order');
    writeEventLogUrlFilters(params, DEFAULT_EVENT_LOG_USER_FILTERS, '');
    expect(params.get('eventSearch')).toBeNull();
    expect(params.get('eventKinds')).toBeNull();
  });
});
