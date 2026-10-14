import { describe, expect, it } from 'vitest';
import { parseQueryList, serializeQueryList } from './filtering';

describe('serializeQueryList', () => {
  it('returns undefined for empty lists', () => {
    expect(serializeQueryList(undefined)).toBeUndefined();
    expect(serializeQueryList([])).toBeUndefined();
    expect(serializeQueryList(['', '  '])).toBeUndefined();
  });

  it('joins unique trimmed values with commas', () => {
    expect(serializeQueryList(['pending', ' completed ', 'pending'])).toBe('pending,completed');
  });
});

describe('parseQueryList', () => {
  it('splits comma-separated query params', () => {
    expect(parseQueryList('pending,completed')).toEqual(['pending', 'completed']);
    expect(parseQueryList('  paid , unpaid  ')).toEqual(['paid', 'unpaid']);
  });

  it('returns an empty array for missing values', () => {
    expect(parseQueryList(null)).toEqual([]);
    expect(parseQueryList('')).toEqual([]);
  });
});
