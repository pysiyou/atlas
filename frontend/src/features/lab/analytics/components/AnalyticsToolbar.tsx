/**
 * AnalyticsToolbar
 * Top control bar: date range button, compare-to dropdown, Customize Widget, Export Data.
 */

import React from 'react';
import { Button, Icon } from '@/shared/ui';
import { cn, ICONS } from '@/utils';
import { inputBase } from '@/shared/ui/inputStyles';
import type { DateRangeFilter } from '../types';

export type DateRangePreset = 'thisWeek' | 'last7' | 'last30' | 'last90';
export type CompareToOption = 'none' | 'lastWeek' | 'previousPeriod';

export interface AnalyticsToolbarProps {
  dateRange: DateRangeFilter;
  dateRangeLabel: string;
  dateRangePreset: DateRangePreset;
  onDateRangePreset: (preset: DateRangePreset) => void;
  compareTo: CompareToOption;
  onCompareToChange: (value: CompareToOption) => void;
  onExportData: () => void;
  onCustomizeWidget?: () => void;
}

const PRESET_OPTIONS: Array<{ value: DateRangePreset; label: string }> = [
  { value: 'thisWeek', label: 'This Week' },
  { value: 'last7', label: 'Last 7 days' },
  { value: 'last30', label: 'Last 30 days' },
  { value: 'last90', label: 'Last 90 days' },
];

export const AnalyticsToolbar: React.FC<AnalyticsToolbarProps> = ({
  dateRangePreset,
  onDateRangePreset,
  compareTo,
  onCompareToChange,
  onExportData,
  onCustomizeWidget,
}) => (
  <div className="flex flex-wrap items-center justify-between gap-4 py-2">
    <div className="flex flex-wrap items-center gap-3">
      <div className="inline-flex items-center rounded-md border border-brand bg-brand-muted text-brand-fg overflow-hidden">
        <Icon name={ICONS.dataFields.date ?? 'calendar'} className="w-4 h-4 ml-2 shrink-0" />
        <select
          value={dateRangePreset}
          onChange={(e) => onDateRangePreset(e.target.value as DateRangePreset)}
          className="bg-transparent text-sm font-normal py-2 pl-2 pr-8 focus:outline-none cursor-pointer text-brand-fg"
        >
          {PRESET_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <span className="text-sm text-text-tertiary">Compare to</span>
      <select
        value={compareTo}
        onChange={(e) => onCompareToChange(e.target.value as CompareToOption)}
        className={cn(inputBase, 'cursor-pointer')}
      >
        <option value="none">None</option>
        <option value="lastWeek">Last Week</option>
        <option value="previousPeriod">Previous Period</option>
      </select>
    </div>
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onCustomizeWidget ?? (() => {})}
        className="inline-flex items-center gap-2"
      >
        <Icon name="dashboard" className="w-4 h-4" />
        Customize Widget
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onExportData}
        className="inline-flex items-center gap-2"
      >
        <Icon name="download" className="w-4 h-4" />
        Export Data
      </Button>
    </div>
  </div>
);
