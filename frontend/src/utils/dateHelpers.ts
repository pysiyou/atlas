import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, subMonths, isSameDay } from 'date-fns';

export const DATE_PRESETS = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'last7days', label: 'Last 7 Days' },
  { id: 'last30days', label: 'Last 30 Days' },
  { id: 'thisMonth', label: 'This Month' },
  { id: 'lastMonth', label: 'Last Month' },
] as const;

export type DatePreset = typeof DATE_PRESETS[number]['id'];

export function getDateRangeFromPreset(preset: DatePreset): [Date, Date] {
  const now = new Date();

  switch (preset) {
    case 'today':
      return [startOfDay(now), endOfDay(now)];
    case 'yesterday': {
      const yesterday = subDays(now, 1);
      return [startOfDay(yesterday), endOfDay(yesterday)];
    }
    case 'last7days':
      return [startOfDay(subDays(now, 6)), endOfDay(now)];
    case 'last30days':
      return [startOfDay(subDays(now, 29)), endOfDay(now)];
    case 'thisMonth':
      return [startOfMonth(now), endOfDay(now)];
    case 'lastMonth': {
      const lastMonth = subMonths(now, 1);
      return [startOfMonth(lastMonth), endOfDay(endOfMonth(lastMonth))];
    }
    default:
      return [startOfDay(now), endOfDay(now)];
  }
}

export function getActivePresetId(dateRange: [Date, Date] | null): DatePreset | null {
  if (!dateRange) return null;

  for (const preset of DATE_PRESETS) {
    const presetRange = getDateRangeFromPreset(preset.id);
    const startMatch = isSameDay(dateRange[0], presetRange[0]);
    const endMatch = isSameDay(dateRange[1], presetRange[1]);
    if (startMatch && endMatch) return preset.id;
  }
  return null;
}
