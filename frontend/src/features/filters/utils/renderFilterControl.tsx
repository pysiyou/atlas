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
} from '../filter-controls';
import { DatePresetBadges } from '../DatePresetBadges';
import { ModalSearchInput, ModalPriceSlider, ModalRadioList } from '../FilterModalControls';

export type FilterControlVariant = 'bar' | 'modal';

export interface RenderFilterControlOptions {
  variant: FilterControlVariant;
  className?: string;
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
      return variant === 'modal' ? (
        <ModalSearchInput
          value={(filterValue as string) || ''}
          onChange={v => onChange(v)}
          placeholder={control.placeholder}
        />
      ) : (
        <SearchControl
          value={(filterValue as string) || ''}
          onChange={onChange}
          placeholder={control.placeholder || `Search ${control.label.toLowerCase()}...`}
          debounceMs={control.debounceMs}
          className={className}
        />
      );

    case 'dateRange':
      return variant === 'modal' ? (
        <DatePresetBadges
          value={(filterValue as [Date, Date] | null) || null}
          onChange={v => onChange(v)}
        />
      ) : (
        <DateRangeControl
          value={(filterValue as [Date, Date] | null) || null}
          onChange={onChange}
          config={control}
          className={className}
        />
      );

    case 'ageRange':
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

    case 'priceRange': {
      const min = control.min ?? 0;
      const max = control.max ?? 10000;
      const value = (filterValue as [number, number]) || [min, max];
      return variant === 'modal' ? (
        <ModalPriceSlider
          value={value}
          onChange={v => onChange(v)}
          min={min}
          max={max}
          currency={control.currency}
        />
      ) : (
        <PriceRangeControl
          value={value}
          onChange={onChange}
          config={control}
          className={className}
        />
      );
    }

    case 'multiSelect':
      return variant === 'modal' ? (
        <CheckboxList
          options={control.options}
          selectedIds={(filterValue as string[]) || []}
          onChange={v => onChange(v)}
          columns={control.options.length > 4 ? 2 : 1}
        />
      ) : (
        <MultiSelectControl
          value={(filterValue as string[]) || []}
          onChange={onChange}
          config={control}
          className={className}
        />
      );

    case 'singleSelect':
      return variant === 'modal' ? (
        <ModalRadioList
          options={control.options}
          selectedId={(filterValue as string | null) || null}
          onChange={v => onChange(v)}
          columns={control.options.length > 4 ? 2 : 1}
        />
      ) : (
        <SingleSelectControl
          value={(filterValue as string | null) || null}
          onChange={onChange}
          config={control}
          className={className}
        />
      );

    default:
      return null;
  }
}
