/**
 * Unified duration formatting utilities.
 */

/** Format hours to turnaround time string (e.g. "24h", "3 days"). */
export function formatDurationHours(hours: number): string {
  if (hours < 24) return `${hours}h`;
  if (hours === 24) return '1 day';
  if (hours < 168) {
    const days = Math.round(hours / 24);
    return `${days} day${days > 1 ? 's' : ''}`;
  }
  const weeks = Math.round(hours / 168);
  return `${weeks} week${weeks > 1 ? 's' : ''}`;
}
