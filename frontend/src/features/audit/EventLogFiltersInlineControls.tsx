/**
 * Inline filter controls for the event log panel (tablet/desktop).
 */
import React from 'react';
import { Checkbox, DateFilter, DebouncedSearchInput, MultiSelectFilter } from '@/components';
import { ICONS } from '@/config/icons';
import { EVENT_LOG_KIND_OPTIONS } from './eventLogKinds';
import { EVENT_LOG_FILTER_FIELD_ORDER } from './eventLogFilterFieldOrder';
import type { EventLogFilterField, EventLogKind } from './types';

const kindFilterOptions = EVENT_LOG_KIND_OPTIONS.map(opt => ({
  id: opt.id,
  label: opt.label,
}));

export const EVENT_LOG_FILTER_PLACEHOLDERS = {
  dateRange: 'Filter by date range',
  kind: 'Event kind',
  entityId: 'ORD… / TST… / SAM… / PAT…',
  includeAccess: 'Include access',
} as const;

export interface EventLogFiltersInlineControlsProps {
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
    case 'kind':
      return (
        <div key={field} className="flex h-9 w-full items-center">
          <MultiSelectFilter
            label="Kind"
            options={kindFilterOptions}
            selectedIds={props.kinds}
            onChange={values => props.onKindsChange(values as EventLogKind[])}
            placeholder={EVENT_LOG_FILTER_PLACEHOLDERS.kind}
            selectAllLabel="All kinds"
            icon={ICONS.dataFields.clock}
            className="w-full"
          />
        </div>
      );
    case 'includeAccess':
      return (
        <div key={field} className="flex h-9 w-full items-center">
          <Checkbox
            id="event-log-include-access"
            checked={props.includeAccess}
            onChange={props.onIncludeAccessChange}
            label={EVENT_LOG_FILTER_PLACEHOLDERS.includeAccess}
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
