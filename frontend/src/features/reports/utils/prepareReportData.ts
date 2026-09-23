import type jsPDF from 'jspdf';
import type { OrderTest, Patient, Test } from '@/types';
import type { ValidatedTestReportPayload, ValidatedTest } from '../types';
import { companyConfig } from '@/config';

interface SampleLookup {
  (sampleId: number): { status: string; collectedAt?: string; collectedBy?: string } | undefined;
}

interface PrepareReportDataOptions {
  validatedTest: ValidatedTest;
  patients: Patient[] | undefined;
  catalogTests: Test[];
  getSample: SampleLookup;
  getUserName: (userId: string) => string;
}

export function filterValidatedTestsByDateRange(
  tests: ValidatedTest[],
  dateRange: [Date, Date] | null
): ValidatedTest[] {
  if (!dateRange) return tests;

  const [start, end] = dateRange;
  const endDate = new Date(end);
  endDate.setHours(23, 59, 59, 999);
  const startDate = new Date(start);
  startDate.setHours(0, 0, 0, 0);

  return tests.filter(test => {
    const orderDate = new Date(test.orderDate);
    return orderDate >= startDate && orderDate <= endDate;
  });
}

function buildTestResultEntry(
  test: OrderTest,
  catalogTest: Test | undefined,
  getUserName: (userId: string) => string
) {
  return {
    testCode: test.testCode,
    testName: test.testName,
    parameters: Object.entries(test.results || {}).map(([code, result]) => {
      const parameter = catalogTest?.parameters?.find(p => p.code === code);
      const fullName = parameter?.name || code;

      return {
        name: fullName,
        code,
        value: result.value,
        unit: result.unit,
        referenceRange: result.referenceRange,
        status: result.status,
        isCritical:
          result.status === 'critical' ||
          result.status === 'critical-high' ||
          result.status === 'critical-low',
      };
    }),
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

export function prepareReportData({
  validatedTest,
  patients,
  catalogTests,
  getSample,
  getUserName,
}: PrepareReportDataOptions): ValidatedTestReportPayload {
  const { test, order } = validatedTest;
  const patient = patients?.find(p => p.id === validatedTest.patientId);

  const sample = test.sampleId ? getSample(test.sampleId) : undefined;
  const collectedAt =
    sample && sample.status === 'collected' ? sample.collectedAt : undefined;
  const collectedBy =
    sample && sample.status === 'collected' ? sample.collectedBy : undefined;

  const catalogTest = catalogTests.find(t => t.code === test.testCode);
  const testResults = [buildTestResultEntry(test, catalogTest, getUserName)];

  const orderWithPatientInfo = {
    ...order,
    patientPhone: patient?.phone,
    patientEmail: patient?.email,
  };

  return {
    order: orderWithPatientInfo,
    patientId: validatedTest.patientId,
    patientName: validatedTest.patientName,
    patientAge: validatedTest.patientAge,
    patientGender: validatedTest.patientGender,
    timestamps: {
      registeredAt: order.orderDate || order.createdAt,
      collectedAt,
      reportedAt: test.resultValidatedAt || new Date().toISOString(),
    },
    sampleCollection: {
      collectedAt,
      collectedBy,
      address: companyConfig.getContact().address.fullAddress,
    },
    testResults,
  };
}

export async function downloadValidatedTestReport(
  validatedTest: ValidatedTest,
  reportData: ValidatedTestReportPayload,
  generateLabReport: (data: ValidatedTestReportPayload) => jsPDF,
  downloadPDF: (doc: jsPDF, filename: string) => void,
  formatDate: (date: Date) => string
): Promise<void> {
  const doc = generateLabReport(reportData);
  const filename = `Lab_Report_TST${validatedTest.testId.toString().padStart(6, '0')}_${formatDate(new Date())}.pdf`;
  downloadPDF(doc, filename);
}
