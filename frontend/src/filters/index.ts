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

export { useFilterState, useQuickFilters } from './hooks';

export { FilterBar, type FilterBarProps } from './components/FilterBar';
export { FilterModal, type FilterModalProps } from './components/FilterModal';
export { FilterModalFooter, type FilterModalFooterProps } from './components/FilterModalFooter';
export {
  ResponsiveFilterMobileBar,
  type ResponsiveFilterMobileBarProps,
} from './components/ResponsiveFilterMobileBar';
export { FilterSection, type FilterSectionProps } from './components/FilterSection';
export { DatePresetBadges, type DatePresetBadgesProps } from './components/DatePresetBadges';
export { ActiveFilterBadges, type ActiveFilterBadgesProps } from './components/ActiveFilterBadges';
export { QuickFilters, type QuickFiltersProps } from './components/QuickFilters';
export { FilterFactory, type FilterFactoryProps } from './components/FilterFactory';

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
} from './components/controls';
