/**
 * Test Catalog Lookup Utilities
 * Pure functions for resolving test properties from the test catalog.
 */

import type { Test, SampleType, TestParameter } from '@/types';

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

/** Map result item codes to catalog parameter display names. */
export function buildParameterLabelMap(source?: Test | TestParameter[]): Record<string, string> {
  const parameters = Array.isArray(source) ? source : source?.parameters;
  const map: Record<string, string> = {};
  for (const param of parameters ?? []) {
    if (param.code) {
      map[param.code] = param.name;
    }
  }
  return map;
}

export function buildParameterLabelMapFromCatalog(
  testCode: string,
  testCatalog: Test[]
): Record<string, string> {
  return buildParameterLabelMap(testCatalog.find(t => t.code === testCode));
}

export function resolveParameterLabel(
  code: string,
  parameterLabels?: Record<string, string>
): string {
  return parameterLabels?.[code] ?? code;
}

export function catalogParametersByCode(
  testCode: string,
  testCatalog: Test[]
): Record<string, TestParameter> {
  const test = testCatalog.find(t => t.code === testCode);
  const map: Record<string, TestParameter> = {};
  for (const param of test?.parameters ?? []) {
    if (param.code) {
      map[param.code] = param;
    }
  }
  return map;
}
