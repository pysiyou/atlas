/**
 * Test Catalog Lookup Utilities
 * Pure functions for resolving test properties from the test catalog.
 */

import type { Test, SampleType, TestCategory } from '@/types';

export function getTestProperty<K extends keyof Test>(
  testCode: string,
  property: K,
  testCatalog: Test[]
): Test[K] | undefined {
  return testCatalog.find(t => t.code === testCode)?.[property];
}

export function getTestName(testCode: string, testCatalog: Test[]): string {
  return getTestProperty(testCode, 'name', testCatalog) || 'Unknown Test';
}

export function getTestNames(testCodes: string[], testCatalog: Test[]): string[] {
  return testCodes.map(code => getTestName(code, testCatalog));
}

export function getTestSampleType(testCode: string, testCatalog: Test[]): SampleType {
  return (getTestProperty(testCode, 'sampleType', testCatalog) || 'other') as SampleType;
}

export function getTestCategory(testCode: string, testCatalog: Test[]): TestCategory | 'other' {
  return getTestProperty(testCode, 'category', testCatalog) || 'other';
}
