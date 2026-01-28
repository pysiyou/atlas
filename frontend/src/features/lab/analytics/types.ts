/**
 * Analytics Types
 * Type definitions for lab analytics and metrics
 */

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

export interface LabAnalytics {
  tat: TATMetrics;
  volume: VolumeMetrics;
  rejections: RejectionMetrics;
  criticalValues: CriticalValueMetrics;
  productivity: ProductivityMetrics;
  backlog: BacklogMetrics;
  generatedAt: string;
}

export interface DateRangeFilter {
  startDate: string;
  endDate: string;
}
