/**
 * Lab Reports Types
 */

import type { Order } from '@/types';

/**
 * ReportableOrder - One lab report row for a non-cancelled order with active tests.
 */
export interface ReportableOrder {
  orderId: number;
  orderDate: string;
  patientId: number;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  activeTestCount: number;
  validatedTestCount: number;
  order: Order;
}

/** Placeholder shown when a catalog investigation has no result yet. */
export const RESULT_NOT_AVAILABLE = 'Not available';

/**
 * LabReportPayload - Data structure for lab report preview and printable export.
 */
export interface LabReportPayload {
  order: Order;
  patientId: number;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  sampleCollection?: {
    address?: string;
    collectedAt?: string;
    collectedBy?: string;
  };
  timestamps?: {
    registeredAt?: string;
    collectedAt?: string;
    reportedAt?: string;
  };
  testResults: Array<{
    testCode: string;
    testName: string;
    /** Catalog exam category (e.g. Clinical Chemistry). */
    category: string;
    /** Common method from catalog, shown under exam title on PDF. */
    methodology?: string;
    parameters: Array<{
      name: string;
      code: string;
      value: string | number;
      unit?: string;
      referenceRange?: string;
      status?: string;
      isCritical?: boolean;
    }>;
    technicianNotes?: string;
    validationNotes?: string;
    enteredBy?: string;
    validatedBy?: string;
    validatedByName?: string;
    enteredAt?: string;
    validatedAt?: string;
  }>;
}

export interface ReportTemplate {
  name: string;
  logo?: string;
  headerText: string;
  footerText: string;
  includeSignature: boolean;
}
