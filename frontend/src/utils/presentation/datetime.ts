/**
 * Presentation datetime helpers. Core formatters live in `@/utils/date`.
 */

import { formatDateTime } from '@/utils/date';

export { formatDateTime };

export function formatDateTimeOrDash(date: string | Date | null | undefined): string {
  if (!date) {
    return '—';
  }
  return formatDateTime(date);
}
