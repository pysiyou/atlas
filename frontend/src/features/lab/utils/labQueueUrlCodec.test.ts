import { describe, expect, it } from 'vitest';
import {
  decodeLabQueueBarFilters,
  migrateLegacyLabEntitySearchParams,
  writeLabQueueBarFilters,
  type LabQueueBarFilters,
} from './labQueueUrlCodec';

describe('labQueueUrlCodec', () => {
  const collectionDefaults = ['pending'] as const;
  const validationDefaults = ['low', 'medium', 'high', 'urgent'];

  it('uses default statuses when status param is absent', () => {
    const params = new URLSearchParams();
    const decoded = decodeLabQueueBarFilters(params, 'collection', collectionDefaults);
    expect(decoded.statusFilters).toEqual(['pending']);
  });

  it('parses empty status CSV as empty selection', () => {
    const params = new URLSearchParams('status=');
    const decoded = decodeLabQueueBarFilters(params, 'collection', collectionDefaults);
    expect(decoded.statusFilters).toEqual([]);
  });

  it('round-trips collection bar filters including status', () => {
    const params = new URLSearchParams();
    const filters: LabQueueBarFilters = {
      searchQuery: 'SAM0001',
      dateRange: [new Date(2024, 0, 15), new Date(2024, 0, 20)],
      sampleTypeFilters: ['blood', 'urine'],
      statusFilters: ['pending', 'collected'],
    };
    writeLabQueueBarFilters(params, filters, 'collection');
    expect(params.get('search')).toBe('SAM0001');
    expect(params.get('sampleType')).toBe('blood,urine');
    expect(params.get('status')).toBe('pending,collected');
    expect(params.get('dateFrom')).toBe('2024-01-15');
    expect(params.get('dateTo')).toBe('2024-01-20');

    const decoded = decodeLabQueueBarFilters(params, 'collection', collectionDefaults);
    expect(decoded.searchQuery).toBe('SAM0001');
    expect(decoded.sampleTypeFilters).toEqual(['blood', 'urine']);
    expect(decoded.statusFilters).toEqual(['pending', 'collected']);
    expect(decoded.dateRange).not.toBeNull();
  });

  it('writes priority key for validationReview workflow', () => {
    const params = new URLSearchParams();
    writeLabQueueBarFilters(
      params,
      {
        searchQuery: 'ORD',
        dateRange: null,
        sampleTypeFilters: [],
        statusFilters: ['urgent', 'high'],
      },
      'validationReview',
    );
    expect(params.get('priority')).toBe('urgent,high');
    expect(params.has('status')).toBe(false);

    const decoded = decodeLabQueueBarFilters(params, 'validationReview', validationDefaults);
    expect(decoded.statusFilters).toEqual(['urgent', 'high']);
  });

  it('clears prior bar keys without removing unrelated query params', () => {
    const params = new URLSearchParams('search=old&status=collected&foo=bar');
    writeLabQueueBarFilters(
      params,
      {
        searchQuery: 'new',
        dateRange: null,
        sampleTypeFilters: [],
        statusFilters: ['pending'],
      },
      'collection',
    );
    expect(params.get('search')).toBe('new');
    expect(params.get('status')).toBe('pending');
    expect(params.get('foo')).toBe('bar');
    expect(params.has('dateFrom')).toBe(false);
  });

  it('migrates legacy entity keys into search and removes them', () => {
    const params = new URLSearchParams('testId=7&orderId=42&status=pending');
    expect(migrateLegacyLabEntitySearchParams(params)).toBe(true);
    expect(params.get('search')).toBe('TST0007');
    expect(params.has('testId')).toBe(false);
    expect(params.has('orderId')).toBe(false);
    expect(params.get('status')).toBe('pending');
  });

  it('does not overwrite existing search when migrating legacy keys', () => {
    const params = new URLSearchParams('search=SAM0099&sampleId=99');
    expect(migrateLegacyLabEntitySearchParams(params)).toBe(true);
    expect(params.get('search')).toBe('SAM0099');
    expect(params.has('sampleId')).toBe(false);
  });
});
