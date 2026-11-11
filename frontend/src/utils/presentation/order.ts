/**
 * Order and order-test view-models (no React).
 * Patient-only formatters: `@/features/patients/utils/patientFormatters`.
 */

import type { Gender, Order, OrderTest } from '@/types';
import { INACTIVE_REPORTABLE_TEST_STATUSES } from '@/types/generated/labContract';
import { formatTruncatedListPreview } from '@/utils/array';
import { formatPatientSexAgeLine } from './patient';

export function formatTestCountLabel(count: number): string {
  return `${count} test${count !== 1 ? 's' : ''}`;
}

export function formatReportValidationStatus(
  validatedCount: number,
  activeCount: number
): string {
  return `${validatedCount}/${activeCount}`;
}

export function formatPatientOrdersCountLabel(orderCount: number): string {
  return orderCount === 1 ? '1 order' : `${orderCount} orders`;
}

export type OrderTestsBlockLayout = 'countFirst' | 'namesFirst';

export interface OrderTestsPresentationInput {
  activeTests: Pick<OrderTest, 'testCode' | 'testName'>[];
  fallbackCount?: number;
  testCodes?: string[];
  /** When aligned with testCodes, used before catalog lookup. */
  testNames?: string[];
  getTestName?: (testCode: string) => string;
  layout?: OrderTestsBlockLayout;
  showAllNames?: boolean;
}

export interface OrderTestsPresentationResult {
  activeCount: number;
  nameLabels: string[];
  codeLabels: string[];
  labels: string[];
  namesFirstPreview: string;
  countFirstSecondary: string;
  namesPreview: string;
  codesPreview: string;
  fullNames: string;
  fullCodes: string;
}

export interface ReportableOrderTestsInput {
  testNames: string[];
  testCodes: string[];
  activeTestCount: number;
  order?: Order | null;
}

export function getActiveOrderTests(order: Order): OrderTest[] {
  return (order.tests ?? [])
    .filter(test => !INACTIVE_REPORTABLE_TEST_STATUSES.has(test.status))
    .sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
}

function resolveActiveCount(input: OrderTestsPresentationInput): number {
  const { activeTests, fallbackCount, testCodes } = input;
  return (
    fallbackCount ??
    (activeTests.length > 0 ? activeTests.length : (testCodes?.length ?? 0))
  );
}

function resolveNameLabels(input: OrderTestsPresentationInput): string[] {
  const { activeTests, testCodes, testNames, getTestName } = input;
  if (activeTests.length > 0) {
    return activeTests.map(t => t.testName || t.testCode);
  }
  const codes = testCodes ?? [];
  if (testNames && testNames.length === codes.length && testNames.length > 0) {
    return testNames;
  }
  return codes.map(code => getTestName?.(code) || code);
}

function resolveCodeLabels(input: OrderTestsPresentationInput): string[] {
  const { activeTests, testCodes } = input;
  if (activeTests.length > 0) {
    return activeTests.map(t => t.testCode);
  }
  return testCodes ?? [];
}

function buildNamesFirstPreview(
  labels: string[],
  activeCount: number,
  showAllNames: boolean
): string {
  if (labels.length === 0) {
    return activeCount > 0 ? formatTestCountLabel(activeCount) : '';
  }
  if (showAllNames) {
    return labels.join(', ');
  }
  return formatTruncatedListPreview(labels);
}

export function resolveOrderTestsPresentation(
  input: OrderTestsPresentationInput
): OrderTestsPresentationResult {
  const activeCount = resolveActiveCount(input);
  const nameLabels = resolveNameLabels(input);
  const codeLabels = resolveCodeLabels(input);
  const labels = nameLabels;
  const showAllNames = input.showAllNames ?? false;

  const namesFirstPreview = buildNamesFirstPreview(labels, activeCount, showAllNames);
  const countFirstSecondary = showAllNames
    ? labels.join(', ')
    : formatTruncatedListPreview(labels);

  const fullNames = nameLabels.join(', ');
  const fullCodes = codeLabels.join(', ');
  const namesPreview =
    nameLabels.length > 0
      ? formatTruncatedListPreview(nameLabels)
      : formatTestCountLabel(activeCount);
  const codesPreview = formatTruncatedListPreview(codeLabels);

  return {
    activeCount,
    nameLabels,
    codeLabels,
    labels,
    namesFirstPreview,
    countFirstSecondary,
    namesPreview,
    codesPreview,
    fullNames,
    fullCodes,
  };
}

export function resolveReportableOrderTests(
  order: ReportableOrderTestsInput
): OrderTestsPresentationResult {
  const nameLabels =
    order.testNames.length > 0
      ? order.testNames
      : order.order
        ? getActiveOrderTests(order.order).map(test => test.testName)
        : [];
  const codeLabels =
    order.testCodes.length > 0
      ? order.testCodes
      : order.order
        ? getActiveOrderTests(order.order).map(test => test.testCode)
        : [];

  return resolveOrderTestsPresentation({
    activeTests: nameLabels.map((name, i) => ({
      testName: name,
      testCode: codeLabels[i] ?? name,
    })),
    fallbackCount: order.activeTestCount,
    testCodes: codeLabels.length > 0 ? codeLabels : undefined,
  });
}

export function getReportOrderTestLabels(order: ReportableOrderTestsInput): {
  nameLabels: string[];
  codeLabels: string[];
} {
  const result = resolveReportableOrderTests(order);
  return { nameLabels: result.nameLabels, codeLabels: result.codeLabels };
}

export function formatReportOrderTestsPreview(order: ReportableOrderTestsInput): {
  names: string;
  codes: string;
  fullNames: string;
  fullCodes: string;
} {
  const result = resolveReportableOrderTests(order);
  const names =
    result.nameLabels.length > 0
      ? result.namesPreview
      : `${order.activeTestCount} test(s)`;
  return {
    names,
    codes: result.codesPreview,
    fullNames: result.fullNames,
    fullCodes: result.fullCodes,
  };
}

export interface PatientListSnippet {
  patientId?: number | string;
  patientName: string;
  gender?: Gender | string | null;
  dateOfBirth?: string | null;
}

export interface OrderListHeader {
  orderId: number | string;
  orderDate?: string;
  referentDoctor?: string | null;
}

export interface OrderContextPresentation {
  patientName: string;
  demographicsLine: string | null;
  orderId?: number | string;
  orderDate?: string;
}

export function buildOrderContextPresentation(
  patient: PatientListSnippet,
  order?: OrderListHeader
): OrderContextPresentation {
  return {
    patientName: patient.patientName,
    demographicsLine: formatPatientSexAgeLine(patient.gender, patient.dateOfBirth),
    orderId: order?.orderId,
    orderDate: order?.orderDate,
  };
}
