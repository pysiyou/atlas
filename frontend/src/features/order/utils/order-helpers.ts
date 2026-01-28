/**
 * Order Helper Functions
 * Pure utility functions for order data (no business logic)
 */

import type { Order } from '@/types';

/**
 * Check if order has any tests
 */
export const hasTests = (order: Order): boolean => {
  return order.tests && order.tests.length > 0;
};

/**
 * Get count of tests in order
 */
export const getTestCount = (order: Order): number => {
  return order.tests?.length || 0;
};

/**
 * Check if order is paid
 */
export const isOrderPaid = (order: Order): boolean => {
  return order.paymentStatus === 'paid';
};

/**
 * Check if order is completed
 */
export const isOrderCompleted = (order: Order): boolean => {
  return order.overallStatus === 'completed';
};
