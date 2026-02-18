/**
 * Analytics Types
 * Type definitions for lab analytics and metrics
 */

/** Daily TAT/compliance for trend charts */
export interface TATTrendPoint {
  date: string;
  averageTAT: number;
  complianceRate: number;
}

export interface TATMetrics {
  averageTAT: number; // minutes
  medianTAT: number;
  targetTAT: number;
  complianceRate: number; // percentage
  breakdown: {
    orderToCollection: number;
    collectionToEntry: number;
    entryToValidation: number;
  };
  /** Daily series for "TAT Over Time" / "Compliance Over Time" charts */
  trend?: TATTrendPoint[];
}

export interface VolumeMetrics {
  total: number;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
  trend: Array<{ date: string; count: number }>;
}

export interface RejectionMetrics {
  sampleRejections: {
    total: number;
    rate: number; // percentage
    topReasons: Array<{ reason: string; count: number }>;
  };
  resultRejections: {
    total: number;
    rate: number;
    retestCount: number;
    recollectCount: number;
  };
}

export interface CriticalValueMetrics {
  total: number;
  acknowledged: number;
  pending: number;
  averageResponseTime: number; // minutes
  byTest: Array<{ testCode: string; testName: string; count: number }>;
}

export interface ProductivityMetrics {
  totalResultsEntered: number;
  totalValidations: number;
  byTechnician: Array<{
    userId: number;
    userName: string;
    resultsEntered: number;
    validations: number;
  }>;
}

export interface BacklogMetrics {
  pendingCollection: number;
  pendingEntry: number;
  pendingValidation: number;
  oldestPending: {
    collection?: string; // ISO date
    entry?: string;
    validation?: string;
  };
}

/** Lab funnel: Orders → Collected → Entered → Validated */
export interface FunnelMetrics {
  orders: number;
  collected: number;
  entered: number;
  validated: number;
}

/** Period-over-period percentage deltas for trend indicators */
export interface PeriodChange {
  totalTests?: number;
  averageTAT?: number;
  complianceRate?: number;
  validatedPercent?: number;
}

export interface LabAnalytics {
  tat: TATMetrics;
  volume: VolumeMetrics;
  rejections: RejectionMetrics;
  criticalValues: CriticalValueMetrics;
  productivity: ProductivityMetrics;
  backlog: BacklogMetrics;
  funnel: FunnelMetrics;
  generatedAt: string;
}

export interface DateRangeFilter {
  startDate: string;
  endDate: string;
}
