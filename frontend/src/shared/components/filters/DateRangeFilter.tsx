/**
 * DateRangeFilter - Date range picker component
 *
 * Provides a consistent date range selection interface.
 * Supports quick presets and custom range selection.
 */

import React, { useState } from 'react';
import { Icon } from '@/shared/ui';

export interface DateRangeFilterProps {
  /** Current date range value */
  value: [Date, Date] | null;
  /** Change handler */
  onChange: (range: [Date, Date] | null) => void;
  /** Filter label */
  label?: string;
  /** Additional CSS classes */
  className?: string;
}

/** Quick date range presets */
const PRESETS = [
  { label: 'Today', days: 0 },
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
] as const;

/**
 * DateRangeFilter component
 *
 * @example
 * ```tsx
 * <DateRangeFilter
 *   label="Order Date"
 *   value={dateRange}
 *   onChange={setDateRange}
 * />
 * ```
 */
export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  value,
  onChange,
  label = 'Date Range',
  className = '',
}) => {
  const [startDate, setStartDate] = useState<string>(value?.[0]?.toISOString().split('T')[0] || '');
  const [endDate, setEndDate] = useState<string>(value?.[1]?.toISOString().split('T')[0] || '');

  const applyPreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    if (days === 0) {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else {
      start.setDate(start.getDate() - days);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }
    onChange([start, end]);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const handleStartChange = (dateStr: string) => {
    setStartDate(dateStr);
    if (dateStr && endDate) {
      const start = new Date(dateStr);
      const end = new Date(endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      onChange([start, end]);
    }
  };

  const handleEndChange = (dateStr: string) => {
    setEndDate(dateStr);
    if (startDate && dateStr) {
      const start = new Date(startDate);
      const end = new Date(dateStr);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      onChange([start, end]);
    }
  };

  const handleClear = () => {
    onChange(null);
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-700">{label}</label>
        {value && (
          <button
            onClick={handleClear}
            className="text-xs text-sky-600 hover:text-sky-700 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Quick presets */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map(preset => (
          <button
            key={preset.label}
            onClick={() => applyPreset(preset.days)}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-colors"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Custom date inputs */}
      <div className="grid grid-cols-2 gap-2">
        <div className="relative">
          <Icon
            name="calendar"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
          />
          <input
            type="date"
            value={startDate}
            onChange={e => handleStartChange(e.target.value)}
            className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            placeholder="Start date"
          />
        </div>
        <div className="relative">
          <Icon
            name="calendar"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
          />
          <input
            type="date"
            value={endDate}
            onChange={e => handleEndChange(e.target.value)}
            className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            placeholder="End date"
          />
        </div>
      </div>
    </div>
  );
};
