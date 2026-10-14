import { describe, expect, it } from 'vitest';
import { inclusiveDateRangeBounds, isDateInInclusiveRange, toIsoDateParam } from './date';

describe('inclusiveDateRangeBounds', () => {
  it('returns null when no range is selected', () => {
    expect(inclusiveDateRangeBounds(null)).toBeNull();
  });

  it('normalizes start to midnight and end to end of day', () => {
    const start = new Date(2026, 9, 13, 14, 30);
    const end = new Date(2026, 9, 15, 8, 0);
    const bounds = inclusiveDateRangeBounds([start, end]);
    expect(bounds).not.toBeNull();
    expect(bounds?.start.getHours()).toBe(0);
    expect(bounds?.start.getMinutes()).toBe(0);
    expect(bounds?.end.getHours()).toBe(23);
    expect(bounds?.end.getMinutes()).toBe(59);
    expect(bounds?.end.getSeconds()).toBe(59);
  });
});

describe('isDateInInclusiveRange', () => {
  const range: [Date, Date] = [new Date(2026, 9, 13), new Date(2026, 9, 13)];

  it('matches everything when no range is set', () => {
    expect(isDateInInclusiveRange('2020-01-01', null)).toBe(true);
  });

  it('includes timestamps on the start and end calendar days', () => {
    expect(isDateInInclusiveRange('2026-10-13T00:15:00', range)).toBe(true);
    expect(isDateInInclusiveRange('2026-10-13T23:50:00', range)).toBe(true);
  });

  it('excludes dates outside the range and unparsable values', () => {
    expect(isDateInInclusiveRange('2026-10-12T23:00:00', range)).toBe(false);
    expect(isDateInInclusiveRange(undefined, range)).toBe(false);
    expect(isDateInInclusiveRange('not-a-date', range)).toBe(false);
  });
});

describe('toIsoDateParam', () => {
  it('formats a local date as yyyy-MM-dd', () => {
    expect(toIsoDateParam(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
