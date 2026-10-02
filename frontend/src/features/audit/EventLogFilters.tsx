/**
 * Event log filter row — kind, date, entity id, include-access.
 */
import React from 'react';
import { FILTER_TYPE } from '@/components/theme/recipes';
import { Checkbox, DebouncedSearchInput } from '@/components';
import { EventLogSearchField } from './EventLogSearchField';
import type { UserRole } from '@/types';
import { EventLogFilterBar } from './EventLogFilterBar';
import {
  EventLogFiltersInlineControls,
  EVENT_LOG_FILTER_PLACEHOLDERS,
} from './EventLogFiltersInlineControls';
import type { EventLogFilterField, EventLogKind, EventLogVerbosity } from './types';

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
  verbosity: EventLogVerbosity;
  onVerbosityChange: (value: EventLogVerbosity) => void;
  actorRoles: UserRole[];
  onActorRolesChange: (values: UserRole[]) => void;
  actorSearch: string;
  onActorSearchChange: (value: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  activeFilterCount: number;
  onReset: () => void;
}

const inlineActorProps = (props: EventLogFiltersProps) => ({
  kinds: props.kinds,
  onKindsChange: props.onKindsChange,
  dateRange: props.dateRange,
  onDateRangeChange: props.onDateRangeChange,
  includeAccess: props.includeAccess,
  onIncludeAccessChange: props.onIncludeAccessChange,
  verbosity: props.verbosity,
  onVerbosityChange: props.onVerbosityChange,
  actorRoles: props.actorRoles,
  onActorRolesChange: props.onActorRolesChange,
  actorSearch: props.actorSearch,
  onActorSearchChange: props.onActorSearchChange,
  search: props.search,
  onSearchChange: props.onSearchChange,
});

export const EventLogFilters: React.FC<EventLogFiltersProps> = props => {
  const showKind = props.visibleFields.includes('kind') && !props.lockedFields.has('kind');
  const showDate =
    props.visibleFields.includes('dateRange') && !props.lockedFields.has('dateRange');
  const showEntity =
    props.visibleFields.includes('entityId') && !props.lockedFields.has('entityId');
  const showIncludeAccess =
    props.visibleFields.includes('includeAccess') && !props.lockedFields.has('includeAccess');
  const showVerbosity =
    props.visibleFields.includes('verbosity') && !props.lockedFields.has('verbosity');
  const showActorRole =
    props.visibleFields.includes('actorRole') && !props.lockedFields.has('actorRole');
  const showActorSearch =
    props.visibleFields.includes('actorSearch') && !props.lockedFields.has('actorSearch');
  const showSearch =
    props.visibleFields.includes('search') && !props.lockedFields.has('search');

  const modalExtras = (
    <>
      {showSearch ? (
        <div className="w-full">
          <h4 className={FILTER_TYPE.sectionTitle}>Search</h4>
          <EventLogSearchField value={props.search} onChange={props.onSearchChange} />
          <div className="mt-space-4 border-b border-border-default" />
        </div>
      ) : null}
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
      {showActorRole ? (
        <div className="w-full">
          <h4 className={FILTER_TYPE.sectionTitle}>Actor role</h4>
          <EventLogFiltersInlineControls
            visibleFields={['actorRole']}
            lockedFields={props.lockedFields}
            {...inlineActorProps(props)}
          />
          <div className="mt-space-4 border-b border-border-default" />
        </div>
      ) : null}
      {showActorSearch ? (
        <div className="w-full">
          <h4 className={FILTER_TYPE.sectionTitle}>Actor</h4>
          <EventLogFiltersInlineControls
            visibleFields={['actorSearch']}
            lockedFields={props.lockedFields}
            {...inlineActorProps(props)}
          />
          <div className="mt-space-4 border-b border-border-default" />
        </div>
      ) : null}
      {showIncludeAccess ? (
        <div className="w-full">
          <h4 className={FILTER_TYPE.sectionTitle}>Views & downloads</h4>
          <Checkbox
            id="event-log-include-access-modal"
            checked={props.includeAccess}
            onChange={props.onIncludeAccessChange}
            label={EVENT_LOG_FILTER_PLACEHOLDERS.includeAccess}
          />
        </div>
      ) : null}
      {showVerbosity ? (
        <div className="w-full">
          <h4 className={FILTER_TYPE.sectionTitle}>Detail level</h4>
          <EventLogFiltersInlineControls
            visibleFields={['verbosity']}
            lockedFields={props.lockedFields}
            {...inlineActorProps(props)}
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
          verbosity={props.verbosity}
          onVerbosityChange={props.onVerbosityChange}
          actorRoles={props.actorRoles}
          onActorRolesChange={props.onActorRolesChange}
          actorSearch={props.actorSearch}
          onActorSearchChange={props.onActorSearchChange}
          search={props.search}
          onSearchChange={props.onSearchChange}
        />
      }
    />
  );
};
