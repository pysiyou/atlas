import type { Order } from '@/types';

/**
 * Timeline steps for order progress visualization.
 *
 * The order workflow follows this sequence:
 * 1. Order Created - Order placed in system
 * 2. Payment Received - Patient completes payment (required before sample collection)
 * 3. Sample Collected - Physical sample obtained from patient
 * 4. Results Entered - Lab technician enters test results
 * 5. Completed - All results validated by pathologist/supervisor
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
  'sample-collected': ['sample-collected', 'in-progress', 'resulted', 'validated', 'rejected'],
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

  // Filter out superseded and removed tests - only count active tests toward progress
  // Superseded tests have been replaced by retests and removed tests have been removed from order
  const activeTests = order.tests.filter(t => t.status !== 'superseded' && t.status !== 'removed');
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

/**
 * Calculate the overall order progress as a weighted percentage based on all tests.
 * Each test contributes equally, and progress is based on how far each test has advanced.
 *
 * The weighting accounts for the full workflow:
 * - pending: 0% (order created, awaiting payment/collection)
 * - sample-collected: 25% (sample obtained)
 * - in-progress: 50% (analysis started)
 * - completed: 75% (results entered, awaiting validation)
 * - validated: 100% (results validated and ready)
 *
 * @param order - The order to calculate progress for
 * @returns Overall progress percentage (0-100)
 */
export const getOverallOrderProgress = (order: Order): number => {
  if (order.tests.length === 0) return 0;

  // Weight for each test status (0-100 scale)
  const statusWeights: Record<string, number> = {
    pending: 0,
    'sample-collected': 25,
    'in-progress': 50,
    completed: 75,
    validated: 100,
    rejected: 100, // Rejected tests are considered "done" for progress purposes
    superseded: 0, // Superseded tests don't count toward progress
  };

  // Filter out superseded and removed tests from progress calculation
  const activeTests = order.tests.filter(t => t.status !== 'superseded' && t.status !== 'removed');
  if (activeTests.length === 0) return 0;

  const totalWeight = activeTests.reduce((sum, test) => {
    return sum + (statusWeights[test.status] ?? 0);
  }, 0);

  return Math.round(totalWeight / activeTests.length);
};

/**
 * Get completion information for a specific step in the order timeline.
 * Returns the user who completed the step and when.
 *
 * @param order - The order to get completion info for
 * @param stepStatus - The timeline step to check
 * @returns Object with completedBy user ID and completedAt timestamp
 */
export const getStepCompletionInfo = (
  order: Order,
  stepStatus: string
): { completedBy?: string; completedAt?: string } => {
  switch (stepStatus) {
    case 'created':
      return {
        completedBy: order.createdBy.toString(),
        completedAt: order.orderDate,
      };

    case 'paid':
      // Payment completion - use paidAt if available, otherwise fall back to updatedAt
      if (order.paymentStatus === 'paid') {
        return {
          completedBy: order.createdBy.toString(),
          completedAt: order.paidAt || order.updatedAt,
        };
      }
      return {};

    case 'sample-collected': {
      // Find the first test that has been collected
      const collectedTest = order.tests.find(t =>
        ['sample-collected', 'in-progress', 'resulted', 'validated', 'rejected'].includes(t.status)
      );
      return {
        completedBy: order.createdBy.toString(),
        completedAt: collectedTest ? order.updatedAt : undefined,
      };
    }

    case 'results-entered': {
      // Find the first test with results entered
      const enteredTest = order.tests.find(t => ['resulted', 'validated'].includes(t.status));
      return {
        completedBy: enteredTest?.enteredBy,
        completedAt: enteredTest?.resultEnteredAt,
      };
    }

    case 'completed': {
      // Find the first validated test (order is completed when all tests validated)
      const validatedTest = order.tests.find(t => t.status === 'validated');
      return {
        completedBy: validatedTest?.validatedBy,
        completedAt: validatedTest?.resultValidatedAt,
      };
    }

    default:
      return {};
  }
};

/**
 * Check if a step is blocked by a previous incomplete step.
 * Used to show "locked" state for steps that can't proceed yet.
 *
 * @param order - The order to check
 * @param stepStatus - The step to check if blocked
 * @returns True if the step is blocked by a previous incomplete step
 */
export const isStepBlocked = (order: Order, stepStatus: string): boolean => {
  // Sample collection and beyond is blocked if payment is not received
  const paymentRequired = ['sample-collected', 'results-entered', 'completed'];
  if (paymentRequired.includes(stepStatus) && order.paymentStatus !== 'paid') {
    return true;
  }
  return false;
};

// Legacy function - kept for backward compatibility
export const getOrderStepStatus = (order: Order, stepStatus: string): boolean => {
  const progress = getOrderStepProgress(order, stepStatus);
  return progress.isStarted;
};

/**
 * Check if an order contains any validated tests.
 *
 * This is used to prevent contradictory actions:
 * - Sample rejection when a test from the order is already validated
 * - Re-collect option during result validation when another test is validated
 *
 * Once a test is validated, the sample cannot be rejected or recollected
 * because it would invalidate the already-validated results.
 *
 * @param order - The order to check
 * @returns True if the order has at least one validated test
 */
export const orderHasValidatedTests = (order: Order): boolean => {
  if (!order?.tests || order.tests.length === 0) {
    return false;
  }
  return order.tests.some(test => test.status === 'validated');
};

/**
 * Get the count of validated tests in an order.
 * Useful for displaying more detailed blocking messages.
 *
 * @param order - The order to check
 * @returns Number of validated tests
 */
export const getValidatedTestCount = (order: Order): number => {
  if (!order?.tests || order.tests.length === 0) {
    return 0;
  }
  return order.tests.filter(test => test.status === 'validated').length;
};
