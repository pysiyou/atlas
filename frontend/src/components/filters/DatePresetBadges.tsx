/**
 * DatePresetBadges – shared date range preset buttons for filter modals.
 */

import React from 'react';
import { FilterChip } from '@/components';
import {
  DATE_PRESETS,
  getDateRangeFromPreset,
  getActivePresetId,
  type DatePreset,
} from '@/utils/date';

export interface DatePresetBadgesProps {
  value: [Date, Date] | null;
  onChange: (value: [Date, Date] | null) => void;
}

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
      {DATE_PRESETS.map(preset => (
        <FilterChip
          key={preset.id}
          size="sm"
          active={activePresetId === preset.id}
          onClick={() => handlePresetClick(preset.id)}
        >
          {preset.label}
        </FilterChip>
      ))}
    </div>
  );
};
