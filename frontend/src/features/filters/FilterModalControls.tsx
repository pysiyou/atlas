/**
 * Modal filter controls: search (shared), price slider (shared range), radio list.
 * Uses shared ModalDebouncedSearch and ModalRangeSlider from @/shared/ui/forms.
 */

import React from 'react';
import { Icon } from '@/shared/ui';
import { ICONS, uppercaseLabel, cn } from '@/utils';
import { ModalDebouncedSearch, ModalRangeSlider } from '@/shared/ui/forms';

export const ModalSearchInput = ModalDebouncedSearch;

export const ModalPriceSlider: React.FC<{
  value: [number, number];
  onChange: (value: [number, number]) => void;
  min: number;
  max: number;
  currency?: string;
}> = ({ value, onChange, min, max, currency = '$' }) => (
  <ModalRangeSlider
    value={value}
    onChange={onChange}
    min={min}
    max={max}
    hint="Move the slider to change prices"
    formatLabel={v => `${currency}${v}`}
  />
);

export const ModalRadioList: React.FC<{
  options: { id: string; label: string }[];
  selectedId: string | null;
  onChange: (id: string | null) => void;
  columns?: 1 | 2;
}> = ({ options, selectedId, onChange, columns = 1 }) => (
  <div className={cn(columns === 2 ? 'grid grid-cols-2 gap-x-6 gap-y-2' : 'space-y-2')}>
    {options.map(option => {
      const isSelected = selectedId === option.id;
      return (
        <label key={option.id} className="flex items-center gap-3 cursor-pointer group py-1 transition-colors">
          <div className="relative flex items-center justify-center shrink-0">
            <input type="radio" checked={isSelected} onChange={() => onChange(selectedId === option.id ? null : option.id)} className="sr-only" />
            <div className={cn('w-5 h-5 rounded-full flex items-center justify-center transition-colors', isSelected ? 'bg-brand' : 'bg-transparent border-2 border-stroke-strong group-hover:border-brand')}>
              {isSelected && <Icon name={ICONS.actions.check} className="w-3 h-3 text-on-brand" />}
            </div>
          </div>
          <span className={cn('text-sm transition-colors', isSelected ? 'text-fg' : 'text-fg-muted group-hover:text-fg')}>{uppercaseLabel(option.label)}</span>
        </label>
      );
    })}
  </div>
);
