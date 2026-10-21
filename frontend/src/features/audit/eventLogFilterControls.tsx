/**
 * Event log filter field renderers (inline bar + mobile modal sections).
 */
import React from 'react';
import { Checkbox } from '@/components/primitives';
import { SearchTextInput, Select } from '@/components/inputs';
import { DatePicker } from '@/components/inputs/DatePicker';
import { MultiSelectFilter } from '@/components/overlays/MultiSelectFilter';
import { DatePresetChipSelect } from '@/components/filters';
import { FILTER_TYPE, RADIUS } from '@/theme/recipes';
import { MODULE_ICONS } from '@/config/icons';
import { CheckboxList } from '@/components/primitives';
import {
  EVENT_LOG_FILTER_FIELD_ORDER,
  EVENT_LOG_FILTER_PLACEHOLDERS,
  EVENT_LOG_KIND_OPTIONS,
} from './eventLogFilterConfig';
import { EventLogSearchField } from './eventLogSearch';
import type { UserRole } from '@/types';
import { USER_ROLE_OPTIONS } from '@/types';
import { ICONS } from '@/config/icons';
import { EVENT_LOG_COPY, type EventLogFilterField, type EventLogKind, type EventLogVerbosity } from './types';

const kindCheckboxOptions = EVENT_LOG_KIND_OPTIONS.map(opt => ({
  id: opt.id,
  label: opt.label,
}));

const kindFilterOptions = EVENT_LOG_KIND_OPTIONS.map(opt => ({
  id: opt.id,
  label: opt.label,
}));

const actorRoleFilterOptions = USER_ROLE_OPTIONS.map(opt => ({
  id: opt.value,
  label: opt.label,
}));

const VERBOSITY_OPTIONS: { value: EventLogVerbosity; label: string }[] = [
  { value: 'summary', label: EVENT_LOG_COPY.verbositySummary },
  { value: 'detailed', label: EVENT_LOG_COPY.verbosityDetailed },
  { value: 'debug', label: EVENT_LOG_COPY.verbosityDebug },
];

export interface EventLogFiltersInlineControlsProps {
  visibleFields: EventLogFilterField[];
  lockedFields: Set<EventLogFilterField>;
  kinds: EventLogKind[];
  onKindsChange: (values: EventLogKind[]) => void;
  dateRange: [Date, Date] | null;
  onDateRangeChange: (range: [Date, Date] | null) => void;
  recordIdInput?: string;
  onRecordIdInputChange?: (value: string) => void;
  recordIdInputInvalid?: boolean;
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
}

