/**
 * Event log filter bar, inline controls, and panel filter row.
 */
import React, { useState, type ReactNode } from 'react';
import { Checkbox } from '@/components/primitives';
import { SearchTextInput, Select } from '@/components/inputs';
import { DatePicker } from '@/components/inputs/DatePicker';
import { MultiSelectFilter } from '@/components/overlays/MultiSelectFilter';
import { actionButtonPreset, Badge, Button } from '@/components/primitives';
import { Modal, ModalPageShell } from '@/components/overlays';
import { FILTER, FILTER_TYPE, RADIUS } from '@/theme/recipes';
import { cn } from '@/utils';
import { useBreakpoint, isBreakpointAtMost } from '@/hooks/useBreakpoint';
import { MODULE_ICONS } from '@/config/icons';
import { FilterModalFooter } from '@/components/filters/FilterModalFooter';
import { CheckboxList } from '@/components/primitives';
import { DatePresetChipSelect } from '@/components/filters';
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

export interface EventLogFilterBarProps {
  activeFilterCount: number;
  inlineControls: ReactNode;
  modalExtras?: ReactNode;
  kinds: EventLogKind[];
  onKindsChange: (values: EventLogKind[]) => void;
  dateRange: [Date, Date] | null;
  onDateRangeChange: (range: [Date, Date] | null) => void;
  onReset: () => void;
  showKindInModal?: boolean;
  showDateInModal?: boolean;
}

const kindCheckboxOptions = EVENT_LOG_KIND_OPTIONS.map(opt => ({
  id: opt.id,
  label: opt.label,
}));

const EventLogFilterBar: React.FC<EventLogFilterBarProps> = ({
  activeFilterCount,
  inlineControls,
  modalExtras,
  kinds,
  onKindsChange,
  dateRange,
  onDateRangeChange,
  onReset,
  showKindInModal,
  showDateInModal,
}) => {
  const breakpoint = useBreakpoint();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const showModalView = isBreakpointAtMost(breakpoint, 'sm');
  const showTwoColumn = breakpoint === 'md';

  if (showModalView) {
    return (
      <>
        <div className="w-full border-b border-border-default bg-surface">
          <div className="flex items-center justify-end gap-space-2 px-space-3 py-space-2">
            <div className="relative flex shrink-0">
              <Button {...actionButtonPreset('filter')} size="sm" onClick={() => setIsModalOpen(true)}>
                Filters
              </Button>
              {activeFilterCount > 0 && (
                <Badge
                  variant="primary"
                  size="xs"
                  className="absolute -top-space-1 -right-space-1 flex h-4 min-w-[18px] items-center justify-center px-space-1"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Filter events" size="md">
          <ModalPageShell
            tone="panel"
            bodyPadding="filter"
            bodyClassName="space-y-space-5"
            footer={
              <FilterModalFooter
                onReset={onReset}
                onApply={() => setIsModalOpen(false)}
                icon={MODULE_ICONS.eventLog}
                label="Event log"
              />
            }
          >
            {modalExtras}
            {showDateInModal ? (
              <div className="w-full">
                <h4 className={FILTER_TYPE.sectionTitle}>Date range</h4>
                <DatePresetChipSelect value={dateRange} onChange={onDateRangeChange} />
                <div className="mt-space-4 border-b border-border-default" />
              </div>
            ) : null}
            {showKindInModal ? (
              <div className="w-full">
                <h4 className={FILTER_TYPE.sectionTitle}>Event domain</h4>
                <CheckboxList
                  options={kindCheckboxOptions}
                  selectedIds={kinds}
                  onChange={values => onKindsChange(values as EventLogKind[])}
                  columns={2}
                />
                <div className="mt-space-4 border-b border-border-default" />
              </div>
            ) : null}
          </ModalPageShell>
        </Modal>
      </>
    );
  }

  if (showTwoColumn) {
    return (
      <div className={cn('w-full border-b border-border-default bg-surface')}>
        <div className={FILTER.barInsetCompact}>
          <div className={FILTER.mobileTwoCol}>{inlineControls}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full border-b border-border-default bg-surface">
      <div className={FILTER.barInset}>
        <div className={FILTER.barGridDesktop}>{inlineControls}</div>
      </div>
    </div>
  );
};

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

interface EventLogFiltersInlineControlsProps {
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
  show: (f: EventLogFilterField) => boolean
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

const EventLogFiltersInlineControls: React.FC<EventLogFiltersInlineControlsProps> = props => {
  const show = (field: EventLogFilterField) =>
    props.visibleFields.includes(field) && !props.lockedFields.has(field);

  return (
    <>
      {EVENT_LOG_FILTER_FIELD_ORDER.map(field => renderFieldControl(field, props, show))}
    </>
  );
};

export interface EventLogFiltersProps {
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
  const showRecordId =
    props.visibleFields.includes('recordId') && !props.lockedFields.has('recordId');
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
      {showRecordId && props.onRecordIdInputChange ? (
        <div className="w-full">
          <h4 className={FILTER_TYPE.sectionTitle}>Record ID</h4>
          <SearchTextInput
            value={props.recordIdInput ?? ''}
            onChange={props.onRecordIdInputChange}
            placeholder={EVENT_LOG_FILTER_PLACEHOLDERS.recordId}
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
          recordIdInput={props.recordIdInput}
          onRecordIdInputChange={props.onRecordIdInputChange}
          recordIdInputInvalid={props.recordIdInputInvalid}
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
