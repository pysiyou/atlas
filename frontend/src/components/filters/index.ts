/**
 * Filters Module — shared filter components, hooks, and utilities.
 */

export {
  ORDER_FILTER_PLACEHOLDERS,
  PATIENT_FILTER_PLACEHOLDERS,
  PAYMENT_FILTER_PLACEHOLDERS,
  REPORT_FILTER_PLACEHOLDERS,
  SHARED_FILTER_PLACEHOLDERS,
} from './constants';

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

export { useFilterState } from './useFilterState';
export { useQuickFilters } from './useQuickFilters';

export { FilterBar, type FilterBarProps } from './FilterBar';
export { FilterModal, type FilterModalProps } from './FilterModal';
export { FilterModalFooter, type FilterModalFooterProps } from './FilterModalFooter';
export {
  ResponsiveFilterMobileBar,
  type ResponsiveFilterMobileBarProps,
} from './ResponsiveFilterMobileBar';
export { FilterSection, type FilterSectionProps } from './FilterSection';
export { DatePresetBadges, type DatePresetBadgesProps } from './DatePresetBadges';
export { QuickFilters, type QuickFiltersProps } from './QuickFilters';
export { FilterFactory, type FilterFactoryProps } from './FilterFactory';
export { EntityFilterModal, type EntityFilterModalProps } from './EntityFilterModal';
export {
  ResponsiveEntityFilters,
  type ResponsiveEntityFiltersProps,
} from './ResponsiveEntityFilters';

export { SearchControl, type SearchControlProps } from './SearchControl';
export { DateRangeControl, type DateRangeControlProps } from './DateRangeControl';
export { AgeRangeControl, type AgeRangeControlProps } from './AgeRangeControl';
export { PriceRangeControl, type PriceRangeControlProps } from './PriceRangeControl';
export { MultiSelectControl, type MultiSelectControlProps } from './MultiSelectControl';
export { SingleSelectControl, type SingleSelectControlProps } from './SingleSelectControl';
