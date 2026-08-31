/**
 * Shared filter control renderer — used by FilterFactory (bar) and FilterModal (modal).
 */

import { type ReactNode } from 'react';
import { CheckboxList } from '@/components';
import type { FilterControl } from '../types';
import {
  SearchControl,
  DateRangeControl,
  AgeRangeControl,
  PriceRangeControl,
  MultiSelectControl,
  SingleSelectControl,
} from '../components/controls';
import { DatePresetBadges } from '../components/DatePresetBadges';
import { ModalSearchInput, ModalPriceSlider, ModalRadioList } from '../components/FilterModalControls';

export type FilterControlVariant = 'bar' | 'modal';

export interface RenderFilterControlOptions {
  variant: FilterControlVariant;
  className?: string;
}

function renderSearchControl(
  control: Extract<FilterControl, { type: 'search' }>,
  filterValue: unknown,
  onChange: (value: unknown) => void,
  variant: FilterControlVariant,
  className?: string
): ReactNode {
  if (variant === 'modal') {
    return (
      <ModalSearchInput
        value={(filterValue as string) || ''}
        onChange={v => onChange(v)}
        placeholder={control.placeholder}
      />
    );
  }

  return (
    <SearchControl
      value={(filterValue as string) || ''}
      onChange={onChange}
      placeholder={control.placeholder || `Search ${control.label.toLowerCase()}...`}
      debounceMs={control.debounceMs}
      className={className}
    />
  );
}

function renderDateRangeControl(
  control: Extract<FilterControl, { type: 'dateRange' }>,
  filterValue: unknown,
  onChange: (value: unknown) => void,
  variant: FilterControlVariant,
  className?: string
): ReactNode {
  const value = (filterValue as [Date, Date] | null) || null;

  if (variant === 'modal') {
    return <DatePresetBadges value={value} onChange={v => onChange(v)} />;
  }

  return (
    <DateRangeControl value={value} onChange={onChange} config={control} className={className} />
  );
}

function renderAgeRangeControl(
  control: Extract<FilterControl, { type: 'ageRange' }>,
  filterValue: unknown,
  onChange: (value: unknown) => void,
  variant: FilterControlVariant,
  className?: string
): ReactNode {
  if (variant === 'modal') {
    return (
      <div className="text-sm text-text-tertiary italic">
        Use the main filter bar for this filter type
      </div>
    );
  }

  return (
    <AgeRangeControl
      value={(filterValue as [number, number]) || [control.min ?? 0, control.max ?? 150]}
      onChange={onChange}
      config={control}
      className={className}
    />
  );
}

function renderPriceRangeControl(
  control: Extract<FilterControl, { type: 'priceRange' }>,
  filterValue: unknown,
  onChange: (value: unknown) => void,
  variant: FilterControlVariant,
  className?: string
): ReactNode {
  const min = control.min ?? 0;
  const max = control.max ?? 10000;
  const value = (filterValue as [number, number]) || [min, max];

  if (variant === 'modal') {
    return (
      <ModalPriceSlider
        value={value}
        onChange={v => onChange(v)}
        min={min}
        max={max}
        currency={control.currency}
      />
    );
  }

  return (
    <PriceRangeControl value={value} onChange={onChange} config={control} className={className} />
  );
}

function renderMultiSelectControl(
  control: Extract<FilterControl, { type: 'multiSelect' }>,
  filterValue: unknown,
  onChange: (value: unknown) => void,
  variant: FilterControlVariant,
  className?: string
): ReactNode {
  if (variant === 'modal') {
    return (
      <CheckboxList
        options={control.options}
        selectedIds={(filterValue as string[]) || []}
        onChange={v => onChange(v)}
        columns={control.options.length > 4 ? 2 : 1}
      />
    );
  }

  return (
    <MultiSelectControl
      value={(filterValue as string[]) || []}
      onChange={onChange}
      config={control}
      className={className}
    />
  );
}

function renderSingleSelectControl(
  control: Extract<FilterControl, { type: 'singleSelect' }>,
  filterValue: unknown,
  onChange: (value: unknown) => void,
  variant: FilterControlVariant,
  className?: string
): ReactNode {
  if (variant === 'modal') {
    return (
      <ModalRadioList
        options={control.options}
        selectedId={(filterValue as string | null) || null}
        onChange={v => onChange(v)}
        columns={control.options.length > 4 ? 2 : 1}
      />
    );
  }

  return (
    <SingleSelectControl
      value={(filterValue as string | null) || null}
      onChange={onChange}
      config={control}
      className={className}
    />
  );
}

/**
 * Renders the appropriate filter control for bar or modal.
 * Single dispatch so bar and modal stay in sync on control types.
 */
export function renderFilterControl(
  control: FilterControl,
  filterValue: unknown,
  onChange: (value: unknown) => void,
  options: RenderFilterControlOptions
): ReactNode {
  const { variant, className } = options;

  switch (control.type) {
    case 'search':
      return renderSearchControl(control, filterValue, onChange, variant, className);
    case 'dateRange':
      return renderDateRangeControl(control, filterValue, onChange, variant, className);
    case 'ageRange':
      return renderAgeRangeControl(control, filterValue, onChange, variant, className);
    case 'priceRange':
      return renderPriceRangeControl(control, filterValue, onChange, variant, className);
    case 'multiSelect':
      return renderMultiSelectControl(control, filterValue, onChange, variant, className);
    case 'singleSelect':
      return renderSingleSelectControl(control, filterValue, onChange, variant, className);
    default:
      return null;
  }
}
