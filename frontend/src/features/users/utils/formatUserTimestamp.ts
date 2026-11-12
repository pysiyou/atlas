/**
 * Display helper for user-account audit timestamps in upsert chrome.
 */
import { formatDateTime } from '@/utils';

/**
 * Format a user created/login timestamp, or "Never" when the API sent none.
 *
 * @param value - ISO datetime string from the admin user payload
 */
export function formatUserTimestamp(value: string | null | undefined): string {
  return formatDateTime(value) || 'Never';
}
