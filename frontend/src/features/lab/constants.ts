/**
 * Lab Feature Constants
 * Centralized constants for lab workflows
 */

import type { SampleStatus, TestStatus } from '@/types';

/**
 * Sample status values used in lab workflows
 */
export const LAB_SAMPLE_STATUSES = {
  PENDING: 'pending' as SampleStatus,
  COLLECTED: 'collected' as SampleStatus,
  REJECTED: 'rejected' as SampleStatus,
  SAMPLE_COLLECTED: 'sample-collected' as SampleStatus,
  IN_PROGRESS: 'in-progress' as SampleStatus,
  RESULTED: 'resulted' as TestStatus,
} as const;

/**
 * Test status values used in lab workflows
 */
export const LAB_TEST_STATUSES = {
  PENDING: 'pending' as TestStatus,
  IN_PROGRESS: 'in-progress' as TestStatus,
  COMPLETED: 'completed' as TestStatus,
  VALIDATED: 'validated' as TestStatus,
  REJECTED: 'rejected' as TestStatus,
} as const;

/**
 * Filter options for lab workflows
 */
export const LAB_FILTER_OPTIONS = {
  STATUS: Object.values(LAB_SAMPLE_STATUSES),
} as const;
