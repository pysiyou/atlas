/**
 * Event log filter row — kind, date, entity id, include-access.
 */
import React from 'react';
import { FILTER_TYPE } from '@/components/theme/recipes';
import { Checkbox, DebouncedSearchInput } from '@/components';
import { EventLogFilterBar } from './EventLogFilterBar';
import {
  EventLogFiltersInlineControls,
  EVENT_LOG_FILTER_PLACEHOLDERS,
} from './EventLogFiltersInlineControls';
import type { EventLogFilterField, EventLogKind } from './types';

export interface EventLogFiltersProps {
  visibleFields: EventLogFilterField[];
  lockedFields: Set<EventLogFilterField>;
  kinds: EventLogKind[];
  onKindsChange: (values: EventLogKind[]) => void;
  dateRange: [Date, Date] | null;
  onDateRangeChange: (range: [Date, Date] | null) => void;
  entityIdInput?: string;
  onEntityIdInputChange?: (value: string) => void;
  entityIdInputInvalid?: boolean;
  includeAccess: boolean;
  onIncludeAccessChange: (value: boolean) => void;
  activeFilterCount: number;
  onReset: () => void;
}

export const EventLogFilters: React.FC<EventLogFiltersProps> = props => {
  const showKind = props.visibleFields.includes('kind') && !props.lockedFields.has('kind');
  const showDate =
    props.visibleFields.includes('dateRange') && !props.lockedFields.has('dateRange');
  const showEntity =
    props.visibleFields.includes('entityId') && !props.lockedFields.has('entityId');
  const showIncludeAccess =
    props.visibleFields.includes('includeAccess') && !props.lockedFields.has('includeAccess');

  const modalExtras = (
    <>
      {showEntity && props.onEntityIdInputChange ? (
        <div className="w-full">
          <h4 className={FILTER_TYPE.sectionTitle}>Entity ID</h4>
          <DebouncedSearchInput
            value={props.entityIdInput ?? ''}
            onChange={props.onEntityIdInputChange}
            placeholder={EVENT_LOG_FILTER_PLACEHOLDERS.entityId}
          />
        </div>
      ) : null}
      {showIncludeAccess ? (
        <div className="w-full">
          <h4 className={FILTER_TYPE.sectionTitle}>Access events</h4>
          <Checkbox
            id="event-log-include-access-modal"
            checked={props.includeAccess}
            onChange={props.onIncludeAccessChange}
            label={EVENT_LOG_FILTER_PLACEHOLDERS.includeAccess}
          />
        </div>
      ) : null}
    </>
  );

  return (
    <EventLogFilterBar
      activeFilterCount={props.activeFilterCount}
      kinds={props.kinds}
      onKindsChange={props.onKindsChange}
      dateRange={props.dateRange}
      onDateRangeChange={props.onDateRangeChange}
      onReset={props.onReset}
      showKindInModal={showKind}
      showDateInModal={showDate}
      modalExtras={modalExtras}
      inlineControls={
        <EventLogFiltersInlineControls
          visibleFields={props.visibleFields}
          lockedFields={props.lockedFields}
          kinds={props.kinds}
          onKindsChange={props.onKindsChange}
          dateRange={props.dateRange}
          onDateRangeChange={props.onDateRangeChange}
          entityIdInput={props.entityIdInput}
          onEntityIdInputChange={props.onEntityIdInputChange}
          entityIdInputInvalid={props.entityIdInputInvalid}
          includeAccess={props.includeAccess}
          onIncludeAccessChange={props.onIncludeAccessChange}
        />
      }
    />
  );
};
