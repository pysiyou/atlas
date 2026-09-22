/** Human-readable duration from decimal hours (lab Today step averages). */
export function formatStepDurationHours(hours: number | null | undefined): string {
  if (hours == null || Number.isNaN(hours)) {
    return '—';
  }
  if (hours < 1 / 60) {
    return '<1m';
  }
  if (hours < 1) {
    return `${Math.max(1, Math.round(hours * 60))}m`;
  }
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  if (minutes <= 0) {
    return `${wholeHours}h`;
  }
  return `${wholeHours}h ${minutes}m`;
}
