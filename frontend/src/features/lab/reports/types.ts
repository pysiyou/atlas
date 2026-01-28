/**
 * Lab Reports Types
 */

import type { Order, OrderTest } from '@/types';

/**
 * ValidatedTest - Represents a single validated test ready for reporting
 * Each test gets its own report
 */
export interface ValidatedTest {
  // Test identification
  testId: number;
  testCode: string;
  testName: string;
  
  // Order context
  orderId: number;
  orderDate: string;
  
  // Patient context
  patientId: number;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  
  // Test data
  test: OrderTest;
  order: Order;
}

/**
 * ReportData - Data structure for generating a single test report
 */
export interface ReportData {
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
    registeredAt?: string; // Order creation date
    collectedAt?: string; // Sample collection date
    reportedAt?: string; // Report generation date
  };
  testResults: Array<{
    testCode: string;
    testName: string;
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
