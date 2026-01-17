import type { Order } from '@/types';

export const STATUS_TIMELINE_STEPS = [
  { status: 'ordered', label: 'Order Created' },
  { status: 'collected', label: 'Sample Collected' },
  { status: 'in-progress', label: 'Analysis In Progress' },
  { status: 'completed', label: 'Analysis Complete' },
  { status: 'delivered', label: 'Results Delivered' },
] as const;

// Test statuses that indicate a test has reached or passed each order step
const STEP_STATUS_THRESHOLDS: Record<string, string[]> = {
  ordered: ['ordered', 'collected', 'in-progress', 'completed', 'validated', 'reported'],
  collected: ['collected', 'in-progress', 'completed', 'validated', 'reported'],
  'in-progress': ['in-progress', 'completed', 'validated', 'reported'],
  completed: ['completed', 'validated', 'reported'],
  delivered: ['reported'],
};

export interface StepProgress {
  completed: number;
  total: number;
  percentage: number;
  isFullyComplete: boolean;
  isPartial: boolean;
  isStarted: boolean;
}

/**
 * Calculate the progress of tests through a specific order step.
 * Returns the count and percentage of tests that have reached or passed this step.
 */
export const getOrderStepProgress = (order: Order, stepStatus: string): StepProgress => {
  const total = order.tests.length;
  if (total === 0) {
    return { completed: 0, total: 0, percentage: 0, isFullyComplete: false, isPartial: false, isStarted: false };
  }

  // Special case for 'ordered' - all tests are ordered when order exists
  if (stepStatus === 'ordered') {
    return { completed: total, total, percentage: 100, isFullyComplete: true, isPartial: false, isStarted: true };
  }

  const validStatuses = STEP_STATUS_THRESHOLDS[stepStatus] || [];
  const completed = order.tests.filter((t) => validStatuses.includes(t.status)).length;
  const percentage = Math.round((completed / total) * 100);

  return {
    completed,
    total,
    percentage,
    isFullyComplete: completed === total,
    isPartial: completed > 0 && completed < total,
    isStarted: completed > 0,
  };
};

/**
 * Calculate the overall order progress as a weighted percentage based on all tests.
 * Each test contributes equally, and progress is based on how far each test has advanced.
 */
export const getOverallOrderProgress = (order: Order): number => {
  if (order.tests.length === 0) return 0;

  // Weight for each test status (0-100 scale)
  const statusWeights: Record<string, number> = {
    ordered: 0,
    collected: 20,
    'in-progress': 40,
    completed: 60,
    validated: 80,
    reported: 100,
  };

  const totalWeight = order.tests.reduce((sum, test) => {
    return sum + (statusWeights[test.status] ?? 0);
  }, 0);

  return Math.round(totalWeight / order.tests.length);
};

// Legacy function - kept for backward compatibility
export const getOrderStepStatus = (order: Order, stepStatus: string): boolean => {
  const progress = getOrderStepProgress(order, stepStatus);
  return progress.isStarted;
};
