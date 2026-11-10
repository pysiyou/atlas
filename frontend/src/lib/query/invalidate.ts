/**
 * Shared cache invalidation helpers.
 *
 * Invalidation matrix:
 * - Orders: create/update/delete/payment → invalidateOrderQueries
 *   (also invalidates worklists when samples !== false)
 * - Patients: create/update/delete → invalidatePatientQueries
 * - Lab result mutations (entry/validate/escalate/reject/critical UI) → invalidateAfterLabMutation
 * - Critical values (legacy direct) → invalidateCriticalValueQueries
 * - Quality issues (legacy direct) → invalidateQualityIssueQueries
 * - Collection: collect sample → invalidateCollectionQueries
 * - Lab monitor board → invalidateLabMonitorQueries
 * - Worklists + lab tab counts: queue changes → invalidateWorklistQueries (also refreshes board)
 */

import type { QueryClient, QueryKey } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import type { Order } from '@/types';
import type { PaginatedResponse } from '@/types/pagination';
import { queryKeys } from './keys';

export interface InvalidateOrderOptions {
  orderId?: string | number;
  samples?: boolean;
  payments?: boolean;
  /** Invalidate list/paginated order queries only (not the full `orders` prefix). */
  listsOnly?: boolean;
}

function settleInvalidations(tasks: Array<Promise<unknown>>): Promise<void> {
  return Promise.all(tasks).then(() => undefined);
}

/** Refresh event log feeds after mutations that emit audit rows. */
export function invalidateAuditEventQueries(client: QueryClient): Promise<void> {
  return client.invalidateQueries({ queryKey: queryKeys.auditEvents.all });
}

/** Lab tab badges read pipeline counts from the monitor board summary. */
export function invalidateLabMonitorQueries(client: QueryClient): Promise<void> {
  return client.invalidateQueries({ queryKey: queryKeys.labMonitor.all });
}

export function invalidateWorklistQueries(client: QueryClient): Promise<void> {
  return settleInvalidations([
    client.invalidateQueries({ queryKey: queryKeys.worklists.all }),
    invalidateLabMonitorQueries(client),
  ]);
}

/**
 * Merges fields onto a matching row in cached paginated order responses.
 */
export function patchOrderSummaryInPaginatedCaches(
  client: QueryClient,
  orderId: number,
  patch: Partial<Order>
): void {
  const queries = client.getQueriesData<PaginatedResponse<Order>>({
    queryKey: [...queryKeys.orders.all, 'paginated'],
  });
  for (const [key, page] of queries) {
    if (!page?.data?.length) continue;
    let changed = false;
    const data = page.data.map(row => {
      if (row.orderId !== orderId) return row;
      changed = true;
      return { ...row, ...patch };
    });
    if (changed) {
      client.setQueryData(key, { ...page, data });
    }
  }
}

export function invalidateOrderQueries(
  client: QueryClient,
  options: InvalidateOrderOptions = {}
): Promise<void> {
  const { orderId, samples = true, payments = false, listsOnly = false } = options;
  const orderIdStr = orderId !== undefined ? String(orderId) : undefined;

  const orderListTasks: Array<Promise<unknown>> = listsOnly
    ? [
        client.invalidateQueries({ queryKey: queryKeys.orders.lists() }),
        client.invalidateQueries({ queryKey: [...queryKeys.orders.all, 'paginated'] }),
      ]
    : [client.invalidateQueries({ queryKey: queryKeys.orders.all })];

  const tasks: Array<Promise<unknown>> = [...orderListTasks, invalidateAuditEventQueries(client)];
  if (orderIdStr) {
    tasks.push(client.invalidateQueries({ queryKey: queryKeys.orders.byId(orderIdStr) }));
  }
  if (samples) {
    tasks.push(client.invalidateQueries({ queryKey: queryKeys.samples.all }));
    tasks.push(invalidateWorklistQueries(client));
  }
  if (payments) {
    tasks.push(client.invalidateQueries({ queryKey: queryKeys.payments.all }));
  }
  return settleInvalidations(tasks);
}

export function invalidateOrderDetailQuery(client: QueryClient, orderId: string): Promise<void> {
  return client.invalidateQueries({ queryKey: queryKeys.orders.byId(orderId) });
}

