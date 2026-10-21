/**
 * Interactive filter state for EventLogPanel, merged with fixed query constraints.
 */
import { useMemo, useState } from 'react';
import { buildEventLogQuery } from './buildEventLogQuery';
import { parseRecordFilterDisplayId } from './parseRecordDisplayId';
import {
  DEFAULT_EVENT_LOG_USER_FILTERS as DEFAULT_FILTERS,
  type EventLogFilterField,
  type EventLogQuery,
  type EventLogUserFilters,
} from './types';

export interface UseEventLogPanelStateOptions {
  query: EventLogQuery;
  filterDefaults?: Partial<EventLogUserFilters>;
  visibleFields?: EventLogFilterField[];
}

function isFieldLocked(field: EventLogFilterField, query: EventLogQuery): boolean {
  switch (field) {
    case 'kind':
      return Boolean(query.kinds?.length);
    case 'dateRange':
      return query.hours != null || Boolean(query.createdFrom || query.createdTo);
    case 'recordId':
      return (
        query.scope !== 'stream' ||
        query.orderId != null ||
        query.testId != null ||
        query.sampleId != null ||
        query.patientId != null
      );
    case 'includeAccess':
      return query.includeAccess === true;
    case 'actorRole':
      return Boolean(query.actorRoles?.length);
    case 'actorSearch':
      return Boolean(query.actorSearch?.trim());
    case 'search':
      return Boolean(query.search?.trim());
    case 'verbosity':
      return query.verbosity != null && query.verbosity !== 'summary';
  }
}

export function useEventLogPanelState({
  query,
  filterDefaults,
  visibleFields = [],
}: UseEventLogPanelStateOptions) {
  const [userFilters, setUserFilters] = useState<EventLogUserFilters>(() => ({
    ...DEFAULT_FILTERS,
    ...filterDefaults,
  }));
  const usesRecordIdField = visibleFields.includes('recordId');
  const [recordIdInput, setRecordIdInput] = useState('');

  const parsedRecord = useMemo(
    () => parseRecordFilterDisplayId(recordIdInput),
    [recordIdInput],
  );

  const effectiveUserFilters = useMemo((): EventLogUserFilters => {
    const next: EventLogUserFilters = {
      ...userFilters,
      orderId: null,
      testId: null,
      sampleId: null,
      patientId: null,
    };
    if (!usesRecordIdField) {
      return next;
    }
    if (parsedRecord.kind === 'order') next.orderId = parsedRecord.orderId;
    if (parsedRecord.kind === 'test') next.testId = parsedRecord.testId;
    if (parsedRecord.kind === 'sample') next.sampleId = parsedRecord.sampleId;
    if (parsedRecord.kind === 'patient') next.patientId = parsedRecord.patientId;
    return next;
  }, [userFilters, usesRecordIdField, parsedRecord]);

  const mergedQuery = useMemo(
    () => buildEventLogQuery(query, effectiveUserFilters),
    [query, effectiveUserFilters],
  );

  const lockedFields = useMemo(() => {
    const locked = new Set<EventLogFilterField>();
    for (const field of visibleFields) {
      if (isFieldLocked(field, query)) {
        locked.add(field);
      }
    }
    return locked;
  }, [query, visibleFields]);

  const hasRecordFilter =
    effectiveUserFilters.orderId != null ||
    effectiveUserFilters.testId != null ||
    effectiveUserFilters.sampleId != null ||
    effectiveUserFilters.patientId != null;

  const activeFilterCount =
    (effectiveUserFilters.kinds.length > 0 ? 1 : 0) +
    (effectiveUserFilters.dateRange ? 1 : 0) +
    (usesRecordIdField && hasRecordFilter ? 1 : 0) +
    (effectiveUserFilters.includeAccess ? 1 : 0) +
    (effectiveUserFilters.actorRoles.length > 0 ? 1 : 0) +
    (effectiveUserFilters.actorSearch.trim().length > 0 ? 1 : 0) +
    (effectiveUserFilters.search.trim().length > 0 ? 1 : 0) +
    (effectiveUserFilters.verbosity !== 'summary' ? 1 : 0);

  const resetUserFilters = () => {
    setUserFilters({ ...DEFAULT_FILTERS, ...filterDefaults });
    setRecordIdInput('');
  };

  return {
    userFilters,
    setUserFilters,
    recordIdInput,
    setRecordIdInput,
    mergedQuery,
    lockedFields,
    activeFilterCount,
    resetUserFilters,
    recordIdInputInvalid:
      usesRecordIdField && recordIdInput.trim().length > 0 && parsedRecord.kind === 'invalid',
  };
}
