/**
 * Filters Module
 * Shared filter components and utilities
 */

// Types
export type {
  FilterControlType,
  FilterControl,
  SearchFilterControl,
  DateRangeFilterControl,
  AgeRangeFilterControl,
  PriceRangeFilterControl,
  MultiSelectFilterControl,
  SingleSelectFilterControl,
  QuickFilterPreset,
  FilterSection as FilterSectionType,
  FilterConfig,
  FilterValues,
  ActiveFilterBadge,
} from './types';

// Hooks
export { useFilterState, useFilterPersistence, useQuickFilters } from './hooks';

// Components
export { FilterBar, type FilterBarProps } from './FilterBar';
export { FilterModal, type FilterModalProps } from './FilterModal';
export { FilterSection, type FilterSectionProps } from './FilterSection';
export { DatePresetBadges, type DatePresetBadgesProps } from './DatePresetBadges';
export { ActiveFilterBadges, type ActiveFilterBadgesProps } from './ActiveFilterBadges';
export { QuickFilters, type QuickFiltersProps } from './QuickFilters';
export { FilterFactory, type FilterFactoryProps } from './FilterFactory';

// Filter Controls (for direct usage)
export {
  SearchControl,
  DateRangeControl,
  AgeRangeControl,
  PriceRangeControl,
  MultiSelectControl,
  SingleSelectControl,
  FilterHelpIcon,
  type SearchControlProps,
  type DateRangeControlProps,
  type AgeRangeControlProps,
  type PriceRangeControlProps,
  type MultiSelectControlProps,
  type SingleSelectControlProps,
  type FilterHelpIconProps,
} from './filter-controls';
