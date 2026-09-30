/**
 * Interactive filter state for EventLogPanel, merged with fixed query constraints.
 */
import { useMemo, useState } from 'react';
import { buildEventLogQuery } from './buildEventLogQuery';
import {
  parseOrderDisplayId,
  parseOrderOrTestDisplayId,
  parseOrderTestDisplayId,
} from './parseEntityDisplayId';
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
    case 'entityId':
      return query.orderId != null || query.testId != null;
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
  const [orderIdInput, setOrderIdInput] = useState('');
  const [testIdInput, setTestIdInput] = useState('');
  const [entityIdInput, setEntityIdInput] = useState('');

  const parsedEntity = useMemo(
    () => parseOrderOrTestDisplayId(entityIdInput),
    [entityIdInput]
  );

  const parsedOrderId = useMemo(() => {
    if (usesEntityIdField) {
      return parsedEntity.kind === 'order' ? parsedEntity.orderId : null;
    }
    if (!orderIdInput.trim()) return null;
    return parseOrderDisplayId(orderIdInput);
  }, [usesEntityIdField, parsedEntity, orderIdInput]);

  const parsedTestId = useMemo(() => {
    if (usesEntityIdField) {
      return parsedEntity.kind === 'test' ? parsedEntity.testId : null;
    }
    if (!testIdInput.trim()) return null;
    return parseOrderTestDisplayId(testIdInput);
  }, [usesEntityIdField, parsedEntity, testIdInput]);

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

  const hasEntityFilter =
    effectiveUserFilters.orderId != null || effectiveUserFilters.testId != null;

  const activeFilterCount =
    (effectiveUserFilters.categories.length > 0 ? 1 : 0) +
    (effectiveUserFilters.dateRange ? 1 : 0) +
    (usesEntityIdField ? (hasEntityFilter ? 1 : 0) : 0) +
    (!usesEntityIdField && effectiveUserFilters.orderId != null ? 1 : 0) +
    (!usesEntityIdField && effectiveUserFilters.testId != null ? 1 : 0);

  const resetUserFilters = () => {
    setUserFilters({ ...DEFAULT_FILTERS, ...filterDefaults });
    setOrderIdInput('');
    setTestIdInput('');
    setEntityIdInput('');
  };

  return {
    userFilters,
    setUserFilters,
    orderIdInput,
    setOrderIdInput,
    testIdInput,
    setTestIdInput,
    entityIdInput,
    setEntityIdInput,
    mergedQuery,
    lockedFields,
    activeFilterCount,
    resetUserFilters,
    orderIdInputInvalid:
      !usesEntityIdField && orderIdInput.trim().length > 0 && parsedOrderId === null,
    testIdInputInvalid:
      !usesEntityIdField && testIdInput.trim().length > 0 && parsedTestId === null,
    entityIdInputInvalid:
      usesEntityIdField && entityIdInput.trim().length > 0 && parsedEntity.kind === 'invalid',
  };
}
