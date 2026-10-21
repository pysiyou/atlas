/**
 * Record id parsing, panel filter derivation, local and URL-synced filter state.
 */

import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useSearchParams } from 'react-router-dom';
import { ID_PREFIXES, parseDisplayId } from '@/utils/id';
import { buildEventLogQuery } from './buildEventLogQuery';
import {
  DEFAULT_EVENT_LOG_USER_FILTERS as DEFAULT_FILTERS,
  type EventLogFilterField,
  type EventLogQuery,
  type EventLogUserFilters,
} from './types';
import { decodeEventLogUrlFilters, writeEventLogUrlFilters } from './eventLogUrlCodec';

// --- parseRecordDisplayId ---

export function parseOrderDisplayId(input: string): number | null {
  return parseDisplayId('order', input);
}

export function parseOrderTestDisplayId(input: string): number | null {
  return parseDisplayId('orderTest', input);
}

export function parseSampleDisplayId(input: string): number | null {
  return parseDisplayId('sample', input);
}

export function parsePatientDisplayId(input: string): number | null {
  return parseDisplayId('patient', input);
}

export type ParsedRecordIdFilter =
  | { kind: 'empty' }
  | { kind: 'order'; orderId: number }
  | { kind: 'test'; testId: number }
  | { kind: 'sample'; sampleId: number }
  | { kind: 'patient'; patientId: number }
  | { kind: 'invalid' };

export function parseRecordFilterDisplayId(input: string): ParsedRecordIdFilter {
  const trimmed = input.trim();
  if (!trimmed) {
    return { kind: 'empty' };
  }
  const upper = trimmed.toUpperCase();
  if (upper.startsWith(ID_PREFIXES.orderTest)) {
    const testId = parseOrderTestDisplayId(input);
    return testId != null ? { kind: 'test', testId } : { kind: 'invalid' };
  }
  if (upper.startsWith(ID_PREFIXES.order)) {
    const orderId = parseOrderDisplayId(input);
    return orderId != null ? { kind: 'order', orderId } : { kind: 'invalid' };
  }
  if (upper.startsWith(ID_PREFIXES.sample)) {
    const sampleId = parseSampleDisplayId(input);
    return sampleId != null ? { kind: 'sample', sampleId } : { kind: 'invalid' };
  }
  if (upper.startsWith(ID_PREFIXES.patient)) {
    const patientId = parsePatientDisplayId(input);
    return patientId != null ? { kind: 'patient', patientId } : { kind: 'invalid' };
  }
  const orderId = parseOrderDisplayId(input);
  return orderId != null ? { kind: 'order', orderId } : { kind: 'invalid' };
}

// --- derive panel state ---

