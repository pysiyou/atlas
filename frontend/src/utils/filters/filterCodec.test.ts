import { describe, expect, it } from 'vitest';
import {
  buildFilteredUrl,
  decodeFiltersFromUrl,
  encodeFiltersToSearchParams,
  mergeUrlFiltersIntoValues,
  normalizeUrlFilterValue,
  pickUrlFiltersForPage,
} from './filterCodec';

describe('normalizeUrlFilterValue', () => {
  it('returns undefined for empty, null, and whitespace values', () => {
    expect(normalizeUrlFilterValue(null)).toBeUndefined();
    expect(normalizeUrlFilterValue(undefined)).toBeUndefined();
    expect(normalizeUrlFilterValue('')).toBeUndefined();
    expect(normalizeUrlFilterValue('   ')).toBeUndefined();
  });

  it('stringifies and trims numeric and string ids', () => {
    expect(normalizeUrlFilterValue(42)).toBe('42');
    expect(normalizeUrlFilterValue(' 7 ')).toBe('7');
  });
});

describe('decodeFiltersFromUrl', () => {
  it('decodes only allowed keys and ignores empty values', () => {
    const params = new URLSearchParams('patientId=12&orderId=&search=foo&testId=9');
    expect(decodeFiltersFromUrl(params, ['patientId', 'orderId', 'testId'])).toEqual({
      patientId: '12',
      testId: '9',
    });
  });
});

describe('encodeFiltersToSearchParams', () => {
  it('writes only provided allowed keys', () => {
    const params = encodeFiltersToSearchParams(
      { patientId: '1', orderId: '2', sampleId: '3' },
      ['patientId', 'orderId']
    );
    expect(params.get('patientId')).toBe('1');
    expect(params.get('orderId')).toBe('2');
    expect(params.get('sampleId')).toBeNull();
  });
});

describe('mergeUrlFiltersIntoValues', () => {
  it('overlays URL entity keys onto local filter values', () => {
    expect(
      mergeUrlFiltersIntoValues({ search: 'lab' }, { patientId: '4', orderId: '8' })
    ).toEqual({
      search: 'lab',
      patientId: '4',
      orderId: '8',
    });
  });
});

describe('buildFilteredUrl', () => {
  it('replaces entity filters and preserves unrelated params', () => {
    const preserved = new URLSearchParams('search=abc&patientId=old');
    expect(
      buildFilteredUrl('/laboratory/collection', { orderId: '15' }, { preserveParams: preserved })
    ).toBe('/laboratory/collection?search=abc&orderId=15');
  });

  it('returns the base path when no filters remain', () => {
    expect(buildFilteredUrl('/orders', {})).toBe('/orders');
  });
});

describe('pickUrlFiltersForPage', () => {
  it('keeps only keys allowed on the destination page', () => {
    expect(
      pickUrlFiltersForPage({ patientId: '1', orderId: '2', testId: '3' }, ['patientId', 'orderId'])
    ).toEqual({ patientId: '1', orderId: '2' });
  });
});
