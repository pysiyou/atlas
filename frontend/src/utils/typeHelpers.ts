/**
 * Type Helper Functions
 * Centralized lookup functions for resolving references to related entities
 */

import type { Test, Sample, Patient, SampleType, TestCategory } from '@/types';

/**
 * Generic test property lookup function
 * @param testCode - The test code to look up
 * @param property - The property key to retrieve
 * @param testCatalog - Array of Test catalog entries
 * @returns The property value, or undefined if not found
 */
export function getTestProperty<K extends keyof Test>(
  testCode: string,
  property: K,
  testCatalog: Test[]
): Test[K] | undefined {
  const test = testCatalog.find((t) => t.code === testCode);
  return test?.[property];
}

/**
 * Get test name from test code by looking up in test catalog
 * @param testCode - The test code to look up
 * @param testCatalog - Array of Test catalog entries
 * @returns The test name, or 'Unknown Test' if not found
 */
export function getTestName(testCode: string, testCatalog: Test[]): string {
  return getTestProperty(testCode, 'name', testCatalog) || 'Unknown Test';
}

/**
 * Get sample type from test code by looking up in test catalog
 * @param testCode - The test code to look up
 * @param testCatalog - Array of Test catalog entries
 * @returns The sample type, or 'other' if not found
 */
export function getTestSampleType(testCode: string, testCatalog: Test[]): SampleType {
  return (getTestProperty(testCode, 'sampleType', testCatalog) || 'other') as SampleType;
}

/**
 * Get test category from test code by looking up in test catalog
 * @param testCode - The test code to look up
 * @param testCatalog - Array of Test catalog entries
 * @returns The test category, or 'other' if not found
 */
export function getTestCategory(testCode: string, testCatalog: Test[]): TestCategory | 'other' {
  return getTestProperty(testCode, 'category', testCatalog) || 'other';
}

/**
 * Get patient name from patient ID by looking up in patients array
 * @param patientId - The patient ID to look up (number or string for compatibility)
 * @param patients - Array of Patient entities
 * @returns The patient's full name, or 'Unknown Patient' if not found
 */
export function getPatientName(patientId: number | string, patients: Patient[]): string {
  const numericId = typeof patientId === 'string' ? parseInt(patientId, 10) : patientId;
  if (isNaN(numericId)) return 'Unknown Patient';
  const patient = patients.find((p) => p.id === numericId);
  return patient?.fullName || 'Unknown Patient';
}

/**
 * Compute collection status from samples for an order
 * @param samples - Array of Sample entities (can be pending or collected)
 * @returns Object with collection status information
 */
export function getOrderCollectionStatus(samples: Sample[]): {
  allCollected: boolean;
  firstCollectedAt?: string;
  lastCollectedAt?: string;
} {
  const collectedSamples = samples.filter(
    (sample) => sample.status === 'collected'
  ) as Array<Extract<Sample, { status: 'collected' }>>;

  if (collectedSamples.length === 0) {
    return { allCollected: false };
  }

  const collectedDates = collectedSamples
    .map((s) => s.collectedAt)
    .filter((date): date is string => date !== undefined)
    .sort();

  const allCollected = samples.length > 0 && collectedSamples.length === samples.length;

  return {
    allCollected,
    firstCollectedAt: collectedDates[0],
    lastCollectedAt: collectedDates[collectedDates.length - 1],
  };
}

/**
 * Get test names from test codes by looking up in test catalog
 * @param testCodes - Array of test codes to look up
 * @param testCatalog - Array of Test catalog entries
 * @returns Array of test names in the same order as testCodes
 */
export function getTestNames(testCodes: string[], testCatalog: Test[]): string[] {
  return testCodes.map((code) => getTestName(code, testCatalog));
}
