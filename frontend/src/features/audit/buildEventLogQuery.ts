/**
 * Merge fixed panel query with interactive user filters for API requests.
 */
import { endOfDay, startOfDay } from 'date-fns';
import type { EventLogQuery, EventLogUserFilters } from './types';

/**
 * Apply user filters onto a fixed panel query.
 * On a stream panel, an entity id upgrades the scope (order / lab / patient).
 */
export function buildEventLogQuery(
  fixed: EventLogQuery,
  user: EventLogUserFilters
): EventLogQuery {
  const merged: EventLogQuery = { ...fixed };

  if (user.kinds.length > 0 && !fixed.kinds?.length) {
    merged.kinds = user.kinds;
  }

  if (user.dateRange && !fixed.createdFrom && !fixed.createdTo && fixed.hours == null) {
    merged.createdFrom = startOfDay(user.dateRange[0]).toISOString();
    merged.createdTo = endOfDay(user.dateRange[1]).toISOString();
  }

  if (user.includeAccess || user.verbosity === 'detailed' || user.verbosity === 'debug') {
    merged.includeAccess = true;
  }

  if (user.verbosity && user.verbosity !== 'summary') {
    merged.verbosity = user.verbosity;
  }

  const canUpgradeStream = fixed.scope === 'stream';
  if (canUpgradeStream) {
    if (user.orderId != null) {
      merged.scope = 'order';
      merged.orderId = user.orderId;
    } else if (user.testId != null) {
      merged.scope = 'lab';
      merged.testId = user.testId;
    } else if (user.sampleId != null) {
      merged.scope = 'lab';
      merged.sampleId = user.sampleId;
    } else if (user.patientId != null) {
      merged.scope = 'patient';
      merged.patientId = user.patientId;
    }
  }

  return merged;
}

export function eventLogQueryKeyParams(
  query: EventLogQuery
): Record<string, string | number | undefined> {
  return {
    scope: query.scope,
    orderId: query.orderId,
    patientId: query.patientId,
    testId: query.testId,
    sampleId: query.sampleId,
    hours: query.hours,
    createdFrom: query.createdFrom,
    createdTo: query.createdTo,
    kinds: query.kinds?.length ? query.kinds.join(',') : undefined,
    includeAccess: query.includeAccess ? 'true' : undefined,
    eventScope: query.eventScope,
    cursorCreatedAt: query.cursorCreatedAt,
    cursorEventId: query.cursorEventId,
    verbosity: query.verbosity,
    limit: query.limit,
  };
}
