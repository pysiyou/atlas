/**
 * Status Helper Utilities
 */

// import type { OrderStatus, TestStatus, AppointmentStatus, PaymentStatus } from '../types'; // All unused now

/**
 * Format status text for display
 */
export const formatStatus = (status: string): string => {
  return status
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
