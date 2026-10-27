/**
 * Event log filter bar, inline controls, and panel filter row.
 */
import React from 'react';
import { MODULE_ICONS } from '@/config/icons';
import { ResponsiveFilterInsetBar } from '@/components/filters/ResponsiveFilterInsetBar';
import {
  EventLogFiltersInlineControls,
  type EventLogFiltersInlineControlsProps,
} from './eventLogFilterControls';
import type { EventLogFilterField } from './types';
import {
  buildEventLogFilterModalExtras,
  buildEventLogFilterModalSections,
} from './eventLogFilterModalBuilders';

export interface EventLogFiltersProps extends EventLogFiltersInlineControlsProps {
  activeFilterCount: number;
  onReset: () => void;
}

function fieldVisible(
  field: EventLogFilterField,
  visibleFields: EventLogFilterField[],
  lockedFields: Set<EventLogFilterField>,
) {
  return visibleFields.includes(field) && !lockedFields.has(field);
}

export const EventLogFilters: React.FC<EventLogFiltersProps> = props => {
  const inlineProps: EventLogFiltersInlineControlsProps = {
    visibleFields: props.visibleFields,
    lockedFields: props.lockedFields,
    kinds: props.kinds,
    onKindsChange: props.onKindsChange,
    dateRange: props.dateRange,
    onDateRangeChange: props.onDateRangeChange,
    recordIdInput: props.recordIdInput,
    onRecordIdInputChange: props.onRecordIdInputChange,
    recordIdInputInvalid: props.recordIdInputInvalid,
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
  };

  const flags = {
    showSearch: fieldVisible('search', props.visibleFields, props.lockedFields),
    showRecordId: fieldVisible('recordId', props.visibleFields, props.lockedFields),
    showActorRole: fieldVisible('actorRole', props.visibleFields, props.lockedFields),
    showActorSearch: fieldVisible('actorSearch', props.visibleFields, props.lockedFields),
    showIncludeAccess: fieldVisible('includeAccess', props.visibleFields, props.lockedFields),
    showVerbosity: fieldVisible('verbosity', props.visibleFields, props.lockedFields),
    showKind: fieldVisible('kind', props.visibleFields, props.lockedFields),
    showDate: fieldVisible('dateRange', props.visibleFields, props.lockedFields),
  };

  return (
    <ResponsiveFilterInsetBar
      activeFilterCount={props.activeFilterCount}
      onReset={props.onReset}
      modalTitle="Filter events"
      modalFooterIcon={MODULE_ICONS.eventLog}
      modalFooterLabel="Event log"
      modalExtras={buildEventLogFilterModalExtras(inlineProps, flags)}
      modalSections={buildEventLogFilterModalSections(
        props.kinds,
        props.onKindsChange,
        props.dateRange,
        props.onDateRangeChange,
        { showKind: flags.showKind, showDate: flags.showDate },
      )}
      inlineControls={<EventLogFiltersInlineControls {...inlineProps} />}
    />
  );
};
