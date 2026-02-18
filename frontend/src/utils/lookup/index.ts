/**
 * Entity Lookup Utilities
 * Pure functions for resolving entity references using in-memory arrays.
 */

import type { Test, Sample, Patient, SampleType, TestCategory } from '@/types';

/**
 * Generic test property lookup.
 */
export function getTestProperty<K extends keyof Test>(
  testCode: string,
  property: K,
  testCatalog: Test[]
): Test[K] | undefined {
  return testCatalog.find(t => t.code === testCode)?.[property];
}

/**
 * Get test name from code. Returns 'Unknown Test' if not found.
 */
export function getTestName(testCode: string, testCatalog: Test[]): string {
  return getTestProperty(testCode, 'name', testCatalog) || 'Unknown Test';
}

/**
 * Get test names for an array of test codes.
 */
export function getTestNames(testCodes: string[], testCatalog: Test[]): string[] {
  return testCodes.map(code => getTestName(code, testCatalog));
}

/**
 * Get sample type from test code. Returns 'other' if not found.
 */
export function getTestSampleType(testCode: string, testCatalog: Test[]): SampleType {
  return (getTestProperty(testCode, 'sampleType', testCatalog) || 'other') as SampleType;
}

/**
 * Get test category from test code. Returns 'other' if not found.
 */
export function getTestCategory(testCode: string, testCatalog: Test[]): TestCategory | 'other' {
  return getTestProperty(testCode, 'category', testCatalog) || 'other';
}

/**
 * Get patient full name from patient ID. Returns 'Unknown Patient' if not found.
 */
export function getPatientName(patientId: number | string, patients: Patient[]): string {
  const numericId = typeof patientId === 'string' ? parseInt(patientId, 10) : patientId;
  if (isNaN(numericId)) return 'Unknown Patient';
  return patients.find(p => p.id === numericId)?.fullName || 'Unknown Patient';
}

/**
 * Compute collection status summary from a set of samples.
 */
export function getOrderCollectionStatus(samples: Sample[]): {
  allCollected: boolean;
  firstCollectedAt?: string;
  lastCollectedAt?: string;
} {
  const collected = samples.filter(s => s.status === 'collected') as Array<
    Extract<Sample, { status: 'collected' }>
  >;
  if (collected.length === 0) return { allCollected: false };

  const dates = collected
    .map(s => s.collectedAt)
    .filter((d): d is string => d !== undefined)
    .sort();

  return {
    allCollected: samples.length > 0 && collected.length === samples.length,
    firstCollectedAt: dates[0],
    lastCollectedAt: dates[dates.length - 1],
  };
}
