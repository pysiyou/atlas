/**
 * Pure label / preview text for order table test blocks.
 */

import type { OrderTest } from '@/types';

export type OrderTestsBlockLayout = 'countFirst' | 'namesFirst';

export interface OrderTestsBlockPreviewInput {
  activeTests: Pick<OrderTest, 'testCode' | 'testName'>[];
  fallbackCount?: number;
  testCodes?: string[];
  getTestName?: (testCode: string) => string;
  layout?: OrderTestsBlockLayout;
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
  if (labels.length === 1) {
    return labels[0];
  }
  if (labels.length === 2) {
    return labels.join(', ');
  }
  return `${labels.slice(0, 2).join(', ')}, +${labels.length - 2} more`;
}

function buildCountFirstSecondary(labels: string[]): string {
  const firstName = labels[0];
  if (firstName && labels.length > 1) {
    return `${firstName}, +${labels.length - 1}`;
  }
  return firstName ?? '';
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
    countFirstSecondary: buildCountFirstSecondary(labels),
  };
}
