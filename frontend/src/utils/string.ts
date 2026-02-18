/**
 * String Formatting Utilities
 */

import { parseISO, isValid } from 'date-fns';

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
  if (hours < 24) return `${hours}h`;
  if (hours === 24) return '1 day';
  if (hours < 168) {
    const days = Math.round(hours / 24);
    return `${days} day${days > 1 ? 's' : ''}`;
  }
  const weeks = Math.round(hours / 168);
  return `${weeks} week${weeks > 1 ? 's' : ''}`;
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
