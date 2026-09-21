/**
 * Shared cache invalidation helpers.
 *
 * Invalidation matrix:
 * - Orders: create/update/delete/payment → invalidateOrderQueries
 *   (also invalidates worklists when samples !== false)
 * - Patients: create/update/delete → invalidatePatientQueries
 * - Results: entry/validate/escalation → invalidateResultQueries
 * - Critical values: notify/acknowledge → invalidateCriticalValueQueries
 * - Quality issues: report → invalidateQualityIssueQueries
 * - Recollection: approve/deny → invalidateRecollectionQueries
 * - Collection: collect sample → invalidateCollectionQueries
 * - Lab board refresh → invalidateCommandCenterQueries
 * - Full lab workflow (validation modals) → invalidateLabWorkflowQueries
 * - Worklists + lab tab counts: queue changes → invalidateWorklistQueries (also refreshes board)
 */

import type { QueryClient, QueryKey } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './keys';

export interface InvalidateOrderOptions {
  orderId?: string | number;
  samples?: boolean;
  payments?: boolean;
}

function settleInvalidations(tasks: Array<Promise<unknown>>): Promise<void> {
  return Promise.all(tasks).then(() => undefined);
}

/** Lab tab badges read pipeline counts from the command-center board snapshot. */
export function invalidateLabBoardQuery(client: QueryClient): Promise<void> {
  return client.invalidateQueries({ queryKey: queryKeys.commandCenter.board() });
}

export function invalidateWorklistQueries(client: QueryClient): Promise<void> {
  return settleInvalidations([
    client.invalidateQueries({ queryKey: queryKeys.worklists.all }),
    invalidateLabBoardQuery(client),
  ]);
}

export function invalidateOrderQueries(
  client: QueryClient,
  options: InvalidateOrderOptions = {}
): Promise<void> {
  const { orderId, samples = true, payments = false } = options;
  const orderIdStr = orderId !== undefined ? String(orderId) : undefined;

  const tasks: Array<Promise<unknown>> = [
    client.invalidateQueries({ queryKey: queryKeys.orders.all }),
  ];
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
  samples?: boolean;
  pendingEscalation?: boolean;
}

export function invalidateResultQueries(
  client: QueryClient,
  options: InvalidateResultOptions = {}
): Promise<void> {
  const { orderId, samples = true, pendingEscalation = true } = options;
  const orderIdStr = orderId !== undefined ? String(orderId) : undefined;

  const tasks: Array<Promise<unknown>> = [
    client.invalidateQueries({ queryKey: queryKeys.orders.all }),
    client.invalidateQueries({ queryKey: queryKeys.results.all }),
    invalidateWorklistQueries(client),
  ];
  if (orderIdStr) {
    tasks.push(client.invalidateQueries({ queryKey: queryKeys.orders.byId(orderIdStr) }));
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
    client.invalidateQueries({ queryKey: queryKeys.recollectionRequests.all }),
    invalidateWorklistQueries(client),
  ]);
}

export function invalidateRecollectionQueries(client: QueryClient): Promise<void> {
  return settleInvalidations([
    client.invalidateQueries({ queryKey: queryKeys.recollectionRequests.all }),
    invalidateWorklistQueries(client),
  ]);
}

export function invalidateCollectionQueries(client: QueryClient): Promise<void> {
  return settleInvalidations([
    client.invalidateQueries({ queryKey: queryKeys.samples.all }),
    client.invalidateQueries({ queryKey: queryKeys.orders.all }),
    invalidateWorklistQueries(client),
  ]);
}

export function invalidateCommandCenterQueries(client: QueryClient): Promise<void> {
  return settleInvalidations([
    client.invalidateQueries({ queryKey: queryKeys.commandCenter.all }),
    client.invalidateQueries({ queryKey: queryKeys.results.pendingEscalation() }),
    client.invalidateQueries({ queryKey: queryKeys.recollectionRequests.all }),
    invalidateWorklistQueries(client),
  ]);
}

export interface InvalidateLabWorkflowOptions {
  orderId?: string | number;
  criticalValues?: boolean;
  pendingEscalation?: boolean;
}

export function invalidateLabWorkflowQueries(
  client: QueryClient,
  options: InvalidateLabWorkflowOptions = {}
): Promise<void> {
  const { orderId, criticalValues = false, pendingEscalation = false } = options;
  const tasks: Array<Promise<unknown>> = [
    invalidateOrderQueries(client, { orderId, samples: true, payments: false }),
    invalidateCommandCenterQueries(client),
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
