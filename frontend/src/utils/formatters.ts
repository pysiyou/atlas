/**
 * Formatting Utilities
 */

import { format, parseISO } from 'date-fns';

/**
 * Format currency amount
 */
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

/**
 * Format date to readable format
 */
export const formatDate = (date: string | Date | undefined | null): string => {
  if (!date) return 'N/A';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValidDate(dateObj)) return 'Invalid Date';
  return format(dateObj, 'MMM dd, yyyy');
};

/**
 * Format date and time to readable format
 */
export const formatDateTime = (date: string | Date | undefined | null): string => {
  if (!date) return 'N/A';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValidDate(dateObj)) return 'Invalid Date';
  return format(dateObj, 'MMM dd, yyyy HH:mm');
};

/**
 * Format time only
 */
export const formatTime = (date: string | Date | undefined | null): string => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValidDate(dateObj)) return '';
  return format(dateObj, 'HH:mm');
};

/**
 * Calculate age from date of birth
 */
export const calculateAge = (dateOfBirth: string | Date | undefined): number => {
  if (!dateOfBirth) return 0;
  const dob = typeof dateOfBirth === 'string' ? parseISO(dateOfBirth) : dateOfBirth;
  
  if (!isValidDate(dob)) return 0;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  
  return age;
};

const isValidDate = (d: any): d is Date => {
  return d instanceof Date && !isNaN(d.getTime());
};

/**
 * Format phone number to standard format
 */
export const formatPhoneNumber = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  
  return phone;
};

/**
 * Format patient name to title case
 */
export const formatName = (name: string): string => {
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Format test result with unit
 */
export const formatTestResult = (value: string | number, unit?: string): string => {
  if (unit) {
    return `${value} ${unit}`;
  }
  return String(value);
};

/**
 * Truncate text to specified length
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};
