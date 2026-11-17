/**
 * Orderable test catalog lookup utilities.
 * Prefer a Map indexed by code; array inputs are indexed once at the call boundary.
 */

import type { AnalyteDefinition, OrderableTest, OrderableTestSummary, SampleType } from '@/types';

/** Indexed orderable tests keyed by test code. */
export type OrderableTestMap<T extends { code: string } = OrderableTestSummary> = ReadonlyMap<string, T>;

/** Max unique codes accepted by GET /orderable-tests/by-codes. */
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
  orderableTestMap: OrderableTestMap<T> | readonly T[]
): OrderableTestMap<T> {
  if ('get' in orderableTestMap) {
    return orderableTestMap;
  }
  return indexTestsByCode(orderableTestMap);
}

/**
 * Read one property from a catalog index or array.
 */
export function getTestProperty<T extends { code: string }, K extends keyof T>(
  testCode: string,
  property: K,
  orderableTestMap: OrderableTestMap<T> | readonly T[]
): T[K] | undefined {
  return asIndex(orderableTestMap).get(testCode)?.[property];
}

/**
 * Resolve a display name, falling back to the raw code.
 */
export function getTestName(
  testCode: string,
  orderableTestMap: OrderableTestMap<OrderableTestSummary> | readonly OrderableTestSummary[]
): string {
  return getTestProperty(testCode, 'name', orderableTestMap) || 'Unknown Test';
}

/** Map many codes to display names in the same order. */
export function getTestNames(
  testCodes: string[],
  orderableTestMap: OrderableTestMap<OrderableTestSummary> | readonly OrderableTestSummary[]
): string[] {
  const index = asIndex(orderableTestMap);
  return testCodes.map(code => getTestName(code, index));
}

/** Sample type for a code, defaulting to `other` when unknown. */
export function getTestSampleType(
  testCode: string,
  orderableTestMap: OrderableTestMap<OrderableTestSummary> | readonly OrderableTestSummary[]
): SampleType {
  return (getTestProperty(testCode, 'sampleType', orderableTestMap) || 'other') as SampleType;
}

/** Map analyte_code keys to display names. */
export function buildAnalyteLabelMap(
  source?: OrderableTest | AnalyteDefinition[]
): Record<string, string> {
  const analytes = Array.isArray(source) ? source : source?.analytes;
  const map: Record<string, string> = {};
  for (const analyte of analytes ?? []) {
    if (analyte.code) {
      map[analyte.code] = analyte.name;
    }
  }
  return map;
}

/**
 * Label map for one test code from a full-document catalog.
 */
export function buildAnalyteLabelMapFromCatalog(
  testCode: string,
  orderableTestMap: OrderableTestMap<OrderableTest> | readonly OrderableTest[]
): Record<string, string> {
  return buildAnalyteLabelMap(asIndex(orderableTestMap).get(testCode));
}

/** Display label for an analyte code, falling back to the raw code. */
export function resolveAnalyteLabel(code: string, analyteLabels?: Record<string, string>): string {
  return analyteLabels?.[code] ?? code;
}

/**
 * Analyte definitions keyed by analyte_code for one orderable test.
 */
export function getTestAnalytes(test: OrderableTest | undefined): Record<string, AnalyteDefinition> {
  const map: Record<string, AnalyteDefinition> = {};
  for (const analyte of test?.analytes ?? []) {
    if (analyte.code) {
      map[analyte.code] = analyte;
    }
  }
  return map;
}

/**
 * Analyte definitions for a test code from a full-document catalog.
 */
export function getTestAnalytesByCode(
  testCode: string,
  orderableTestMap: OrderableTestMap<OrderableTest> | readonly OrderableTest[]
): Record<string, AnalyteDefinition> {
  return getTestAnalytes(asIndex(orderableTestMap).get(testCode));
}