export interface InvalidatePatientOptions {
  patientId?: string | number;
}

export function invalidatePatientQueries(
  client: QueryClient,
  options: InvalidatePatientOptions = {}
): Promise<void> {
  const { patientId } = options;
  const patientIdStr = patientId !== undefined ? String(patientId) : undefined;

  const tasks: Array<Promise<unknown>> = [
    client.invalidateQueries({ queryKey: queryKeys.patients.all }),
  ];
  if (patientIdStr) {
    tasks.push(client.invalidateQueries({ queryKey: queryKeys.patients.byId(patientIdStr) }));
  }
  return settleInvalidations(tasks);
}

export interface InvalidateResultOptions {
  orderId?: string | number;
  /** When set, refresh only that order-test context instead of every results query. */
  orderTestId?: number;
  samples?: boolean;
  pendingEscalation?: boolean;
}

export function invalidateResultQueries(
  client: QueryClient,
  options: InvalidateResultOptions = {}
): Promise<void> {
  const { orderId, orderTestId, samples = true, pendingEscalation = true } = options;
  const orderIdStr = orderId !== undefined ? String(orderId) : undefined;

  const tasks: Array<Promise<unknown>> = [
    invalidateWorklistQueries(client),
    invalidateAuditEventQueries(client),
  ];
  if (orderIdStr) {
    tasks.push(client.invalidateQueries({ queryKey: queryKeys.orders.byId(orderIdStr) }));
    tasks.push(client.invalidateQueries({ queryKey: queryKeys.orders.lists() }));
    tasks.push(client.invalidateQueries({ queryKey: [...queryKeys.orders.all, 'paginated'] }));
  } else {
    tasks.push(client.invalidateQueries({ queryKey: queryKeys.orders.all }));
  }
  if (orderTestId != null) {
    tasks.push(client.invalidateQueries({ queryKey: queryKeys.results.orderTest(orderTestId) }));
  } else {
    tasks.push(client.invalidateQueries({ queryKey: queryKeys.results.all }));
  }
  if (samples) {
    tasks.push(client.invalidateQueries({ queryKey: queryKeys.samples.all }));
  }
  if (pendingEscalation) {
    tasks.push(client.invalidateQueries({ queryKey: queryKeys.results.pendingEscalation() }));
  }
  return settleInvalidations(tasks);
}

export interface InvalidateCriticalValueOptions {
  orderId?: string | number;
}

export function invalidateCriticalValueQueries(
  client: QueryClient,
  options: InvalidateCriticalValueOptions = {}
): Promise<void> {
  return settleInvalidations([
    client.invalidateQueries({ queryKey: queryKeys.criticalValues.all }),
    invalidateOrderQueries(client, { orderId: options.orderId, samples: false, payments: false }),
  ]);
}

export function invalidateQualityIssueQueries(client: QueryClient): Promise<void> {
  return settleInvalidations([
    client.invalidateQueries({ queryKey: queryKeys.samples.all }),
    client.invalidateQueries({ queryKey: queryKeys.orders.all }),
    client.invalidateQueries({ queryKey: queryKeys.qualityIssues.all }),
    invalidateWorklistQueries(client),
    invalidateAuditEventQueries(client),
  ]);
}

export function invalidateCollectionQueries(client: QueryClient): Promise<void> {
  return settleInvalidations([
    client.invalidateQueries({ queryKey: queryKeys.samples.all }),
    client.invalidateQueries({ queryKey: queryKeys.orders.lists() }),
    client.invalidateQueries({ queryKey: [...queryKeys.orders.all, 'paginated'] }),
    invalidateWorklistQueries(client),
    invalidateAuditEventQueries(client),
  ]);
}
export function invalidateLabMonitorQueriesFull(client: QueryClient): Promise<void> {
  return settleInvalidations([
    invalidateLabMonitorQueries(client),
    client.invalidateQueries({ queryKey: queryKeys.results.pendingEscalation() }),
    invalidateWorklistQueries(client),
  ]);
}