function renderFieldControl(
  field: EventLogFilterField,
  props: EventLogFiltersInlineControlsProps,
  show: (f: EventLogFilterField) => boolean,
): React.ReactNode {
  if (!show(field)) return null;

  switch (field) {
    case 'search':
      return (
        <div key={field} className="flex h-9 w-full flex-col justify-center">
          <EventLogSearchField value={props.search} onChange={props.onSearchChange} />
        </div>
      );
    case 'recordId':
      if (!props.onRecordIdInputChange) return null;
      return (
        <div
          key={field}
          className={`flex h-9 w-full flex-col justify-center${props.recordIdInputInvalid ? ` ${RADIUS.field} ring-1 ring-status-danger` : ''}`}
        >
          <SearchTextInput
            value={props.recordIdInput ?? ''}
            onChange={props.onRecordIdInputChange}
            placeholder={EVENT_LOG_FILTER_PLACEHOLDERS.recordId}
          />
        </div>
      );
    case 'dateRange':
      return (
        <div key={field} className="flex h-9 w-full items-center">
          <DatePicker
            value={props.dateRange}
            onChange={props.onDateRangeChange}
            placeholder={EVENT_LOG_FILTER_PLACEHOLDERS.dateRange}
            className="w-full"
          />
        </div>
      );
    case 'actorRole':
      return (
        <div key={field} className="flex h-9 w-full items-center">
          <MultiSelectFilter
            label="Actor role"
            options={actorRoleFilterOptions}
            selectedIds={props.actorRoles}
            onChange={values => props.onActorRolesChange(values as UserRole[])}
            placeholder={EVENT_LOG_FILTER_PLACEHOLDERS.actorRole}
            selectAllLabel="All roles"
            icon={ICONS.dataFields.userHands}
            className="w-full"
          />
        </div>
      );
    case 'actorSearch':
      return (
        <div key={field} className="flex h-9 w-full flex-col justify-center">
          <SearchTextInput
            value={props.actorSearch}
            onChange={props.onActorSearchChange}
            placeholder={EVENT_LOG_FILTER_PLACEHOLDERS.actorSearch}
          />
        </div>
      );
    case 'kind':
      return (
        <div key={field} className="flex h-9 w-full items-center">
          <MultiSelectFilter
            label="Event domain"
            options={kindFilterOptions}
            selectedIds={props.kinds}
            onChange={values => props.onKindsChange(values as EventLogKind[])}
            placeholder={EVENT_LOG_FILTER_PLACEHOLDERS.kind}
            selectAllLabel="All domains"
            icon={MODULE_ICONS.eventLog}
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
    case 'verbosity':
      return (
        <div key={field} className="flex h-9 w-full items-center">
          <Select
            id="event-log-verbosity"
            name="verbosity"
            aria-label={EVENT_LOG_FILTER_PLACEHOLDERS.verbosity}
            value={props.verbosity}
            onChange={event => props.onVerbosityChange(event.target.value as EventLogVerbosity)}
            options={VERBOSITY_OPTIONS}
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

  return <>{EVENT_LOG_FILTER_FIELD_ORDER.map(field => renderFieldControl(field, props, show))}</>;
};

function ModalSection({
  title,
  children,
  divider = true,
}: {
  title: string;
  children: React.ReactNode;
  divider?: boolean;
}) {
  return (
    <div className="w-full">
      <h4 className={FILTER_TYPE.sectionTitle}>{title}</h4>
      {children}
      {divider ? <div className="mt-space-4 border-b border-border-default" /> : null}
    </div>
  );
}

/** Fields shown only in the mobile filter modal (not in the shared field order grid). */
export function buildEventLogFilterModalExtras(
  props: EventLogFiltersInlineControlsProps,
  flags: {
    showSearch: boolean;
    showRecordId: boolean;
    showActorRole: boolean;
    showActorSearch: boolean;
    showIncludeAccess: boolean;
    showVerbosity: boolean;
  },
) {
  return (
    <>
      {flags.showSearch ? (
        <ModalSection title="Search">
          <EventLogSearchField value={props.search} onChange={props.onSearchChange} />
        </ModalSection>
      ) : null}
      {flags.showRecordId && props.onRecordIdInputChange ? (
        <ModalSection title="Record ID" divider={false}>
          <SearchTextInput
            value={props.recordIdInput ?? ''}
            onChange={props.onRecordIdInputChange}
            placeholder={EVENT_LOG_FILTER_PLACEHOLDERS.recordId}
          />
        </ModalSection>
      ) : null}
      {flags.showActorRole ? (
        <ModalSection title="Actor role">
          <EventLogFiltersInlineControls {...props} visibleFields={['actorRole']} />
        </ModalSection>
      ) : null}
      {flags.showActorSearch ? (
        <ModalSection title="Actor">
          <EventLogFiltersInlineControls {...props} visibleFields={['actorSearch']} />
        </ModalSection>
      ) : null}
      {flags.showIncludeAccess ? (
        <ModalSection title="Views & downloads" divider={false}>
          <Checkbox
            id="event-log-include-access-modal"
            checked={props.includeAccess}
            onChange={props.onIncludeAccessChange}
            label={EVENT_LOG_FILTER_PLACEHOLDERS.includeAccess}
          />
        </ModalSection>
      ) : null}
      {flags.showVerbosity ? (
        <ModalSection title="Detail level" divider={false}>
          <EventLogFiltersInlineControls {...props} visibleFields={['verbosity']} />
        </ModalSection>
      ) : null}
    </>
  );
}

export function buildEventLogFilterModalSections(
  kinds: EventLogKind[],
  onKindsChange: (values: EventLogKind[]) => void,
  dateRange: [Date, Date] | null,
  onDateRangeChange: (range: [Date, Date] | null) => void,
  flags: { showKind: boolean; showDate: boolean },
) {
  return (
    <>
      {flags.showDate ? (
        <ModalSection title="Date range">
          <DatePresetChipSelect value={dateRange} onChange={onDateRangeChange} />
        </ModalSection>
      ) : null}
      {flags.showKind ? (
        <ModalSection title="Event domain" divider={false}>
          <CheckboxList
            options={kindCheckboxOptions}
            selectedIds={kinds}
            onChange={values => onKindsChange(values as EventLogKind[])}
            columns={2}
          />
        </ModalSection>
      ) : null}
    </>
  );
}
