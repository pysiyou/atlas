/**
 * Command center time range options and conversions.
 */

export type CommandCenterTimeRange = '24h' | '1w' | '1m' | '3m';

export const DEFAULT_TIME_RANGE: CommandCenterTimeRange = '24h';

export const TIME_RANGE_OPTIONS: { value: CommandCenterTimeRange; label: string }[] = [
  { value: '24h', label: '24 hours' },
  { value: '1w', label: '1 week' },
  { value: '1m', label: '1 month' },
  { value: '3m', label: '3 months' },
];

const HOURS_BY_RANGE: Record<CommandCenterTimeRange, number> = {
  '24h': 24,
  '1w': 24 * 7,
  '1m': 24 * 30,
  '3m': 24 * 90,
};

export function timeRangeToHours(range: CommandCenterTimeRange): number {
  return HOURS_BY_RANGE[range];
}

export function timeRangeToDays(range: CommandCenterTimeRange): number {
  return HOURS_BY_RANGE[range] / 24;
}

export function getTimeRangeMeta(range: CommandCenterTimeRange): string {
  switch (range) {
    case '24h':
      return 'Last 24 hours';
    case '1w':
      return 'Last 7 days';
    case '1m':
      return 'Last 30 days';
    case '3m':
      return 'Last 90 days';
  }
}
