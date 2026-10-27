import { text } from '@/theme/recipes';
import { CheckboxList, Icon } from '@/components/primitives';
import { DatePicker } from '@/components/inputs/DatePicker';
import { TextInput } from '@/components/inputs/TextInput';
import { ChipSelectGroup } from '@/components/inputs/ChipSelectGroup';
import { MultiSelectFilter } from '@/components/overlays/MultiSelectFilter';
import { RangeSlider } from '@/components/overlays/RangeSlider';
import type { FilterControl, NumberRangeFilterControl } from './types';
import { RangeFilterField } from './RangeFilterField';
import { ModalRadioList, resolveNumberRange } from './filterControlShared';
import type { FilterControlProps, FilterControlSurface } from './FilterControl';
import type { ReactNode } from 'react';
import { ICONS } from '@/config/icons';
import {
  DATE_PRESETS,
  getActivePresetId,
  getDateRangeFromPreset,
  type DatePreset,
} from '@/utils/date';

export function renderFilterControlSwitch({
  control,
  value,
  onChange,
  surface,
  className,
}: FilterControlProps): ReactNode {
  const type =
    control.type === 'search'
      ? 'text'
      : control.type === 'ageRange' || control.type === 'priceRange'
        ? 'numberRange'
        : control.type;

  switch (type) {
    case 'text':
      return renderTextFilter(control, value, onChange, surface, className);
    case 'dateRange':
      return renderDateRangeFilter(control, value, onChange, surface, className);
    case 'numberRange':
      return renderNumberRangeFilter(control, value, onChange, surface, className);
    case 'multiSelect':
      return renderMultiSelectFilter(control, value, onChange, surface, className);
    case 'singleSelect':
      return renderSingleSelectFilter(control, value, onChange, surface, className);
    default:
      return null;
  }
}

function renderTextFilter(
  control: FilterControl,
  value: unknown,
  onChange: (value: unknown) => void,
  surface: FilterControlSurface,
  className?: string,
) {
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

function renderDateRangeFilter(
  control: FilterControl,
  value: unknown,
  onChange: (value: unknown) => void,
  surface: FilterControlSurface,
  className?: string,
) {
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

function renderNumberRangeFilter(
  control: FilterControl,
  value: unknown,
  onChange: (value: unknown) => void,
  surface: FilterControlSurface,
  className?: string,
) {
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

function renderMultiSelectFilter(
  control: FilterControl,
  value: unknown,
  onChange: (value: unknown) => void,
  surface: FilterControlSurface,
  className?: string,
) {
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

function renderSingleSelectFilter(
  control: FilterControl,
  value: unknown,
  onChange: (value: unknown) => void,
  surface: FilterControlSurface,
  className?: string,
) {
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
