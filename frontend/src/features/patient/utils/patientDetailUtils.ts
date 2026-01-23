/**
 * Patient Detail Utility Functions
 * Pure functions for formatting and data transformation
 */

import type { Patient, Order } from '@/types';

/**
 * Formats a date to a readable string
 */
export const formatDetailDate = (
  date: string | Date,
  format: 'long' | 'short' = 'long'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (format === 'long') {
    return dateObj.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  return dateObj.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Formats an array of strings into a comma-separated list or returns fallback
 */
export const formatList = (items: string[] | undefined, fallback: string = 'None'): string => {
  if (!items || items.length === 0) return fallback;
  return items.join(', ');
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
 */
export const formatOrderPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
};
