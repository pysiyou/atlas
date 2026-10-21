import { parseISO, isValid } from 'date-fns';
import type { UserRole } from '@/types';
import {
  DEFAULT_EVENT_LOG_USER_FILTERS as DEFAULT_FILTERS,
  type EventLogKind,
  type EventLogUserFilters,
  type EventLogVerbosity,
} from './types';

export const EVENT_LOG_URL_FILTER_KEYS = [
  'eventKinds',
  'eventVerbosity',
  'eventIncludeAccess',
  'eventSearch',
  'eventActorSearch',
  'eventActorRoles',
  'eventDateFrom',
  'eventDateTo',
  'eventRecordId',
] as const;

export type EventLogUrlFilterKey = (typeof EVENT_LOG_URL_FILTER_KEYS)[number];

const VERBOSITY_VALUES: EventLogVerbosity[] = ['summary', 'detailed', 'debug'];

function parseDateParam(value: string | null): Date | null {
  if (!value) return null;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
}

export interface DecodedEventLogUrlFilters {
  userFilters: EventLogUserFilters;
  recordIdInput: string;
}

export function decodeEventLogUrlFilters(searchParams: URLSearchParams): DecodedEventLogUrlFilters {
  const kindsRaw = searchParams.get('eventKinds');
  const kinds = kindsRaw
    ? (kindsRaw.split(',').filter(Boolean) as EventLogKind[])
    : DEFAULT_FILTERS.kinds;

  const dateFrom = parseDateParam(searchParams.get('eventDateFrom'));
  const dateTo = parseDateParam(searchParams.get('eventDateTo'));
  const dateRange: [Date, Date] | null =
    dateFrom && dateTo ? [dateFrom, dateTo] : DEFAULT_FILTERS.dateRange;

  const verbosityRaw = searchParams.get('eventVerbosity');
  const verbosity: EventLogVerbosity =
    verbosityRaw && VERBOSITY_VALUES.includes(verbosityRaw as EventLogVerbosity)
      ? (verbosityRaw as EventLogVerbosity)
      : DEFAULT_FILTERS.verbosity;

  const actorRolesRaw = searchParams.get('eventActorRoles');
  const actorRoles = actorRolesRaw
    ? (actorRolesRaw.split(',').filter(Boolean) as UserRole[])
    : DEFAULT_FILTERS.actorRoles;

  const userFilters: EventLogUserFilters = {
    ...DEFAULT_FILTERS,
    kinds,
    dateRange,
    includeAccess: searchParams.get('eventIncludeAccess') === 'true',
    verbosity,
    actorRoles,
    actorSearch: searchParams.get('eventActorSearch') ?? '',
    search: searchParams.get('eventSearch') ?? '',
    orderId: null,
    testId: null,
    sampleId: null,
    patientId: null,
  };

  const recordIdInput = searchParams.get('eventRecordId') ?? '';

  return { userFilters, recordIdInput };
}

export function writeEventLogUrlFilters(
  params: URLSearchParams,
  userFilters: EventLogUserFilters,
  recordIdInput: string,
): void {
  for (const key of EVENT_LOG_URL_FILTER_KEYS) {
    params.delete(key);
  }

  if (userFilters.kinds.length > 0) {
    params.set('eventKinds', userFilters.kinds.join(','));
  }
  if (userFilters.verbosity !== 'summary') {
    params.set('eventVerbosity', userFilters.verbosity);
  }
  if (userFilters.includeAccess) {
    params.set('eventIncludeAccess', 'true');
  }
  if (userFilters.search.trim()) {
    params.set('eventSearch', userFilters.search.trim());
  }
  if (userFilters.actorSearch.trim()) {
    params.set('eventActorSearch', userFilters.actorSearch.trim());
  }
  if (userFilters.actorRoles.length > 0) {
    params.set('eventActorRoles', userFilters.actorRoles.join(','));
  }
  if (userFilters.dateRange) {
    params.set('eventDateFrom', userFilters.dateRange[0].toISOString().slice(0, 10));
    params.set('eventDateTo', userFilters.dateRange[1].toISOString().slice(0, 10));
  }
  if (recordIdInput.trim()) {
    params.set('eventRecordId', recordIdInput.trim());
  }
}
