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
  /** ISO date of birth from the report DTO; used on the printable header. */
  patientDob?: string;
  patientGender?: string;
  patientEmail?: string;
  /** Loaded for report payloads; not printed on PDF/preview. */
  patientPhone?: string;
  activeTestCount: number;
  validatedTestCount: number;
  testCodes: string[];
  testNames: string[];
  /** Present on detail/download payloads; omitted from list rows. */
  order?: Order;
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
  /** ISO date of birth for the header Date of Birth field. */
  patientDob?: string;
  patientGender?: string;
  patientEmail?: string;
  /** Present on payload for future use; omitted from printable header. */
  patientPhone?: string;
  sampleCollection?: {
    address?: string;
    collectedAt?: string;
    collectedBy?: string;
  };
  timestamps?: {
    registeredAt?: string;
    collectedAt?: string;
    /** Earliest lab processing time (result entry, else collection). */
    acceptedAt?: string;
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

/** Report preview — same as lab `ResultsGridLayout` (`table` | `grid`). */
export type { ResultsGridLayout as ReportPreviewResultsLayout } from '@/features/lab/components/ResultsParameterGrid';
