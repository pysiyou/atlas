/**
 * Formatting Utilities
 * Common formatting functions for dates, currency, phone numbers, etc.
 */

import { format, parseISO, isValid } from 'date-fns';

/**
 * Format a date string or Date object to a human-readable format
 * @param date - ISO date string or Date object
 * @param formatStr - date-fns format string (default: 'MMM d, yyyy')
 * @returns Formatted date string or empty string if invalid
 */
export function formatDate(date: string | Date | undefined | null, formatStr = 'MMM d, yyyy'): string {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return '';
    return format(dateObj, formatStr);
  } catch {
    return '';
  }
}

/**
 * Format a number as currency (USD)
 * @param amount - Number to format
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Format a phone number to (XXX) XXX-XXXX format
 * @param phone - Phone number string
 * @returns Formatted phone number or original string if invalid
 */
export function formatPhoneNumber(phone: string | undefined | null): string {
  if (!phone) return '';
  
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX if 10 digits
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  
  // Return original if not 10 digits
  return phone;
}

/**
 * Calculate age from date of birth
 * @param dateOfBirth - ISO date string or Date object
 * @returns Age in years
 */
export function calculateAge(dateOfBirth: string | Date | undefined | null): number {
  if (!dateOfBirth) return 0;
  
  try {
    const birthDate = typeof dateOfBirth === 'string' ? parseISO(dateOfBirth) : dateOfBirth;
    if (!isValid(birthDate)) return 0;
    
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  } catch {
    return 0;
  }
}
