/**
 * Interactive filter state for EventLogPanel, merged with fixed query constraints.
 */
import { useMemo, useState } from 'react';
import { buildEventLogQuery } from './buildEventLogQuery';
import { parseOrderDisplayId, parseOrderTestDisplayId } from './parseEntityDisplayId';
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

function isFieldLocked(
  field: EventLogFilterField,
  query: EventLogQuery
): boolean {
  switch (field) {
    case 'category':
      return Boolean(query.categories?.length);
    case 'dateRange':
      return query.hours != null || Boolean(query.createdFrom || query.createdTo);
    case 'orderId':
      return query.orderId != null;
    case 'testId':
      return query.testId != null;
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
  const [orderIdInput, setOrderIdInput] = useState('');
  const [testIdInput, setTestIdInput] = useState('');

  const parsedOrderId = useMemo(() => {
    if (!orderIdInput.trim()) return null;
    return parseOrderDisplayId(orderIdInput);
  }, [orderIdInput]);

  const parsedTestId = useMemo(() => {
    if (!testIdInput.trim()) return null;
    return parseOrderTestDisplayId(testIdInput);
  }, [testIdInput]);

  const effectiveUserFilters = useMemo(
    (): EventLogUserFilters => ({
      ...userFilters,
      orderId: parsedOrderId,
      testId: parsedTestId,
    }),
    [userFilters, parsedOrderId, parsedTestId]
  );

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

  const activeFilterCount =
    (effectiveUserFilters.categories.length > 0 ? 1 : 0) +
    (effectiveUserFilters.dateRange ? 1 : 0) +
    (effectiveUserFilters.orderId != null ? 1 : 0) +
    (effectiveUserFilters.testId != null ? 1 : 0);

  const resetUserFilters = () => {
    setUserFilters({ ...DEFAULT_FILTERS, ...filterDefaults });
    setOrderIdInput('');
    setTestIdInput('');
  };

  return {
    userFilters,
    setUserFilters,
    orderIdInput,
    setOrderIdInput,
    testIdInput,
    setTestIdInput,
    mergedQuery,
    lockedFields,
    activeFilterCount,
    resetUserFilters,
    orderIdInputInvalid: orderIdInput.trim().length > 0 && parsedOrderId === null,
    testIdInputInvalid: testIdInput.trim().length > 0 && parsedTestId === null,
  };
}
