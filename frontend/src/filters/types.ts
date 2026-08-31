/**
 * Filter Types
 * Type definitions for the new filter system
 */

import type { FilterOption } from '@/utils/filtering';

/**
 * Filter control types
 */
export type FilterControlType =
  | 'search'
  | 'dateRange'
  | 'ageRange'
  | 'priceRange'
  | 'multiSelect'
  | 'singleSelect';

/**
 * Base filter control configuration
 */
export interface BaseFilterControl {
  /** Unique key for this filter */
  key: string;
  /** Display label */
  label: string;
  /** Filter control type */
  type: FilterControlType;
  /** Whether this filter is required */
  required?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Icon name for the filter */
  icon?: string;
  /** Optional help text shown in a popover via info icon */
  helpText?: string;
}

/**
 * Search filter control configuration
 */
export interface SearchFilterControl extends BaseFilterControl {
  type: 'search';
  /** Search placeholder text */
  placeholder?: string;
  /** Debounce delay in milliseconds */
  debounceMs?: number;
}

/**
 * Date range filter control configuration
 */
export interface DateRangeFilterControl extends BaseFilterControl {
  type: 'dateRange';
  /** Minimum date allowed */
  minDate?: Date;
  /** Maximum date allowed */
  maxDate?: Date;
}

/**
 * Age range filter control configuration
 */
export interface AgeRangeFilterControl extends BaseFilterControl {
  type: 'ageRange';
  /** Minimum age */
  min?: number;
  /** Maximum age */
  max?: number;
}

/**
 * Price range filter control configuration
 */
export interface PriceRangeFilterControl extends BaseFilterControl {
  type: 'priceRange';
  /** Minimum price */
  min?: number;
  /** Maximum price */
  max?: number;
  /** Currency symbol (default: '') */
  currency?: string;
}

/**
 * Multi-select filter control configuration
 */
export interface MultiSelectFilterControl extends BaseFilterControl {
  type: 'multiSelect';
  /** Available options */
  options: FilterOption[];
  /** Label for "select all" option */
  selectAllLabel?: string;
}

/**
 * Single-select filter control configuration
 */
export interface SingleSelectFilterControl extends BaseFilterControl {
  type: 'singleSelect';
  /** Available options */
  options: FilterOption[];
}

/**
 * Union type for all filter controls
 */
export type FilterControl =
  | SearchFilterControl
  | DateRangeFilterControl
  | AgeRangeFilterControl
  | PriceRangeFilterControl
  | MultiSelectFilterControl
  | SingleSelectFilterControl;

/**
 * Quick filter preset
 */
export interface QuickFilterPreset {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Filter values to apply when this preset is selected */
  preset: Record<string, unknown>;
  /** Optional icon */
  icon?: string;
}

/**
 * Filter section configuration
 */
export interface FilterSection {
  /** Section title */
  title: string;
  /** Whether this section is collapsible */
  collapsible?: boolean;
  /** Whether section is collapsed by default */
  defaultCollapsed?: boolean;
  /** Filter controls in this section */
  controls: FilterControl[];
}

/**
 * Complete filter configuration for a page
 */
export interface FilterConfig {
  /** Quick filter presets */
  quickFilters?: QuickFilterPreset[];
  /** Primary filter section (always visible) */
  primaryFilters: FilterSection;
  /** Advanced filter section (collapsible) */
  advancedFilters?: FilterSection;
}

/**
 * Filter values - generic record of filter keys to their values
 */
export type FilterValues = Record<string, unknown>;

/**
 * Active filter badge information
 */
export interface ActiveFilterBadge {
  /** Filter key */
  key: string;
  /** Filter label */
  label: string;
  /** Display value */
  value: string;
  /** Raw filter value */
  rawValue: unknown;
}
