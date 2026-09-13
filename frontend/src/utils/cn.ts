/**
 * Classname Utility
 * Conditionally join and merge Tailwind class names.
 * Uses clsx for conditional logic and tailwind-merge for conflict resolution.
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
