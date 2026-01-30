/**
 * Command Center Types
 * Operational dashboard: critical alerts, workflow counts, escalation
 */

import type { PendingEscalationItem } from '@/types/lab-operations';

/** Single critical/panic value alert (un-notified) */
export interface CriticalAlert {
  patientId: number;
  patientName: string;
  orderId: number;
  testCode: string;
  testName: string;
  parameterName: string;
  value: string | number;
  unit: string;
  criticalType: 'high' | 'low';
  criticalThreshold: number;
  acknowledgedAt?: string;
  notifiedAt?: string;
}

/** Rejected sample summary for pre-analytical queue */
export interface RejectedSampleSummary {
  sampleId: number;
  orderId: number;
  patientName: string;
  rejectionReasons?: string[];
}

/** Retest queue item (analytical) */
export interface RetestItem {
  orderId: number;
  testCode: string;
  testName: string;
  patientName: string;
  attemptCount: number;
  maxAttempts: number;
  lastReason: string;
}

/** Workflow stage counts and lists for funnel */
export interface WorkflowCounts {
  pendingCollection: number;
  rejectedSamples: number;
  pendingResults: number;
  retestQueue: number;
  pendingValidation: number;
  partiallyValidated: number;
}

/** Aggregated command center data */
export interface CommandCenterData {
  criticalAlerts: CriticalAlert[];
  statUrgentOrders: number;
  workflow: {
    preAnalytical: { pending: number; rejected: RejectedSampleSummary[] };
    analytical: { pending: number; retestQueue: RetestItem[] };
    postAnalytical: { pending: number; partiallyValidated: number };
  };
  escalatedCases: PendingEscalationItem[];
  lastUpdated: Date;
  isLoading: boolean;
  refetch: () => void;
}

/** Command center data with actions (from useCommandCenterData) */
export interface CommandCenterDataWithActions extends CommandCenterData {
  notifyDoctor: (alert: CriticalAlert) => void;
  isNotifying: boolean;
}