export function isEventLogFieldLocked(field: EventLogFilterField, query: EventLogQuery): boolean {
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

export interface DeriveEventLogPanelStateInput {
  query: EventLogQuery;
  userFilters: EventLogUserFilters;
  recordIdInput: string;
  visibleFields: EventLogFilterField[];
}

export interface DerivedEventLogPanelState {
  effectiveUserFilters: EventLogUserFilters;
  mergedQuery: EventLogQuery;
  lockedFields: Set<EventLogFilterField>;
  activeFilterCount: number;
  recordIdInputInvalid: boolean;
}

export function defaultEventLogUserFilters(
  filterDefaults?: Partial<EventLogUserFilters>,
): EventLogUserFilters {
  return { ...DEFAULT_FILTERS, ...filterDefaults };
}

export function deriveEventLogPanelState({
  query,
  userFilters,
  recordIdInput,
  visibleFields,
}: DeriveEventLogPanelStateInput): DerivedEventLogPanelState {
  const usesRecordIdField = visibleFields.includes('recordId');
  const parsedRecord = parseRecordFilterDisplayId(recordIdInput);

  const effectiveUserFilters: EventLogUserFilters = (() => {
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
  })();

  const mergedQuery = buildEventLogQuery(query, effectiveUserFilters);

  const lockedFields = new Set<EventLogFilterField>();
  for (const field of visibleFields) {
    if (isEventLogFieldLocked(field, query)) {
      lockedFields.add(field);
    }
  }

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

  const recordIdInputInvalid =
    usesRecordIdField && recordIdInput.trim().length > 0 && parsedRecord.kind === 'invalid';

  return {
    effectiveUserFilters,
    mergedQuery,
    lockedFields,
    activeFilterCount,
    recordIdInputInvalid,
  };
}

// --- hooks ---

export interface UseEventLogPanelStateOptions {
  query: EventLogQuery;
  filterDefaults?: Partial<EventLogUserFilters>;
  visibleFields?: EventLogFilterField[];
}

export type EventLogPanelFilterState = {
  userFilters: EventLogUserFilters;
  setUserFilters: Dispatch<SetStateAction<EventLogUserFilters>>;
  recordIdInput: string;
  setRecordIdInput: (value: string) => void;
  mergedQuery: EventLogQuery;
  lockedFields: Set<EventLogFilterField>;
  activeFilterCount: number;
  resetUserFilters: () => void;
  recordIdInputInvalid: boolean;
};

export function useEventLogPanelState({
  query,
  filterDefaults,
  visibleFields = [],
}: UseEventLogPanelStateOptions): EventLogPanelFilterState {
  const [userFilters, setUserFilters] = useState<EventLogUserFilters>(() =>
    defaultEventLogUserFilters(filterDefaults),
  );
  const [recordIdInput, setRecordIdInput] = useState('');

  const derived = useMemo(
    () =>
      deriveEventLogPanelState({
        query,
        userFilters,
        recordIdInput,
        visibleFields,
      }),
    [query, userFilters, recordIdInput, visibleFields],
  );

  const resetUserFilters = () => {
    setUserFilters(defaultEventLogUserFilters(filterDefaults));
    setRecordIdInput('');
  };

  return {
    userFilters,
    setUserFilters,
    recordIdInput,
    setRecordIdInput,
    mergedQuery: derived.mergedQuery,
    lockedFields: derived.lockedFields,
    activeFilterCount: derived.activeFilterCount,
    resetUserFilters,
    recordIdInputInvalid: derived.recordIdInputInvalid,
  };
}

export interface UseEventLogUrlPageFiltersOptions {
  query: EventLogQuery;
  filterDefaults?: Partial<EventLogUserFilters>;
  visibleFields: EventLogFilterField[];
}

export function useEventLogUrlPageFilters({
  query,
  filterDefaults,
  visibleFields,
}: UseEventLogUrlPageFiltersOptions): EventLogPanelFilterState {
  const [searchParams, setSearchParams] = useSearchParams();

  const decoded = useMemo(() => decodeEventLogUrlFilters(searchParams), [searchParams]);

  const [recordIdInput, setRecordIdInput] = useState(decoded.recordIdInput);

  useEffect(() => {
    setRecordIdInput(decoded.recordIdInput);
  }, [decoded.recordIdInput]);

  const userFilters = useMemo(
    () => ({
      ...defaultEventLogUserFilters(filterDefaults),
      ...decoded.userFilters,
    }),
    [decoded.userFilters, filterDefaults],
  );

  const persist = useCallback(
    (nextUser: EventLogUserFilters, nextRecordId: string) => {
      setSearchParams(
        prev => {
          const params = new URLSearchParams(prev);
          writeEventLogUrlFilters(params, nextUser, nextRecordId);
          return params;
        },
        { replace: false },
      );
    },
    [setSearchParams],
  );

  const setUserFilters = useCallback(
    (updater: EventLogUserFilters | ((prev: EventLogUserFilters) => EventLogUserFilters)) => {
      const next = typeof updater === 'function' ? updater(userFilters) : updater;
      persist(next, recordIdInput);
    },
    [persist, recordIdInput, userFilters],
  ) as Dispatch<SetStateAction<EventLogUserFilters>>;

  const setRecordIdInputAndUrl = useCallback(
    (value: string) => {
      setRecordIdInput(value);
      persist(userFilters, value);
    },
    [persist, userFilters],
  );

  const derived = useMemo(
    () =>
      deriveEventLogPanelState({
        query,
        userFilters,
        recordIdInput,
        visibleFields,
      }),
    [query, userFilters, recordIdInput, visibleFields],
  );

  const resetUserFilters = useCallback(() => {
    const defaults = defaultEventLogUserFilters(filterDefaults);
    setRecordIdInput('');
    persist(defaults, '');
  }, [filterDefaults, persist]);

  return {
    userFilters,
    setUserFilters,
    recordIdInput,
    setRecordIdInput: setRecordIdInputAndUrl,
    mergedQuery: derived.mergedQuery,
    lockedFields: derived.lockedFields,
    activeFilterCount: derived.activeFilterCount,
    recordIdInputInvalid: derived.recordIdInputInvalid,
    resetUserFilters,
  };
}
