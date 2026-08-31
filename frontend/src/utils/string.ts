/**
 * String Formatting Utilities
 */

import { parseISO, isValid } from 'date-fns';
import { formatDurationHours } from './formatDuration.utils';

export function formatPhoneNumber(phone: string | undefined | null): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

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

export function getInitials(name: string | undefined | null): string {
  if (!name || typeof name !== 'string') return '??';
  const trimmedName = name.trim();
  if (trimmedName === 'N/A') return 'NA';
  const parts = trimmedName.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatTurnaroundTime(hours: number): string {
  return formatDurationHours(hours);
}

export function capitalizeLabel(s: string | undefined | null): string {
  if (!s || typeof s !== 'string') return '';
  const t = s.trim();
  return t.length === 0 ? '' : t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

export function uppercaseLabel(s: string | undefined | null): string {
  if (!s || typeof s !== 'string') return '';
  return s.trim().toUpperCase();
}

export function formatStatus(status: string): string {
  return status
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** Title-case each word in a string. */
export function titleCaseWords(s: string): string {
  return s
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/** Capitalize first letter of a string. */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Format boolean as Yes/No with fallback for undefined. */
export function formatBoolean(val: boolean | undefined, fallback = '-'): string {
  if (val === undefined) return fallback;
  return val ? 'Yes' : 'No';
}
