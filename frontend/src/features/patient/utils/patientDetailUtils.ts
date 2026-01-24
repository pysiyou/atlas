/**
 * Patient Detail Utility Functions
 * Pure functions for formatting and data transformation
 */

import type { Patient, Order } from '@/types';
import {
  formatDetailDate as formatDetailDateShared,
  formatArray,
  formatOrderDate,
} from '@/shared/utils/data';

/**
 * Formats a date to a readable string
 * Re-exports shared utility for backward compatibility
 */
export const formatDetailDate = (
  date: string | Date | undefined | null,
  format: 'long' | 'short' = 'long'
): string => {
  if (format === 'long') {
    return formatDetailDateShared(date);
  }
  // For short format, use the order date formatter
  return formatOrderDate(date, 'short');
};

/**
 * Formats an array of strings into a comma-separated list or returns fallback
 */
export const formatList = (items: string[] | undefined, fallback: string = 'None'): string => {
  const formatted = formatArray(items);
  return formatted || fallback;
};

/**
 * Formats familyHistory (string or string[] from API) for display
 */
export const formatFamilyHistory = (
  value: string | string[] | undefined,
  fallback: string = 'None'
): string => {
  if (value == null) return fallback;
  if (Array.isArray(value)) return formatList(value, fallback);
  return String(value).trim() || fallback;
};

/**
 * Formats an address into a single string
 */
export const formatAddress = (address: Patient['address']): string => {
  if (!address) return 'N/A';
  const parts = [address.street || 'N/A', address.city || '', address.postalCode || ''].filter(
    Boolean
  );
  return parts.join(', ') || 'N/A';
};

/**
 * Gets reportable orders (orders with validated tests)
 */
export const getReportableOrders = (orders: Order[]): Order[] => {
  return orders.filter(order => order.tests.some(test => test.status === 'validated'));
};

/**
 * Formats currency for display
 * Re-exports shared utility for backward compatibility
 */
export { formatCurrency as formatOrderPrice } from '@/shared/utils/data/currencyFormatters';
