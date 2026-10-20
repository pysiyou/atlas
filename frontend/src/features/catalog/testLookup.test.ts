import { describe, expect, it } from 'vitest';
import type { Test, TestSummary } from '@/types';
import {
  catalogParametersByCode,
  getTestName,
  getTestNames,
  indexTestsByCode,
} from './testLookup';
import { chunkTestCodes, uniqueSortedTestCodes } from './testLookup';

function summary(code: string, name: string): TestSummary {
  return {
    code,
    name,
    category: 'hematology',
    price: 1,
    turnaroundTime: 1,
    sampleType: 'blood',
    isActive: true,
    createdAt: '',
    updatedAt: '',
    containerTypes: [],
    containerTopColors: [],
  };
}

function fullTest(code: string, name: string, paramCode: string): Test {
  return {
    ...summary(code, name),
    sampleVolume: '3ml',
    referenceRanges: [],
    parameters: [{ name: 'WBC', code: paramCode, unit: '', referenceRange: '', type: 'numeric' }],
  };
}

describe('indexTestsByCode', () => {
  it('looks up by code in O(1)', () => {
    const index = indexTestsByCode([summary('CBC', 'Complete Blood Count'), summary('CMP', 'Metabolic')]);
    expect(index.get('CBC')?.name).toBe('Complete Blood Count');
    expect(getTestName('CMP', index)).toBe('Metabolic');
    expect(getTestName('MISSING', index)).toBe('Unknown Test');
  });

  it('accepts an array and indexes once at the boundary', () => {
    expect(getTestNames(['CBC', 'X'], [summary('CBC', 'Complete Blood Count')])).toEqual([
      'Complete Blood Count',
      'Unknown Test',
    ]);
  });
});

describe('catalogParametersByCode', () => {
  it('maps parameter defs from a full document index', () => {
    const index = indexTestsByCode([fullTest('CBC', 'CBC', 'WBC')]);
    expect(catalogParametersByCode('CBC', index).WBC?.name).toBe('WBC');
    expect(catalogParametersByCode('MISSING', index)).toEqual({});
  });
});

describe('uniqueSortedTestCodes / chunkTestCodes', () => {
  it('dedupes and sorts', () => {
    expect(uniqueSortedTestCodes(['CMP', 'CBC', 'CBC', ''])).toEqual(['CBC', 'CMP']);
  });

  it('chunks at the by-codes cap', () => {
    const codes = Array.from({ length: 101 }, (_, i) => `T${i}`);
    const chunks = chunkTestCodes(codes, 100);
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toHaveLength(100);
    expect(chunks[1]).toHaveLength(1);
  });
});
