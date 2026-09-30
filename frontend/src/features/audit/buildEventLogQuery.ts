/**
 * Merge fixed panel query with interactive user filters for API requests.
 */
import { endOfDay, startOfDay } from 'date-fns';
import type { EventLogQuery, EventLogUserFilters } from './types';

export function buildEventLogQuery(
  fixed: EventLogQuery,
  user: EventLogUserFilters
): EventLogQuery {
  const merged: EventLogQuery = { ...fixed };

  if (user.categories.length > 0 && !fixed.categories?.length) {
    merged.categories = user.categories;
  }

  if (user.dateRange && !fixed.createdFrom && !fixed.createdTo && fixed.hours == null) {
    merged.createdFrom = startOfDay(user.dateRange[0]).toISOString();
    merged.createdTo = endOfDay(user.dateRange[1]).toISOString();
  }

  if (user.orderId != null && fixed.orderId == null) {
    merged.orderId = user.orderId;
  }

  if (user.testId != null && fixed.testId == null) {
    merged.testId = user.testId;
  }

  return merged;
}

export function eventLogQueryKeyParams(
  query: EventLogQuery
): Record<string, string | number | undefined> {
  return {
    orderId: query.orderId,
    patientId: query.patientId,
    targetType: query.targetType,
    targetId: query.targetId,
    testId: query.testId,
    hours: query.hours,
    createdFrom: query.createdFrom,
    createdTo: query.createdTo,
    categories: query.categories?.length ? query.categories.join(',') : undefined,
    limit: query.limit,
  };
}
