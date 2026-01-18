/**
 * ID Generation Utilities
 * Functions for generating unique IDs for various entities
 */

import { format } from 'date-fns';

/**
 * Generate a unique patient ID
 * Format: PAT-YYYYMMDD-XXX
 */
export function generatePatientId(existingIds: string[] = []): string {
  const dateStr = format(new Date(), 'yyyyMMdd');
  const prefix = `PAT-${dateStr}-`;
  
  // Find the highest existing number for today
  const todayIds = existingIds.filter(id => id.startsWith(prefix));
  const maxNum = todayIds.reduce((max, id) => {
    const num = parseInt(id.replace(prefix, ''), 10);
    return isNaN(num) ? max : Math.max(max, num);
  }, 0);
  
  return `${prefix}${String(maxNum + 1).padStart(3, '0')}`;
}

/**
 * Generate a unique order ID
 * Format: ORD-YYYYMMDD-XXX
 */
export function generateOrderId(existingIds: string[] = []): string {
  const dateStr = format(new Date(), 'yyyyMMdd');
  const prefix = `ORD-${dateStr}-`;
  
  const todayIds = existingIds.filter(id => id.startsWith(prefix));
  const maxNum = todayIds.reduce((max, id) => {
    const num = parseInt(id.replace(prefix, ''), 10);
    return isNaN(num) ? max : Math.max(max, num);
  }, 0);
  
  return `${prefix}${String(maxNum + 1).padStart(3, '0')}`;
}

/**
 * Generate a unique invoice ID
 * Format: INV-YYYYMMDD-XXX
 */
export function generateInvoiceId(existingIds: string[] = []): string {
  const dateStr = format(new Date(), 'yyyyMMdd');
  const prefix = `INV-${dateStr}-`;
  
  const todayIds = existingIds.filter(id => id.startsWith(prefix));
  const maxNum = todayIds.reduce((max, id) => {
    const num = parseInt(id.replace(prefix, ''), 10);
    return isNaN(num) ? max : Math.max(max, num);
  }, 0);
  
  return `${prefix}${String(maxNum + 1).padStart(3, '0')}`;
}
