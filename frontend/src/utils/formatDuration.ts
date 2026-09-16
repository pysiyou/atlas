/**
 * Unified duration formatting utilities.
 */

/** Format milliseconds to a compact human-readable string (e.g. "5m", "2h 30m"). */
export function formatDurationMs(ms: number): string {
  if (ms < 60_000) return '<1m';
  const totalMin = Math.floor(ms / 60_000);
  if (totalMin < 60) return `${totalMin}m`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h < 24) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  const d = Math.floor(h / 24);
  const rh = h % 24;
  return rh > 0 ? `${d}d ${rh}h` : `${d}d`;
}

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
