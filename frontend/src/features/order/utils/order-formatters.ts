/**
 * Order Formatters
 * Pure formatting functions for order data display
 */

import { formatDate, formatCurrency } from '@/shared/utils/data';

/**
 * Formats order date for display
 */
export const formatOrderDate = (date: string | Date | undefined | null): string => {
  return formatDate(date);
};

/**
 * Formats order total price for display
 */
export const formatOrderPrice = (price: number | undefined | null): string => {
  if (price == null) return 'N/A';
  return formatCurrency(price);
};

/**
 * Formats order ID for display
 */
export const formatOrderId = (orderId: number | string): string => {
  return `ORD-${orderId}`;
};

/**
 * Formats order number for display
 */
export const formatOrderNumber = (orderNumber: string | undefined | null): string => {
  return orderNumber || 'N/A';
};
