/* eslint-disable react-refresh/only-export-components -- modal section builders */
import React from 'react';
import { Checkbox } from '@/components/primitives';
import { SearchTextInput } from '@/components/inputs';
import { DatePresetChipSelect } from '@/components/filters';
import { CheckboxList } from '@/components/primitives';
import { FILTER_TYPE } from '@/theme/recipes';
import {
  EVENT_LOG_FILTER_PLACEHOLDERS,
  EVENT_LOG_KIND_OPTIONS,
} from './eventLogFilterConfig';
import { EventLogSearchField } from './eventLogSearch';
import {
  EventLogFiltersInlineControls,
  type EventLogFiltersInlineControlsProps,
} from './eventLogFilterControls';
import type { EventLogKind } from './types';

const kindCheckboxOptions = EVENT_LOG_KIND_OPTIONS.map(opt => ({
  id: opt.id,
  label: opt.label,
}));

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
