/**
 * Status Constants
 * Centralized status values and labels used across the application
 */

import type {
  OrderStatus,
  PaymentStatus,
  SampleStatus,
  TestStatus,
  UserRole,
} from '@/types';

/**
 * Order status labels
 */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  'in-progress': 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
} as const;

/**
 * Payment status labels
 */
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: 'Unpaid',
  partial: 'Partial',
  paid: 'Paid',
} as const;

/**
 * Sample status labels
 */
export const SAMPLE_STATUS_LABELS: Record<SampleStatus, string> = {
  pending: 'Pending',
  collected: 'Collected',
  rejected: 'Rejected',
  'sample-collected': 'Sample Collected',
  'in-progress': 'In Progress',
  resulted: 'Resulted',
} as const;

/**
 * Test status labels
 */
export const TEST_STATUS_LABELS: Record<TestStatus, string> = {
  pending: 'Pending',
  'in-progress': 'In Progress',
  completed: 'Completed',
  validated: 'Validated',
  rejected: 'Rejected',
} as const;

/**
 * User role labels
 */
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  'lab-technician': 'Lab Technician',
  'lab-manager': 'Lab Manager',
  receptionist: 'Receptionist',
  doctor: 'Doctor',
} as const;
