/**
 * Turnaround Time (TAT) Tracking Utilities
 * Calculates and tracks TAT metrics for laboratory orders
 * 
 * Note: Some TAT calculations require test catalog data for turnaround time targets.
 * The OrderTest type doesn't include collectedAt directly - it's tracked via Sample entity.
 */

import type { Order, OrderTest } from '@/types';

export interface TATMetrics {
  orderToCollection: number;      // minutes from order to collection
  collectionToReceived: number;   // minutes from collection to lab receipt
  receivedToResulted: number;     // minutes from receipt to result entry
  resultedToValidated: number;    // minutes from result to validation
  validatedToReported: number;    // minutes from validation to report
  totalTAT: number;               // total turnaround time in minutes
  targetTAT: number;              // target TAT in minutes
  isDelayed: boolean;             // whether TAT exceeds target
  delayMinutes: number;           // minutes over target (0 if not delayed)
}

export interface TATBreakdown {
  phase: string;
  startTime: string | null;
  endTime: string | null;
  duration: number | null;        // minutes
  isComplete: boolean;
}

/**
 * Calculate time difference in minutes
 */
function getMinutesDiff(start: string | null, end: string | null): number | null {
  if (!start || !end) return null;
  
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
}

/**
 * Calculate TAT metrics for an order
 */
export function calculateOrderTAT(order: Order): TATMetrics {
  const createdAt = order.createdAt;
  
  // Find earliest collection time (from resultEnteredAt as proxy since collectedAt not on OrderTest)
  const collectionTimes = order.tests
    .map(t => t.resultEnteredAt) // Using result entry as proxy for collection
    .filter((t): t is string => t !== undefined && t !== null);
  const earliestCollection = collectionTimes.length > 0 
    ? collectionTimes.sort()[0] 
    : null;
  
  // Find latest result entry time
  const resultTimes = order.tests
    .map(t => t.resultEnteredAt)
    .filter((t): t is string => t !== undefined && t !== null);
  const latestResult = resultTimes.length > 0 
    ? resultTimes.sort().reverse()[0] 
    : null;
  
  // Find latest validation time
  const validationTimes = order.tests
    .map(t => t.resultValidatedAt)
    .filter((t): t is string => t !== undefined && t !== null);
  const latestValidation = validationTimes.length > 0 
    ? validationTimes.sort().reverse()[0] 
    : null;
  
  // Calculate phase durations
  const orderToCollection = getMinutesDiff(createdAt, earliestCollection) || 0;
  const collectionToReceived = 0; // TODO: Add received timestamp to sample
  const receivedToResulted = earliestCollection && latestResult 
    ? getMinutesDiff(earliestCollection, latestResult) || 0 
    : 0;
  const resultedToValidated = latestResult && latestValidation 
    ? getMinutesDiff(latestResult, latestValidation) || 0 
    : 0;
  const validatedToReported = 0; // TODO: Add reported timestamp
  
  // Calculate total TAT
  const totalTAT = orderToCollection + collectionToReceived + receivedToResulted + 
                   resultedToValidated + validatedToReported;
  
  // Get target TAT (would need test catalog data - using default 24 hours)
  const targetTAT = 24 * 60; // 24 hours in minutes as default
  
  const isDelayed = totalTAT > targetTAT;
  const delayMinutes = isDelayed ? totalTAT - targetTAT : 0;
  
  return {
    orderToCollection,
    collectionToReceived,
    receivedToResulted,
    resultedToValidated,
    validatedToReported,
    totalTAT,
    targetTAT,
    isDelayed,
    delayMinutes,
  };
}

/**
 * Get TAT breakdown by phase
 */
export function getTATBreakdown(order: Order): TATBreakdown[] {
  const collectionTimes = order.tests
    .map(t => t.resultEnteredAt) // Using result entry as proxy
    .filter((t): t is string => t !== undefined && t !== null);
  const earliestCollection = collectionTimes.length > 0 
    ? collectionTimes.sort()[0] 
    : null;
  
  const resultTimes = order.tests
    .map(t => t.resultEnteredAt)
    .filter((t): t is string => t !== undefined && t !== null);
  const latestResult = resultTimes.length > 0 
    ? resultTimes.sort().reverse()[0] 
    : null;
  
  const validationTimes = order.tests
    .map(t => t.resultValidatedAt)
    .filter((t): t is string => t !== undefined && t !== null);
  const latestValidation = validationTimes.length > 0 
    ? validationTimes.sort().reverse()[0] 
    : null;
  
  return [
    {
      phase: 'Order to Collection',
      startTime: order.createdAt,
      endTime: earliestCollection,
      duration: getMinutesDiff(order.createdAt, earliestCollection),
      isComplete: earliestCollection !== null,
    },
    {
      phase: 'Collection to Lab Receipt',
      startTime: earliestCollection,
      endTime: null, // TODO: Add received timestamp
      duration: null,
      isComplete: false,
    },
    {
      phase: 'Lab Receipt to Result Entry',
      startTime: earliestCollection,
      endTime: latestResult,
      duration: getMinutesDiff(earliestCollection, latestResult),
      isComplete: latestResult !== null,
    },
    {
      phase: 'Result Entry to Validation',
      startTime: latestResult,
      endTime: latestValidation,
      duration: getMinutesDiff(latestResult, latestValidation),
      isComplete: latestValidation !== null,
    },
    {
      phase: 'Validation to Report',
      startTime: latestValidation,
      endTime: null, // TODO: Add reported timestamp
      duration: null,
      isComplete: false,
    },
  ];
}

/**
 * Calculate TAT for a specific test
 * Note: Requires test catalog data for accurate turnaround time target
 */
export function calculateTestTAT(
  test: OrderTest,
  orderCreatedAt: string,
  targetTATHours: number = 24 // Default 24 hours
): TATMetrics {
  const targetTAT = targetTATHours * 60; // Convert hours to minutes
  
  const orderToCollection = getMinutesDiff(orderCreatedAt, test.resultEnteredAt || null) || 0;
  const collectionToResulted = 0; // Would need sample collection timestamp
  const resultedToValidated = getMinutesDiff(test.resultEnteredAt || null, test.resultValidatedAt || null) || 0;
  
  const totalTAT = orderToCollection + collectionToResulted + resultedToValidated;
  const isDelayed = totalTAT > targetTAT;
  const delayMinutes = isDelayed ? totalTAT - targetTAT : 0;
  
  return {
    orderToCollection,
    collectionToReceived: 0,
    receivedToResulted: collectionToResulted,
    resultedToValidated,
    validatedToReported: 0,
    totalTAT,
    targetTAT,
    isDelayed,
    delayMinutes,
  };
}

/**
 * Format TAT duration for display
 */
export function formatTATDuration(minutes: number | null): string {
  if (minutes === null || minutes === 0) return 'N/A';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins}m`;
  }
  
  if (mins === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${mins}m`;
}

/**
 * Get TAT status color
 */
export function getTATStatusColor(tat: TATMetrics): string {
  if (tat.totalTAT === 0) return 'gray';
  
  const percentOfTarget = (tat.totalTAT / tat.targetTAT) * 100;
  
  if (percentOfTarget <= 75) return 'green';
  if (percentOfTarget <= 100) return 'yellow';
  return 'red';
}
