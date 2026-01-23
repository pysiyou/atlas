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
export { FilterSection, type FilterSectionProps } from './FilterSection';
export { ActiveFilterBadges, type ActiveFilterBadgesProps } from './ActiveFilterBadges';
export { QuickFilters, type QuickFiltersProps } from './QuickFilters';

// Filter Controls
export {
  SearchControl,
  DateRangeControl,
  AgeRangeControl,
  MultiSelectControl,
  SingleSelectControl,
} from './filter-controls';
