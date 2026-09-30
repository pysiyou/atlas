/**
 * Inline filter controls for the event log panel (tablet/desktop).
 */
import React from 'react';
import { DateFilter, DebouncedSearchInput, MultiSelectFilter } from '@/components';
import { ICONS } from '@/config/icons';
import { EVENT_LOG_CATEGORY_OPTIONS } from './eventLogCategories';
import { EVENT_LOG_FILTER_FIELD_ORDER } from './eventLogFilterFieldOrder';
import type { EventLogCategoryKey, EventLogFilterField } from './types';

const categoryFilterOptions = EVENT_LOG_CATEGORY_OPTIONS.map(opt => ({
  id: opt.id,
  label: opt.label,
}));

export const EVENT_LOG_FILTER_PLACEHOLDERS = {
  dateRange: 'Filter by date range',
  category: 'Event category',
  orderId: 'Order ID (e.g. ORD0001)',
  testId: 'Order test ID (e.g. TST0001)',
  entityId: 'Order or test ID (ORD… / TST…)',
} as const;

export interface EventLogFiltersInlineControlsProps {
  visibleFields: EventLogFilterField[];
  lockedFields: Set<EventLogFilterField>;
  categories: EventLogCategoryKey[];
  onCategoriesChange: (values: EventLogCategoryKey[]) => void;
  dateRange: [Date, Date] | null;
  onDateRangeChange: (range: [Date, Date] | null) => void;
  orderIdInput: string;
  onOrderIdInputChange: (value: string) => void;
  testIdInput: string;
  onTestIdInputChange: (value: string) => void;
  entityIdInput?: string;
  onEntityIdInputChange?: (value: string) => void;
  orderIdInputInvalid?: boolean;
  testIdInputInvalid?: boolean;
  entityIdInputInvalid?: boolean;
}

function renderFieldControl(
  field: EventLogFilterField,
  props: EventLogFiltersInlineControlsProps,
  show: (f: EventLogFilterField) => boolean
): React.ReactNode {
  if (!show(field)) return null;

  switch (field) {
    case 'entityId':
      if (!props.onEntityIdInputChange) return null;
      return (
        <div
          key={field}
          className={`flex h-9 w-full flex-col justify-center${props.entityIdInputInvalid ? ' rounded-field ring-1 ring-status-danger' : ''}`}
        >
          <DebouncedSearchInput
            value={props.entityIdInput ?? ''}
            onChange={props.onEntityIdInputChange}
            placeholder={EVENT_LOG_FILTER_PLACEHOLDERS.entityId}
          />
        </div>
      );
    case 'orderId':
      return (
        <div
          key={field}
          className={`flex h-9 w-full flex-col justify-center${props.orderIdInputInvalid ? ' rounded-field ring-1 ring-status-danger' : ''}`}
        >
          <DebouncedSearchInput
            value={props.orderIdInput}
            onChange={props.onOrderIdInputChange}
            placeholder={EVENT_LOG_FILTER_PLACEHOLDERS.orderId}
          />
        </div>
      );
    case 'testId':
      return (
        <div
          key={field}
          className={`flex h-9 w-full flex-col justify-center${props.testIdInputInvalid ? ' rounded-field ring-1 ring-status-danger' : ''}`}
        >
          <DebouncedSearchInput
            value={props.testIdInput}
            onChange={props.onTestIdInputChange}
            placeholder={EVENT_LOG_FILTER_PLACEHOLDERS.testId}
          />
        </div>
      );
    case 'dateRange':
      return (
        <div key={field} className="flex h-9 w-full items-center">
          <DateFilter
            value={props.dateRange}
            onChange={props.onDateRangeChange}
            placeholder={EVENT_LOG_FILTER_PLACEHOLDERS.dateRange}
            className="w-full"
          />
        </div>
      );
    case 'category':
      return (
        <div key={field} className="flex h-9 w-full items-center">
          <MultiSelectFilter
            label="Category"
            options={categoryFilterOptions}
            selectedIds={props.categories}
            onChange={values => props.onCategoriesChange(values as EventLogCategoryKey[])}
            placeholder={EVENT_LOG_FILTER_PLACEHOLDERS.category}
            selectAllLabel="All categories"
            icon={ICONS.dataFields.clock}
            className="w-full"
          />
        </div>
      );
    default:
      return null;
  }
}

export const EventLogFiltersInlineControls: React.FC<EventLogFiltersInlineControlsProps> = props => {
  const show = (field: EventLogFilterField) =>
    props.visibleFields.includes(field) && !props.lockedFields.has(field);

  return (
    <>
      {EVENT_LOG_FILTER_FIELD_ORDER.map(field => renderFieldControl(field, props, show))}
    </>
  );
};
