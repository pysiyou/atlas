/**
 * Display helpers for user management UI.
 */
import { formatDateTime } from '@/utils';

/**
 * Format account timestamps for tables and modals.
 */
export function formatUserTimestamp(value: string | null | undefined): string {
  return formatDateTime(value) || 'Never';
}
