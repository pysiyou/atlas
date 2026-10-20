/**
 * Test catalog lookup utilities.
 * Prefer a Map indexed by code; array inputs are indexed once at the call boundary.
 */

import type { Test, TestParameter, TestSummary, SampleType } from '@/types';

/** Indexed catalog keyed by test code. */
export type CatalogIndex<T extends { code: string } = TestSummary> = ReadonlyMap<string, T>;

/** Max unique codes accepted by GET /tests/by-codes. */
export const CATALOG_BY_CODES_MAX = 100;

/** Split codes into batches the by-codes endpoint will accept. */
export function chunkTestCodes(
  codes: string[],
  size: number = CATALOG_BY_CODES_MAX
): string[][] {
  if (size <= 0) {
    throw new Error('chunkTestCodes size must be positive');
  }
  const chunks: string[][] = [];
  for (let index = 0; index < codes.length; index += size) {
    chunks.push(codes.slice(index, index + size));
  }
  return chunks;
}

/** Sorted unique codes for query keys and batch fetches. */
export function uniqueSortedTestCodes(codes: readonly string[]): string[] {
  return [...new Set(codes.filter(code => Boolean(code)))].sort();
}

/**
 * Build a code → test Map. Later duplicates overwrite earlier rows.
 */
export function indexTestsByCode<T extends { code: string }>(tests: readonly T[]): Map<string, T> {
  const index = new Map<string, T>();
  for (const test of tests) {
    if (test.code) {
      index.set(test.code, test);
    }
  }
  return index;
}

function asIndex<T extends { code: string }>(
  catalog: CatalogIndex<T> | readonly T[]
): CatalogIndex<T> {
  if ('get' in catalog) {
    return catalog;
  }
  return indexTestsByCode(catalog);
}

/**
 * Read one property from a catalog index or array.
 */
export function getTestProperty<T extends { code: string }, K extends keyof T>(
  testCode: string,
  property: K,
  testCatalog: CatalogIndex<T> | readonly T[]
): T[K] | undefined {
  return asIndex(testCatalog).get(testCode)?.[property];
}

/**
 * Resolve a display name, falling back to the raw code.
 */
export function getTestName(
  testCode: string,
  testCatalog: CatalogIndex<TestSummary> | readonly TestSummary[]
): string {
  return getTestProperty(testCode, 'name', testCatalog) || 'Unknown Test';
}

/** Map many codes to display names in the same order. */
export function getTestNames(
  testCodes: string[],
  testCatalog: CatalogIndex<TestSummary> | readonly TestSummary[]
): string[] {
  const index = asIndex(testCatalog);
  return testCodes.map(code => getTestName(code, index));
}

/** Sample type for a code, defaulting to `other` when unknown. */
export function getTestSampleType(
  testCode: string,
  testCatalog: CatalogIndex<TestSummary> | readonly TestSummary[]
): SampleType {
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

/**
 * Label map for one test code from a full-document catalog.
 */
export function buildParameterLabelMapFromCatalog(
  testCode: string,
  testCatalog: CatalogIndex<Test> | readonly Test[]
): Record<string, string> {
  return buildParameterLabelMap(asIndex(testCatalog).get(testCode));
}

/** Display label for a parameter code, falling back to the raw code. */
export function resolveParameterLabel(
  code: string,
  parameterLabels?: Record<string, string>
): string {
  return parameterLabels?.[code] ?? code;
}

/**
 * Parameter definitions keyed by item code for one catalog test.
 */
export function catalogParametersFromTest(
  test: Test | undefined
): Record<string, TestParameter> {
  const map: Record<string, TestParameter> = {};
  for (const param of test?.parameters ?? []) {
    if (param.code) {
      map[param.code] = param;
    }
  }
  return map;
}

/**
 * Parameter definitions for a test code from a full-document catalog.
 */
export function catalogParametersByCode(
  testCode: string,
  testCatalog: CatalogIndex<Test> | readonly Test[]
): Record<string, TestParameter> {
  return catalogParametersFromTest(asIndex(testCatalog).get(testCode));
}
