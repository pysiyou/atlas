/**
 * Single dispatcher for bar and modal filter controls.
 */

import { type ReactNode } from 'react';
import { text, RADIUS } from '@/theme/recipes';
import { CheckboxList, Icon } from '@/components/primitives';
import { DatePicker } from '@/components/inputs/DatePicker';
import { TextInput } from '@/components/inputs/TextInput';
import { ChipSelectGroup } from '@/components/inputs/ChipSelectGroup';
import { MultiSelectFilter } from '@/components/overlays/MultiSelectFilter';
import { RangeFilterField } from './RangeFilterField';
import { RangeSlider } from '@/components/overlays/RangeSlider';
import type { FilterControl, NumberRangeFilterControl } from './types';
import { ICONS } from '@/config/icons';
import { uppercaseLabel, cn } from '@/utils';
import {
  DATE_PRESETS,
  getActivePresetId,
  getDateRangeFromPreset,
  type DatePreset,
} from '@/utils/date';

export type FilterControlSurface = 'bar' | 'modal';

export interface FilterControlProps {
  control: FilterControl;
  value: unknown;
  onChange: (value: unknown) => void;
  surface: FilterControlSurface;
  className?: string;
}

function resolveNumberRange(control: NumberRangeFilterControl) {
  const minValue = control.minValue ?? 0;
  const maxValue =
    control.maxValue ?? (control.type === 'priceRange' ? 10_000 : 150);
  let sliderMode = control.sliderMode;
  if (!sliderMode) {
    sliderMode = control.type === 'priceRange' ? 'track' : 'histogram';
  }
  const currency = control.currencySymbol ?? '$';
  const formatValue =
    control.formatValue ??
    (sliderMode === 'track'
      ? (n: number) => `${currency}${n.toLocaleString()}`
      : (n: number) => String(n));
  const formatSummary =
    control.formatSummary ??
    (sliderMode === 'track'
      ? ([lo, hi]) => `${currency}${lo.toLocaleString()} – ${currency}${hi.toLocaleString()}`
      : ([lo, hi]) => `${lo}–${hi}`);
  return { minValue, maxValue, sliderMode, formatValue, formatSummary, distribution: control.distribution };
}

function ModalRadioList({
  options,
  selectedId,
  onChange,
  columns = 1,
}: {
  options: { id: string; label: string }[];
  selectedId: string | null;
  onChange: (id: string | null) => void;
  columns?: 1 | 2;
}) {
  return (
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
                onChange={() => onChange(isSelected ? null : option.id)}
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
                `${text({ role: 'amount' })} transition-colors`,
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
}

export function FilterControl({ control, value, onChange, surface, className }: FilterControlProps) {
  const type =
    control.type === 'search' ? 'text' : control.type === 'ageRange' || control.type === 'priceRange' ? 'numberRange' : control.type;

  switch (type) {
    case 'text': {
      const textControl = control as import('./types').TextFilterControl;
      if (surface === 'modal') {
        return (
          <TextInput
            value={(value as string) || ''}
            onChange={v => onChange(v)}
            placeholder={textControl.placeholder}
            debounceMs={0}
          />
        );
      }
      return (
        <TextInput
          value={(value as string) || ''}
          onChange={onChange}
          placeholder={textControl.placeholder || `Search ${textControl.label.toLowerCase()}...`}
          debounceMs={textControl.debounceMs ?? 300}
          className={className}
          leading={
            <Icon
              name={ICONS.actions.search}
              className="w-3.5 h-3.5 shrink-0 text-text-muted group-hover:text-brand transition-colors"
            />
          }
        />
      );
    }

    case 'dateRange': {
      const dateControl = control as import('./types').DateRangeFilterControl;
      const rangeValue = (value as [Date, Date] | null) || null;
      if (surface === 'modal') {
        const activePresetId = getActivePresetId(rangeValue);
        return (
          <ChipSelectGroup
            options={DATE_PRESETS.map(p => ({ id: p.id, label: p.label }))}
            selectedId={activePresetId}
            onSelectedIdChange={id => {
              if (id == null) onChange(null);
              else onChange(getDateRangeFromPreset(id as DatePreset));
            }}
          />
        );
      }
      return (
        <DatePicker
          value={rangeValue}
          onChange={onChange}
          placeholder={dateControl.placeholder || 'Filter by date range'}
          className={className}
        />
      );
    }

    case 'numberRange': {
      const nr = resolveNumberRange(control as NumberRangeFilterControl);
      const tuple = (value as [number, number]) || [nr.minValue, nr.maxValue];
      if (surface === 'modal') {
        if (nr.sliderMode === 'track') {
          return (
            <RangeSlider
              mode="track"
              value={tuple}
              onChange={v => onChange(v)}
              minValue={nr.minValue}
              maxValue={nr.maxValue}
              formatValue={nr.formatValue}
            />
          );
        }
        return (
          <div className={`${text({ role: 'amount' })} text-text-tertiary italic`}>
            Use the main filter bar for this filter type
          </div>
        );
      }
      return (
        <RangeFilterField
          value={tuple}
          onChange={onChange}
          minValue={nr.minValue}
          maxValue={nr.maxValue}
          placeholder={(control as NumberRangeFilterControl).placeholder || 'Select range'}
          formatSummary={nr.formatSummary}
          sliderMode={nr.sliderMode}
          distribution={nr.distribution}
          formatValue={nr.formatValue}
          className={className}
        />
      );
    }

    case 'multiSelect': {
      const multi = control as import('./types').MultiSelectFilterControl;
      if (surface === 'modal') {
        return (
          <CheckboxList
            options={multi.options}
            selectedIds={(value as string[]) || []}
            onChange={v => onChange(v)}
            columns={multi.options.length > 4 ? 2 : 1}
          />
        );
      }
      return (
        <MultiSelectFilter
          label={multi.label}
          options={multi.options}
          selectedIds={(value as string[]) || []}
          onChange={onChange}
          placeholder={multi.placeholder}
          selectAllLabel={multi.selectAllLabel}
          className={className}
          icon={multi.icon as import('@/components/primitives').IconName | undefined}
        />
      );
    }

    case 'singleSelect': {
      const single = control as import('./types').SingleSelectFilterControl;
      if (surface === 'modal') {
        return (
          <ModalRadioList
            options={single.options}
            selectedId={(value as string | null) || null}
            onChange={v => onChange(v)}
            columns={single.options.length > 4 ? 2 : 1}
          />
        );
      }
      return (
        <MultiSelectFilter
          label={single.label}
          options={single.options}
          selectedIds={value ? [value as string] : []}
          onChange={ids => onChange(ids[0] ?? null)}
          placeholder={single.placeholder}
          className={className}
          singleSelect
          icon={single.icon as import('@/components/primitives').IconName | undefined}
        />
      );
    }

    default:
      return null;
  }
}

export function renderFilterControl(
  control: FilterControl,
  filterValue: unknown,
  onChange: (value: unknown) => void,
  options: { variant: FilterControlSurface; className?: string }
): ReactNode {
  return (
    <FilterControl
      control={control}
      value={filterValue}
      onChange={onChange}
      surface={options.variant}
      className={options.className}
    />
  );
}
