/**
 * Filters — bar, modal, and control dispatch.
 */

export {
  ORDER_FILTER_PLACEHOLDERS,
  PATIENT_FILTER_PLACEHOLDERS,
  PAYMENT_FILTER_PLACEHOLDERS,
  REPORT_FILTER_PLACEHOLDERS,
  SHARED_FILTER_PLACEHOLDERS,
} from '@/config/filterPlaceholders';

export type {
  FilterControlType,
  FilterControl as FilterControlConfig,
  TextFilterControl,
  DateRangeFilterControl,
  NumberRangeFilterControl,
  MultiSelectFilterControl,
  SingleSelectFilterControl,
  QuickFilterPreset,
  FilterSection as FilterSectionType,
  FilterConfig,
  FilterValues,
  ActiveFilterBadge,
} from './types';

export { useFilterState, useFilterBarBridge, useQuickFilters } from '@/hooks/filters';

export { FilterBar, type FilterBarProps } from './FilterBar';
export { FilterModal, type FilterModalProps } from './FilterModal';
export { FilterModalFooter, type FilterModalFooterProps } from './FilterModalFooter';
export {
  ResponsiveFilterMobileBar,
  type ResponsiveFilterMobileBarProps,
} from './ResponsiveFilterMobileBar';
export { QuickFilters, type QuickFiltersProps } from './QuickFilters';
export {
  FilterControl,
  renderFilterControl,
  type FilterControlProps,
  type FilterControlSurface,
} from './FilterControl';
export { UrlFilterChipBar, type UrlFilterChipBarProps } from './UrlFilterChipBar';
export { DatePresetChipSelect, type DatePresetChipSelectProps } from './DatePresetChipSelect';
export { ListFilterModal, type ListFilterModalProps } from './ListFilterModal';
export { ActiveFilterChipBar, type ActiveFilterChipBarProps, type ActiveFilterItem } from './ActiveFilterChipBar';
export { RangeFilterField, type RangeFilterFieldProps } from './RangeFilterField';
