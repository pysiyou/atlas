/**
 * Interactive filter state for EventLogPanel, merged with fixed query constraints.
 */
import { useMemo, useState } from 'react';
import { buildEventLogQuery } from './buildEventLogQuery';
import { parseEntityFilterDisplayId } from './parseEntityDisplayId';
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
    case 'entityId':
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
  const usesEntityIdField = visibleFields.includes('entityId');
  const [entityIdInput, setEntityIdInput] = useState('');

  const parsedEntity = useMemo(
    () => parseEntityFilterDisplayId(entityIdInput),
    [entityIdInput]
  );

  const effectiveUserFilters = useMemo((): EventLogUserFilters => {
    const next: EventLogUserFilters = {
      ...userFilters,
      orderId: null,
      testId: null,
      sampleId: null,
      patientId: null,
    };
    if (!usesEntityIdField) {
      return next;
    }
    if (parsedEntity.kind === 'order') next.orderId = parsedEntity.orderId;
    if (parsedEntity.kind === 'test') next.testId = parsedEntity.testId;
    if (parsedEntity.kind === 'sample') next.sampleId = parsedEntity.sampleId;
    if (parsedEntity.kind === 'patient') next.patientId = parsedEntity.patientId;
    return next;
  }, [userFilters, usesEntityIdField, parsedEntity]);

  const mergedQuery = useMemo(
    () => buildEventLogQuery(query, effectiveUserFilters),
    [query, effectiveUserFilters]
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

  const hasEntityFilter =
    effectiveUserFilters.orderId != null ||
    effectiveUserFilters.testId != null ||
    effectiveUserFilters.sampleId != null ||
    effectiveUserFilters.patientId != null;

  const activeFilterCount =
    (effectiveUserFilters.kinds.length > 0 ? 1 : 0) +
    (effectiveUserFilters.dateRange ? 1 : 0) +
    (usesEntityIdField && hasEntityFilter ? 1 : 0) +
    (effectiveUserFilters.includeAccess ? 1 : 0) +
    (effectiveUserFilters.actorRoles.length > 0 ? 1 : 0) +
    (effectiveUserFilters.actorSearch.trim().length > 0 ? 1 : 0) +
    (effectiveUserFilters.search.trim().length > 0 ? 1 : 0) +
    (effectiveUserFilters.verbosity !== 'summary' ? 1 : 0);

  const resetUserFilters = () => {
    setUserFilters({ ...DEFAULT_FILTERS, ...filterDefaults });
    setEntityIdInput('');
  };

  return {
    userFilters,
    setUserFilters,
    entityIdInput,
    setEntityIdInput,
    mergedQuery,
    lockedFields,
    activeFilterCount,
    resetUserFilters,
    entityIdInputInvalid:
      usesEntityIdField && entityIdInput.trim().length > 0 && parsedEntity.kind === 'invalid',
  };
}
