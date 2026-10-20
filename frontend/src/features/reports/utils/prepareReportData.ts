import type jsPDF from 'jspdf';
import type { Order, OrderTest, Patient, Test, TestParameter, TestResult } from '@/types';
import type { LabReportPayload, ReportableOrder } from '../types';
import { RESULT_NOT_AVAILABLE } from '../types';
import { companyConfig } from '@/config/company';
import { isDateInInclusiveRange } from '@/utils/date';
import { calculateAge } from '@/utils/string';
import { INACTIVE_REPORTABLE_TEST_STATUSES } from '@/features/orders/utils/orderCalculator';

interface SampleLookup {
  (sampleId: number): { status: string; collectedAt?: string; collectedBy?: string } | undefined;
}

interface PrepareReportDataOptions {
  reportableOrder: ReportableOrder;
  patients: Patient[] | undefined;
  catalogTests: Test[];
  getSample: SampleLookup;
  getUserName: (userId: string) => string;
}

export type LabReportParameter = LabReportPayload['testResults'][number]['parameters'][number];

/**
 * Active order tests exclude removed and superseded lines.
 */
export function getActiveOrderTests(order: Order): OrderTest[] {
  return (order.tests ?? [])
    .filter(test => !INACTIVE_REPORTABLE_TEST_STATUSES.has(test.status))
    .sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
}

/**
 * Filters reportable orders by inclusive order-date range.
 */
export function filterReportableOrdersByDateRange(
  orders: ReportableOrder[],
  dateRange: [Date, Date] | null
): ReportableOrder[] {
  if (!dateRange) return orders;
  return orders.filter(order => isDateInInclusiveRange(order.orderDate, dateRange));
}

function hasResultValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string' && value.trim() === '') return false;
  return true;
}

function isCriticalStatus(status: string | undefined): boolean {
  return (
    status === 'critical' || status === 'critical-high' || status === 'critical-low'
  );
}

function placeholderParameter(name: string, code: string): LabReportParameter {
  return {
    name,
    code,
    value: RESULT_NOT_AVAILABLE,
  };
}

function parameterFromResult(
  name: string,
  code: string,
  result: { value?: string | number | null; unit?: string; referenceRange?: string; status?: string }
): LabReportParameter {
  if (!hasResultValue(result.value)) {
    return {
      name,
      code,
      value: RESULT_NOT_AVAILABLE,
      unit: result.unit,
      referenceRange: result.referenceRange,
    };
  }
  return {
    name,
    code,
    value: result.value as string | number,
    unit: result.unit,
    referenceRange: result.referenceRange,
    status: result.status,
    isCritical: isCriticalStatus(result.status),
  };
}

function parameterFromCatalog(
  parameter: TestParameter,
  result: TestResult | undefined
): LabReportParameter {
  if (!result) {
    return placeholderParameter(parameter.name, parameter.code);
  }
  return parameterFromResult(parameter.name, parameter.code, result);
}

/**
 * Builds investigation rows from catalog parameters when present, merging stored results.
 * Missing values use {@link RESULT_NOT_AVAILABLE}. Extra result keys not in the catalog are appended.
 */
function buildParameterRows(test: OrderTest, catalogTest: Test | undefined): LabReportParameter[] {
  const results = test.results ?? {};
  const catalogParameters = catalogTest?.parameters ?? [];

  if (catalogParameters.length > 0) {
    const catalogCodes = new Set(catalogParameters.map(parameter => parameter.code));
    const rows = catalogParameters.map(parameter =>
      parameterFromCatalog(parameter, results[parameter.code])
    );
    for (const [code, result] of Object.entries(results)) {
      if (catalogCodes.has(code) || !result) continue;
      const catalogMatch = catalogTest?.parameters?.find(parameter => parameter.code === code);
      rows.push(parameterFromResult(catalogMatch?.name || code, code, result));
    }
    return rows;
  }

  const resultEntries = Object.entries(results);
  if (resultEntries.length > 0) {
    return resultEntries.map(([code, result]) =>
      parameterFromResult(code, code, result ?? {})
    );
  }

  return [placeholderParameter(test.testName, test.testCode)];
}

function buildTestResultEntry(
  test: OrderTest,
  catalogTest: Test | undefined,
  getUserName: (userId: string) => string
) {
  return {
    testCode: test.testCode,
    testName: test.testName,
    category: catalogTest?.category ?? 'Uncategorized',
    methodology: catalogTest?.methodology?.trim() || undefined,
    parameters: buildParameterRows(test, catalogTest),
    technicianNotes: test.technicianNotes,
    validationNotes: test.validationNotes,
    enteredBy: test.enteredBy?.toString(),
    validatedBy: test.validatedBy?.toString(),
    validatedByName: test.validatedBy
      ? getUserName(String(test.validatedBy).trim())
      : undefined,
    enteredAt: test.resultEnteredAt,
    validatedAt: test.resultValidatedAt,
  };
}

