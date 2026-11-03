/**
 * Generic filter configuration types.
 */

import type { FilterOption } from '@/utils/filtering';
import type { IconKey } from '@/config/icons';

export type FilterControlType =
  | 'text'
  | 'search'
  | 'dateRange'
  | 'numberRange'
  | 'ageRange'
  | 'priceRange'
  | 'multiSelect'
  | 'singleSelect';

export interface BaseFilterControl {
  key: string;
  label: string;
  type: FilterControlType;
  required?: boolean;
  placeholder?: string;
  icon?: IconKey;
  helpText?: string;
}

export interface TextFilterControl extends BaseFilterControl {
  type: 'text' | 'search';
  placeholder?: string;
  debounceMs?: number;
}

export interface DateRangeFilterControl extends BaseFilterControl {
  type: 'dateRange';
  minDate?: Date;
  maxDate?: Date;
}

export interface NumberRangeFilterControl extends BaseFilterControl {
  type: 'numberRange' | 'ageRange' | 'priceRange';
  minValue?: number;
  maxValue?: number;
  sliderMode?: 'histogram' | 'track';
  formatSummary?: (value: [number, number]) => string;
  formatValue?: (n: number) => string;
  currencySymbol?: string;
  distribution?: number[];
}

export interface MultiSelectFilterControl extends BaseFilterControl {
  type: 'multiSelect';
  options: FilterOption[];
  selectAllLabel?: string;
}

export interface SingleSelectFilterControl extends BaseFilterControl {
  type: 'singleSelect';
  options: FilterOption[];
}

export type FilterControl =
  | TextFilterControl
  | DateRangeFilterControl
  | NumberRangeFilterControl
  | MultiSelectFilterControl
  | SingleSelectFilterControl;

export interface QuickFilterPreset {
  id: string;
  label: string;
  preset: Record<string, unknown>;
  icon?: IconKey;
}

export interface FilterSection {
  title: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  controls: FilterControl[];
}

export interface FilterConfig {
  footerIcon: IconKey;
  footerLabel?: string;
  quickFilters?: QuickFilterPreset[];
  primaryFilters: FilterSection;
}

export type FilterValues = Record<string, unknown>;

export interface ActiveFilterBadge {
  key: string;
  label: string;
  value: string;
  rawValue: unknown;
}
