/**
 * Pure label / preview text for order table test blocks.
 */

import type { OrderTest } from '@/types';
import { formatTruncatedListPreview } from '@/utils/array';

export type OrderTestsBlockLayout = 'countFirst' | 'namesFirst';

export interface OrderTestsBlockPreviewInput {
  activeTests: Pick<OrderTest, 'testCode' | 'testName'>[];
  fallbackCount?: number;
  testCodes?: string[];
  getTestName?: (testCode: string) => string;
  layout?: OrderTestsBlockLayout;
  /** When true, list every test name (e.g. order detail, not tables). */
  showAllNames?: boolean;
}

export interface OrderTestsBlockPreviewResult {
  activeCount: number;
  labels: string[];
  namesFirstPreview: string;
  countFirstSecondary: string;
}

function resolveActiveCount(input: OrderTestsBlockPreviewInput): number {
  const { activeTests, fallbackCount, testCodes } = input;
  return (
    fallbackCount ??
    (activeTests.length > 0 ? activeTests.length : (testCodes?.length ?? 0))
  );
}

function resolveTestLabels(input: OrderTestsBlockPreviewInput): string[] {
  const { activeTests, testCodes, getTestName } = input;
  if (activeTests.length > 0) {
    return activeTests.map(t => t.testName || t.testCode);
  }
  return (testCodes ?? []).map(code => getTestName?.(code) || code);
}

function buildNamesFirstPreview(labels: string[], activeCount: number, showAllNames: boolean): string {
  if (labels.length === 0) {
    return activeCount > 0 ? `${activeCount} test${activeCount !== 1 ? 's' : ''}` : '';
  }
  if (showAllNames) {
    return labels.join(', ');
  }
  return formatTruncatedListPreview(labels);
}

export function buildOrderTestsBlockPreview(
  input: OrderTestsBlockPreviewInput
): OrderTestsBlockPreviewResult {
  const activeCount = resolveActiveCount(input);
  const labels = resolveTestLabels(input);
  const showAllNames = input.showAllNames ?? false;

  return {
    activeCount,
    labels,
    namesFirstPreview: buildNamesFirstPreview(labels, activeCount, showAllNames),
    countFirstSecondary: showAllNames ? labels.join(', ') : formatTruncatedListPreview(labels),
  };
}
