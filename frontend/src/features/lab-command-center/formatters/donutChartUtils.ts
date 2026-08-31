/**
 * Donut chart constants and shared types.
 */

export interface DonutChartSegment {
  name: string;
  value: number;
  color?: string;
  arrivedToday?: number;
  avgWaitMs?: number;
  oldestEntryAt?: string;
}

export const TOOLTIP_BG = 'var(--chart-tooltip)';
export const TOOLTIP_STROKE = 'var(--chart-tooltip-stroke)';
export const TOOLTIP_FG = 'var(--text)';
export const TOOLTIP_FG_MUTED = 'var(--text-tertiary)';

export const COLORS = [
  'var(--chart-brand)',
  'var(--chart-success)',
  'var(--chart-warning)',
  'var(--chart-danger)',
  'var(--chart-accent)',
];

export const CHART_SUCCESS = 'var(--chart-success)';

export interface SegmentWithPercent extends DonutChartSegment {
  percent: number;
}

export type PieSegment = Pick<DonutChartSegment, 'name' | 'value'> & { color?: string };

/** Format a duration in ms to a compact human string. */
export function formatDuration(ms: number): string {
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
