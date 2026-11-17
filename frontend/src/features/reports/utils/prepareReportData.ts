import type { LabReportPayload, OrderTest, Patient, ReportableOrder, OrderableTest, AnalyteDefinition, TestResult } from '@/types';
import { getBrandingPresentation } from '@/config';
import { RESULT_NOT_AVAILABLE } from '@/types';
import { isDateInInclusiveRange } from '@/utils/date';
import { getActiveOrderTests } from '@/utils/presentation';
import { calculateAge } from '@/utils/string';
import type jsPDF from 'jspdf';

interface SampleLookup {
  (sampleId: string): { status: string; collectedAt?: string; collectedBy?: string } | undefined;
}

interface PrepareReportDataOptions {
  reportableOrder: ReportableOrder;
  patients: Patient[] | undefined;
  orderableTests: OrderableTest[];
  getSample: SampleLookup;
  getUserName: (userId: string) => string;
}

export type ReportResultRow = LabReportPayload['testResults'][number]['parameters'][number];

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

function placeholderResultRow(name: string, code: string): ReportResultRow {
  return {
    name,
    code,
    value: RESULT_NOT_AVAILABLE,
  };
}

function resultRowFromStored(
  name: string,
  code: string,
  result: { value?: string | number | null; unit?: string; referenceRange?: string; status?: string }
): ReportResultRow {
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

function resultRowFromCatalogAnalyte(
  analyte: AnalyteDefinition,
  result: TestResult | undefined
): ReportResultRow {
  if (!result) {
    return placeholderResultRow(analyte.name, analyte.analyte_code);
  }
  return resultRowFromStored(analyte.name, analyte.analyte_code, result);
}

/**
 * Builds investigation rows from catalog analytes when present, merging stored results.
 * Missing values use {@link RESULT_NOT_AVAILABLE}. Extra result keys not in the catalog are appended.
 */
function buildReportResultRows(
  test: OrderTest,
  orderableTest: OrderableTest | undefined
): ReportResultRow[] {
  const results = test.results ?? {};
  const catalogAnalytes = orderableTest?.analytes ?? [];

  if (catalogAnalytes.length > 0) {
    const catalogCodes = new Set(catalogAnalytes.map(analyte => analyte.analyte_code));
    const rows = catalogAnalytes.map(analyte =>
      resultRowFromCatalogAnalyte(analyte, results[analyte.analyte_code])
    );
    for (const [code, result] of Object.entries(results)) {
      if (catalogCodes.has(code) || !result) continue;
      const catalogMatch = orderableTest?.analytes?.find(analyte => analyte.analyte_code === code);
      rows.push(resultRowFromStored(catalogMatch?.name || code, code, result));
    }
    return rows;
  }

  const resultEntries = Object.entries(results);
  if (resultEntries.length > 0) {
    return resultEntries.map(([code, result]) =>
      resultRowFromStored(code, code, result ?? {})
    );
  }

  return [placeholderResultRow(test.testName, test.testCode)];
}

function buildTestResultEntry(
  test: OrderTest,
  orderableTest: OrderableTest | undefined,
  getUserName: (userId: string) => string
) {
  return {
    testCode: test.testCode,
    testName: test.testName,
    category: orderableTest?.category ?? 'Uncategorized',
    methodology: orderableTest?.methodology?.trim() || undefined,
    parameters: buildReportResultRows(test, orderableTest),
    technicianNotes: test.technicianNotes,
    validationNotes: test.validationNotes,
    enteredBy: test.enteredBy,
    validatedBy: test.validatedBy,
    validatedByName: test.validatedBy
      ? getUserName(test.validatedBy.trim())
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
  orderableTests,
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

  const orderableByCode = new Map(orderableTests.map(entry => [entry.code, entry]));
  const testResults = activeTests.map(test => {
    const orderableTest = orderableByCode.get(test.testCode);
    return buildTestResultEntry(test, orderableTest, getUserName);
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
      address: getBrandingPresentation().contact.address.fullAddress,
    },
    testResults,
  };
}

/**
 * Generates and downloads a lab report PDF named by filler number.
 */
export async function downloadLabReport(
  reportableOrder: ReportableOrder,
  reportData: LabReportPayload,
  orderableTests: OrderableTest[],
  generateLabReport: (data: LabReportPayload, orderableTests: OrderableTest[]) => jsPDF | Promise<jsPDF>,
  downloadPDF: (doc: jsPDF, filename: string) => void,
  formatDate: (date: Date) => string
): Promise<void> {
  const doc = await generateLabReport(reportData, orderableTests);
  const filler = reportableOrder.order?.orderId ?? '-';
  const filename = `lab-report-${filler}_${formatDate(new Date())}.pdf`;
  downloadPDF(doc, filename);
}