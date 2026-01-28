/**
 * Lab Reports Types
 */

import type { Order } from '@/types';

export interface ReportData {
  order: Order;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  testResults: Array<{
    testCode: string;
    testName: string;
    parameters: Array<{
      name: string;
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
