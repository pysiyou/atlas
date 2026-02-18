/**
 * Global UI Design System — barrel export for @/components/ui
 *
 * All dumb, presentation-only components that form the design system.
 */

export * from './Alert';
export * from './Avatar';
export * from './Badge';
export * from './badgeHelpers';
export * from './BalancedDetailsLayout';
export * from './Button';
export * from './Checkbox';
export * from './CheckboxList';
export * from './CircularProgress';
export * from './DetailField';
export * from './DetailFieldGroup';
export * from './DetailRow';
export * from './DetailsTable';
export * from './detailsTableUtils';
export * from './DNAHelixLoader';
export * from './EmptyState';
export * from './FilterTriggerShell';
export * from './FooterInfo';
export * from './Icon';
export * from './IconButton';
export * from './InfoField';
export * from './Input';
export * from './inputStyles';
export * from './misc';
export * from './Modal';
export * from './ModalDebouncedSearch';
export * from './ModalRangeSlider';
export * from './modalRegistry';
export * from './ModalRenderer';
export * from './MultiSelectFilter';
export * from './PageHeaderBar';
export * from './Pagination';
export * from './PaymentMethodSelector';
export * from './Popover';
export * from './Portal';
export * from './registerModals';
export * from './SearchBar';
export * from './SectionContainer';
export * from './Skeleton';
export * from './TabbedSectionContainer';
export * from './TableActionMenu';
export * from './Tabs';
export * from './TagInput';
export * from './types';

// Re-export from data/ and form/ for backward compat (max-depth-1 restructure)
export {
  Table,
  CardGrid,
  createColumn,
  pickColumns,
  DEFAULT_LOADING_ROWS,
  SHOW_ALL_PAGE_SIZE,
  DEFAULT_PAGE_SIZE_OPTIONS_WITH_ALL,
  Card,
  CardHeader,
  CalloutCard,
  ListView,
} from '../data';
export type {
  TableProps,
  TableViewConfig,
  CardComponentProps,
  ColumnConfig,
  SortConfig,
  TableVariant,
  Breakpoint,
  CardVariant,
  CalloutVariant,
  CardProps,
  ListViewMode,
  ListViewProps,
} from '../data';
export { DatePicker as DateFilter, DateInput } from '../form';
export type { DatePickerProps, DateInputProps, CalendarView } from '../form';

// Domain-specific UI helpers (kept for backward compat)
export * from './catalog';
export * from './orders';
export * from './payments';
export * from './samples';
