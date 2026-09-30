/**
 * Event log filter row — category, date, order ID, order test ID.
 */
import React from 'react';
import { FILTER_TYPE } from '@/components/theme/recipes';
import { DebouncedSearchInput } from '@/components';
import { EventLogFilterBar } from './EventLogFilterBar';
import {
  EventLogFiltersInlineControls,
  EVENT_LOG_FILTER_PLACEHOLDERS,
} from './EventLogFiltersInlineControls';
import type { EventLogFilterField, EventLogCategoryKey } from './types';

export interface EventLogFiltersProps {
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
  activeFilterCount: number;
  onReset: () => void;
}

export const EventLogFilters: React.FC<EventLogFiltersProps> = props => {
  const showCategory =
    props.visibleFields.includes('category') && !props.lockedFields.has('category');
  const showDate =
    props.visibleFields.includes('dateRange') && !props.lockedFields.has('dateRange');
  const showOrder =
    props.visibleFields.includes('orderId') && !props.lockedFields.has('orderId');
  const showTest =
    props.visibleFields.includes('testId') && !props.lockedFields.has('testId');
  const showEntity =
    props.visibleFields.includes('entityId') && !props.lockedFields.has('entityId');

  const modalExtras = (
    <>
      {showEntity && props.onEntityIdInputChange ? (
        <div className="w-full">
          <h4 className={FILTER_TYPE.sectionTitle}>Order or test ID</h4>
          <DebouncedSearchInput
            value={props.entityIdInput ?? ''}
            onChange={props.onEntityIdInputChange}
            placeholder={EVENT_LOG_FILTER_PLACEHOLDERS.entityId}
          />
        </div>
      ) : null}
      {showOrder ? (
        <div className="w-full">
          <h4 className={FILTER_TYPE.sectionTitle}>Order ID</h4>
          <DebouncedSearchInput
            value={props.orderIdInput}
            onChange={props.onOrderIdInputChange}
            placeholder={EVENT_LOG_FILTER_PLACEHOLDERS.orderId}
          />
        </div>
      ) : null}
      {showTest ? (
        <div className="w-full">
          <h4 className={FILTER_TYPE.sectionTitle}>Order test ID</h4>
          <DebouncedSearchInput
            value={props.testIdInput}
            onChange={props.onTestIdInputChange}
            placeholder={EVENT_LOG_FILTER_PLACEHOLDERS.testId}
          />
        </div>
      ) : null}
    </>
  );

  return (
    <EventLogFilterBar
      activeFilterCount={props.activeFilterCount}
      categories={props.categories}
      onCategoriesChange={props.onCategoriesChange}
      dateRange={props.dateRange}
      onDateRangeChange={props.onDateRangeChange}
      onReset={props.onReset}
      showCategoryInModal={showCategory}
      showDateInModal={showDate}
      modalExtras={modalExtras}
      inlineControls={
        <EventLogFiltersInlineControls
          visibleFields={props.visibleFields}
          lockedFields={props.lockedFields}
          categories={props.categories}
          onCategoriesChange={props.onCategoriesChange}
          dateRange={props.dateRange}
          onDateRangeChange={props.onDateRangeChange}
          orderIdInput={props.orderIdInput}
          onOrderIdInputChange={props.onOrderIdInputChange}
          testIdInput={props.testIdInput}
          onTestIdInputChange={props.onTestIdInputChange}
          entityIdInput={props.entityIdInput}
          onEntityIdInputChange={props.onEntityIdInputChange}
          orderIdInputInvalid={props.orderIdInputInvalid}
          testIdInputInvalid={props.testIdInputInvalid}
          entityIdInputInvalid={props.entityIdInputInvalid}
        />
      }
    />
  );
};
