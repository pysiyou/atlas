/**
 * Status Constants
 * Centralized status values and labels used across the application.
 * Keys must match @/types enums (OrderStatus, PaymentStatus, etc.).
 */

import type { OrderStatus, PaymentStatus, SampleStatus, TestStatus, UserRole } from '@/types';

/**
 * Order status labels
 */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  ordered: 'Ordered',
  'in-progress': 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

/**
 * Payment status labels
 */
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: 'Unpaid',
  paid: 'Paid',
};

/**
 * Sample status labels
 */
export const SAMPLE_STATUS_LABELS: Record<SampleStatus, string> = {
  pending: 'Pending',
  collected: 'Collected',
  received: 'Received',
  accessioned: 'Accessioned',
  'in-progress': 'In Progress',
  completed: 'Completed',
  stored: 'Stored',
  disposed: 'Disposed',
  rejected: 'Rejected',
};

/**
 * Test status labels
 */
export const TEST_STATUS_LABELS: Record<TestStatus, string> = {
  pending: 'Pending',
  'sample-collected': 'Sample Collected',
  'in-progress': 'In Progress',
  resulted: 'Resulted',
  validated: 'Validated',
  rejected: 'Rejected',
  superseded: 'Superseded',
};

/**
 * User role labels
 */
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  receptionist: 'Receptionist',
  'lab-technician': 'Lab Technician',
  pathologist: 'Pathologist',
  administrator: 'Administrator',
};