export type LabMutationInvalidationKind =
  | 'enterResults'
  | 'validateResults'
  | 'resolveEscalation'
  | 'qualityIssue'
  | 'criticalValue'
  | 'workflowSurface';

export interface InvalidateAfterLabMutationOptions {
  kind: LabMutationInvalidationKind;
  orderId?: string | number;
  orderTestId?: number;
}

/** Single entry point for lab workflow mutations — encodes worklist/monitor/order refresh matrix. */
export function invalidateAfterLabMutation(
  client: QueryClient,
  options: InvalidateAfterLabMutationOptions
): Promise<void> {
  const { kind, orderId, orderTestId } = options;

  switch (kind) {
    case 'enterResults':
    case 'validateResults':
      return invalidateResultQueries(client, {
        orderId,
        orderTestId,
        samples: false,
      });
    case 'resolveEscalation':
      return invalidateResultQueries(client, {
        orderId,
        orderTestId,
        samples: true,
        pendingEscalation: true,
      });
    case 'qualityIssue':
      if (orderId != null || orderTestId != null) {
        return settleInvalidations([
          invalidateQualityIssueQueries(client),
          invalidateResultQueries(client, {
            orderId,
            orderTestId,
            samples: true,
            pendingEscalation: true,
          }),
        ]);
      }
      return invalidateQualityIssueQueries(client);
    case 'criticalValue':
      return settleInvalidations([
        invalidateCriticalValueQueries(client, { orderId }),
        invalidateWorklistQueries(client),
        invalidateLabMonitorQueries(client),
      ]);
    case 'workflowSurface':
      return settleInvalidations([
        invalidateOrderQueries(client, { orderId, samples: true, payments: false }),
        invalidateLabMonitorQueriesFull(client),
      ]);
    default: {
      const _exhaustive: never = kind;
      return Promise.resolve(_exhaustive);
    }
  }
}

export interface InvalidateLabWorkflowOptions {
  orderId?: string | number;
  criticalValues?: boolean;
  pendingEscalation?: boolean;
}

/** @deprecated Prefer invalidateAfterLabMutation from lab feature code. */
export function invalidateLabWorkflowQueries(
  client: QueryClient,
  options: InvalidateLabWorkflowOptions = {}
): Promise<void> {
  const { orderId, criticalValues = false, pendingEscalation = false } = options;
  const tasks: Array<Promise<unknown>> = [
    invalidateOrderQueries(client, { orderId, samples: true, payments: false }),
    invalidateLabMonitorQueriesFull(client),
  ];
  if (criticalValues) {
    tasks.push(client.invalidateQueries({ queryKey: queryKeys.criticalValues.all }));
  }
  if (pendingEscalation) {
    tasks.push(client.invalidateQueries({ queryKey: queryKeys.results.pendingEscalation() }));
  }
  return settleInvalidations(tasks);
}

export function invalidateSampleDetailQueries(
  client: QueryClient,
  sampleId?: string,
  orderId?: string
): Promise<void> {
  const tasks: Array<Promise<unknown>> = [];
  if (sampleId) {
    tasks.push(client.invalidateQueries({ queryKey: queryKeys.samples.byId(sampleId) }));
  }
  if (orderId) {
    tasks.push(client.invalidateQueries({ queryKey: queryKeys.samples.byOrder(orderId) }));
  }
  return settleInvalidations(tasks);
}

export function invalidatePendingEscalationQueries(client: QueryClient): Promise<void> {
  return client.invalidateQueries({ queryKey: queryKeys.results.pendingEscalation() });
}

export function invalidatePaymentDetailQueries(
  client: QueryClient,
  options: { paymentId?: string; orderId?: string }
): Promise<void> {
  const tasks: Array<Promise<unknown>> = [];
  if (options.paymentId) {
    tasks.push(client.invalidateQueries({ queryKey: queryKeys.payments.byId(options.paymentId) }));
  }
  if (options.orderId) {
    tasks.push(client.invalidateQueries({ queryKey: queryKeys.payments.byOrder(options.orderId) }));
  }
  return settleInvalidations(tasks);
}

export function useInvalidateQueryKey(queryKey: QueryKey) {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    return queryClient.invalidateQueries({ queryKey });
  };

  return { invalidateAll };
}
