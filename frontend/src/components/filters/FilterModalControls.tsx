/**
 * Modal filter controls: search (shared), price slider (shared range), radio list.
 * Uses OverlaySearchInput and OverlayRangeSlider from @/components/overlays.
 */

import React from 'react';
import { RADIUS } from '@/components/theme/recipes';
import { Icon } from '@/components';
import { uppercaseLabel, cn } from '@/utils';
import { ICONS } from '@/config/icons';
import { OverlaySearchInput, OverlayRangeSlider } from '@/components';

export const ModalSearchInput = OverlaySearchInput;

export const ModalPriceSlider: React.FC<{
  value: [number, number];
  onChange: (value: [number, number]) => void;
  min: number;
  max: number;
  currency?: string;
}> = ({ value, onChange, min, max, currency = '$' }) => (
  <OverlayRangeSlider
    value={value}
    onChange={onChange}
    min={min}
    max={max}
    boundLabels={{ min: 'Min price', max: 'Max price' }}
    valuePrefix={currency}
    formatValue={v => v.toLocaleString()}
    onReset={() => onChange([min, max])}
  />
);

export const ModalRadioList: React.FC<{
  options: { id: string; label: string }[];
  selectedId: string | null;
  onChange: (id: string | null) => void;
  columns?: 1 | 2;
}> = ({ options, selectedId, onChange, columns = 1 }) => (
  <div className={cn(columns === 2 ? 'grid grid-cols-2 gap-x-space-6 gap-y-space-2' : 'space-y-space-2')}>
    {options.map(option => {
      const isSelected = selectedId === option.id;
      return (
        <label
          key={option.id}
          className="flex items-center gap-space-3 cursor-pointer group py-space-1 transition-colors"
        >
          <div className="relative flex items-center justify-center shrink-0">
            <input
              type="radio"
              checked={isSelected}
              onChange={() => onChange(selectedId === option.id ? null : option.id)}
              className="sr-only"
            />
            <div
              className={cn(
                `w-5 h-5 ${RADIUS.pill} flex items-center justify-center transition-colors`,
                isSelected
                  ? 'bg-brand'
                  : 'bg-transparent border-2 border-border-strong group-hover:border-brand'
              )}
            >
              {isSelected && <Icon name={ICONS.actions.check} className="w-3 h-3 text-on-brand" />}
            </div>
          </div>
          <span
            className={cn(
              'text-sm transition-colors',
              isSelected ? 'text-text-primary' : 'text-text-secondary group-hover:text-text-primary'
            )}
          >
            {uppercaseLabel(option.label)}
          </span>
        </label>
      );
    })}
  </div>
);