function latestValidatedAt(tests: OrderTest[]): string | undefined {
  const timestamps = tests
    .map(test => test.resultValidatedAt)
    .filter((value): value is string => Boolean(value));
  if (timestamps.length === 0) return undefined;
  return timestamps.reduce((latest, current) => (current > latest ? current : latest));
}

/**
 * Earliest result-entry time across active tests — used as lab acceptance when
 * the specimen workflow has no separate accession timestamp.
 */
function earliestEnteredAt(tests: OrderTest[]): string | undefined {
  const timestamps = tests
    .map(test => test.resultEnteredAt)
    .filter((value): value is string => Boolean(value));
  if (timestamps.length === 0) return undefined;
  return timestamps.reduce((earliest, current) => (current < earliest ? current : earliest));
}

/**
 * Earliest collection time across samples linked to active tests (collected or rejected).
 */
function resolveSampleCollectedAt(
  activeTests: OrderTest[],
  getSample: SampleLookup
): string | undefined {
  const collectedAt: string[] = [];
  for (const test of activeTests) {
    if (!test.sampleId) continue;
    const sample = getSample(test.sampleId);
    if (!sample || sample.status === 'pending') continue;
    if (sample.collectedAt) collectedAt.push(sample.collectedAt);
  }
  if (collectedAt.length === 0) return undefined;
  return collectedAt.reduce((earliest, current) => (current < earliest ? current : earliest));
}

/**
 * Assembles PDF payload for every active test on the order.
 */
export function prepareReportData({
  reportableOrder,
  patients,
  catalogTests,
  getSample,
  getUserName,
}: PrepareReportDataOptions): LabReportPayload {
  const { order } = reportableOrder;
  if (!order) {
    throw new Error('Reportable order is missing nested order data.');
  }
  const patient = patients?.find(p => p.id === reportableOrder.patientId);
  const activeTests = getActiveOrderTests(order);

  const sampleSource = activeTests.find(test => test.sampleId);
  const sample = sampleSource?.sampleId ? getSample(sampleSource.sampleId) : undefined;
  const collectedAt =
    resolveSampleCollectedAt(activeTests, getSample) ?? order.scheduledCollectionTime;
  const collectedBy =
    sample && sample.status !== 'pending' ? sample.collectedBy : undefined;

  const catalogByCode = new Map(catalogTests.map(catalog => [catalog.code, catalog]));
  const testResults = activeTests.map(test => {
    const catalogTest = catalogByCode.get(test.testCode);
    return buildTestResultEntry(test, catalogTest, getUserName);
  });

  const patientEmail =
    reportableOrder.patientEmail?.trim() || patient?.email?.trim() || undefined;
  const patientPhone =
    reportableOrder.patientPhone?.trim() || patient?.phone?.trim() || undefined;

  const orderWithPatientInfo = {
    ...order,
    patientEmail,
    patientPhone,
  };

  const patientDob = reportableOrder.patientDob ?? patient?.dateOfBirth;
  const patientAge =
    reportableOrder.patientAge ?? (patientDob ? calculateAge(patientDob) : undefined);

  return {
    order: orderWithPatientInfo,
    patientId: reportableOrder.patientId,
    patientName: reportableOrder.patientName,
    patientAge,
    patientDob,
    patientGender: reportableOrder.patientGender ?? patient?.gender,
    patientEmail,
    patientPhone,
    timestamps: {
      registeredAt: order.orderDate || order.createdAt,
      collectedAt,
      acceptedAt: earliestEnteredAt(activeTests) || collectedAt,
      reportedAt: latestValidatedAt(activeTests) || new Date().toISOString(),
    },
    sampleCollection: {
      collectedAt,
      collectedBy,
      address: companyConfig.getContact().address.fullAddress,
    },
    testResults,
  };
}

/**
 * Generates and downloads a lab report PDF named by order id.
 */
export async function downloadLabReport(
  reportableOrder: ReportableOrder,
  reportData: LabReportPayload,
  catalogTests: Test[],
  generateLabReport: (data: LabReportPayload, catalogTests: Test[]) => jsPDF | Promise<jsPDF>,
  downloadPDF: (doc: jsPDF, filename: string) => void,
  formatDate: (date: Date) => string
): Promise<void> {
  const doc = await generateLabReport(reportData, catalogTests);
  const filename = `Lab_Report_ORD${reportableOrder.orderId.toString().padStart(6, '0')}_${formatDate(new Date())}.pdf`;
  downloadPDF(doc, filename);
}
