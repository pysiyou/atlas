/**
 * Inline filter controls for the event log panel (tablet/desktop).
 */
import React from 'react';
import { DateFilter, DebouncedSearchInput, MultiSelectFilter } from '@/components';
import { ICONS } from '@/config/icons';
import { EVENT_LOG_CATEGORY_OPTIONS } from './eventLogCategories';
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
  orderIdInputInvalid?: boolean;
  testIdInputInvalid?: boolean;
}

export const EventLogFiltersInlineControls: React.FC<EventLogFiltersInlineControlsProps> = ({
  visibleFields,
  lockedFields,
  categories,
  onCategoriesChange,
  dateRange,
  onDateRangeChange,
  orderIdInput,
  onOrderIdInputChange,
  testIdInput,
  onTestIdInputChange,
  orderIdInputInvalid,
  testIdInputInvalid,
}) => {
  const show = (field: EventLogFilterField) =>
    visibleFields.includes(field) && !lockedFields.has(field);

  return (
    <>
      {show('category') ? (
        <div className="flex h-9 w-full items-center">
          <MultiSelectFilter
            label="Category"
            options={categoryFilterOptions}
            selectedIds={categories}
            onChange={values => onCategoriesChange(values as EventLogCategoryKey[])}
            placeholder={EVENT_LOG_FILTER_PLACEHOLDERS.category}
            selectAllLabel="All categories"
            icon={ICONS.dataFields.clock}
            className="w-full"
          />
        </div>
      ) : null}

      {show('dateRange') ? (
        <div className="flex h-9 w-full items-center">
          <DateFilter
            value={dateRange}
            onChange={onDateRangeChange}
            placeholder={EVENT_LOG_FILTER_PLACEHOLDERS.dateRange}
            className="w-full"
          />
        </div>
      ) : null}

      {show('orderId') ? (
        <div
          className={`flex h-9 w-full flex-col justify-center${orderIdInputInvalid ? ' rounded-field ring-1 ring-status-danger' : ''}`}
        >
          <DebouncedSearchInput
            value={orderIdInput}
            onChange={onOrderIdInputChange}
            placeholder={EVENT_LOG_FILTER_PLACEHOLDERS.orderId}
          />
        </div>
      ) : null}

      {show('testId') ? (
        <div
          className={`flex h-9 w-full flex-col justify-center${testIdInputInvalid ? ' rounded-field ring-1 ring-status-danger' : ''}`}
        >
          <DebouncedSearchInput
            value={testIdInput}
            onChange={onTestIdInputChange}
            placeholder={EVENT_LOG_FILTER_PLACEHOLDERS.testId}
          />
        </div>
      ) : null}
    </>
  );
};
