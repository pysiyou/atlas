import type { Order } from '@/types';
import { getOrderTests } from '@/types';
import { getActiveTests } from './orderCalculator';

/**
 * Timeline steps for order progress visualization.
 *
 * The order workflow follows this sequence:
 * 1. Order Created - Order placed in system
 * 2. Payment Received - Patient completes payment (required before sample collection)
 * 3. Sample Collected - Physical sample obtained from patient
 * 4. Results Entered - Lab technician enters test results
 * 5. Completed - All results validated by lab tech plus/supervisor
 */
export const STATUS_TIMELINE_STEPS = [
  { status: 'created', label: 'Order Created' },
  { status: 'paid', label: 'Payment Received' },
  { status: 'sample-collected', label: 'Sample Collected' },
  { status: 'results-entered', label: 'Results Entered' },
  { status: 'completed', label: 'Completed' },
] as const;

/**
 * Test statuses that indicate a test has reached or passed each order step.
 * Used to calculate progress for test-based steps.
 */
const TEST_STATUS_THRESHOLDS: Record<string, string[]> = {
  'sample-collected': ['sample-collected', 'resulted', 'validated', 'cancelled'],
  'results-entered': ['resulted', 'validated'],
  completed: ['validated'], // Order is completed when all tests are validated
};

export interface StepProgress {
  /** Number of tests that have completed this step */
  completed: number;
  /** Total number of tests in the order */
  total: number;
  /** Percentage of tests completed (0-100) */
  percentage: number;
  /** True if all tests have completed this step */
  isFullyComplete: boolean;
  /** True if some but not all tests have completed this step */
  isPartial: boolean;
  /** True if at least one test has started this step */
  isStarted: boolean;
}

/**
 * Calculate the progress of tests through a specific order step.
 * Returns the count and percentage of tests that have reached or passed this step.
 *
 * @param order - The order to check progress for
 * @param stepStatus - The timeline step status to check
 * @returns StepProgress object with completion details
 */
export const getOrderStepProgress = (order: Order, stepStatus: string): StepProgress => {
  const emptyProgress: StepProgress = {
    completed: 0,
    total: 0,
    percentage: 0,
    isFullyComplete: false,
    isPartial: false,
    isStarted: false,
  };

  const activeTests = getActiveTests(getOrderTests(order));
  const total = activeTests.length;

  if (total === 0) {
    return emptyProgress;
  }

  // Step 1: Order Created - Always complete when order exists
  if (stepStatus === 'created') {
    return {
      completed: total,
      total,
      percentage: 100,
      isFullyComplete: true,
      isPartial: false,
      isStarted: true,
    };
  }

  // Step 2: Payment Received - Based on order payment status
  if (stepStatus === 'paid') {
    const isPaid = order.paymentStatus === 'paid';
    return {
      completed: isPaid ? total : 0,
      total,
      percentage: isPaid ? 100 : 0,
      isFullyComplete: isPaid,
      isPartial: false,
      isStarted: true, // Always show as started since it's a required step
    };
  }

  // Steps 3-5: Test-based progress (sample-collected, results-entered, completed)
  const validStatuses = TEST_STATUS_THRESHOLDS[stepStatus] || [];
  if (validStatuses.length === 0) {
    return emptyProgress;
  }

  const completed = activeTests.filter(t => validStatuses.includes(t.status)).length;
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

