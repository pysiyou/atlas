/**
 * Quick date-range presets as a chip row.
 */

import React from 'react';
import { ChipSelectGroup } from '@/components/inputs/ChipSelectGroup';
import {
  DATE_PRESETS,
  getDateRangeFromPreset,
  getActivePresetId,
  type DatePreset,
} from '@/utils/date';

export interface DatePresetChipSelectProps {
  value: [Date, Date] | null;
  onChange: (value: [Date, Date] | null) => void;
}

export const DatePresetChipSelect: React.FC<DatePresetChipSelectProps> = ({ value, onChange }) => {
  const activePresetId = getActivePresetId(value);
  return (
    <ChipSelectGroup
      options={DATE_PRESETS.map(p => ({ id: p.id, label: p.label }))}
      selectedId={activePresetId}
      onSelectedIdChange={id => {
        if (id == null || activePresetId === id) onChange(null);
        else onChange(getDateRangeFromPreset(id as DatePreset));
      }}
    />
  );
};
