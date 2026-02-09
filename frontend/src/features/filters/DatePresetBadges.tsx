/**
 * DatePresetBadges – shared date range preset buttons for filter modals.
 * Single source of truth for styling; used by FilterModal, OrderFilters, PaymentFilters, ReportFilters.
 */

import React from 'react';
import { cn } from '@/utils';
import { DATE_PRESETS, getDateRangeFromPreset, getActivePresetId, type DatePreset } from '@/utils/dateHelpers';

export interface DatePresetBadgesProps {
  value: [Date, Date] | null;
  onChange: (value: [Date, Date] | null) => void;
}

const PRESET_BUTTON_CLASS =
  'px-2 py-1.5 text-xs rounded cursor-pointer filter-chip';

export const DatePresetBadges: React.FC<DatePresetBadgesProps> = ({ value, onChange }) => {
  const activePresetId = getActivePresetId(value);

  const handlePresetClick = (presetId: DatePreset) => {
    if (activePresetId === presetId) {
      onChange(null);
    } else {
      onChange(getDateRangeFromPreset(presetId));
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {DATE_PRESETS.map(preset => {
        const isActive = activePresetId === preset.id;
        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => handlePresetClick(preset.id)}
            className={cn(PRESET_BUTTON_CLASS, isActive && 'filter-chip--active')}
          >
            {preset.label}
          </button>
        );
      })}
    </div>
  );
};
