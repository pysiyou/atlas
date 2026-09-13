/**
 * Shared cache invalidation helpers.
 *
 * Invalidation matrix:
 * - Orders: create/update/delete/payment → invalidateOrderQueries
 * - Patients: create/update/delete → invalidatePatientQueries
 * - Results: entry/validate/escalation → invalidateResultQueries
 * - Critical values: notify/acknowledge → invalidateCriticalValueQueries
 * - Quality issues: report → invalidateQualityIssueQueries
 * - Recollection: approve/deny → invalidateRecollectionQueries
 * - Collection: collect sample → invalidateCollectionQueries
 * - Lab board refresh → invalidateCommandCenterQueries
 * - Full lab workflow (validation modals) → invalidateLabWorkflowQueries
 */

import type { QueryClient, QueryKey } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './keys';

export interface InvalidateOrderOptions {
  orderId?: string | number;
  samples?: boolean;
  payments?: boolean;
}

export function invalidateOrderQueries(
  client: QueryClient,
  options: InvalidateOrderOptions = {}
): void {
  const { orderId, samples = true, payments = false } = options;
  const orderIdStr = orderId !== undefined ? String(orderId) : undefined;

  client.invalidateQueries({ queryKey: queryKeys.orders.all });
  if (orderIdStr) {
    client.invalidateQueries({ queryKey: queryKeys.orders.byId(orderIdStr) });
  }
  if (samples) {
    client.invalidateQueries({ queryKey: queryKeys.samples.all });
  }
  if (payments) {
    client.invalidateQueries({ queryKey: queryKeys.payments.all });
  }
}

export function invalidateOrderDetailQuery(client: QueryClient, orderId: string): void {
  client.invalidateQueries({ queryKey: queryKeys.orders.byId(orderId) });
}

export interface InvalidatePatientOptions {
  patientId?: string | number;
}

export function invalidatePatientQueries(
  client: QueryClient,
  options: InvalidatePatientOptions = {}
): void {
  const { patientId } = options;
  const patientIdStr = patientId !== undefined ? String(patientId) : undefined;

  client.invalidateQueries({ queryKey: queryKeys.patients.all });
  if (patientIdStr) {
    client.invalidateQueries({ queryKey: queryKeys.patients.byId(patientIdStr) });
  }
}

export interface InvalidateResultOptions {
  orderId?: string | number;
  samples?: boolean;
  pendingEscalation?: boolean;
}

export function invalidateResultQueries(
  client: QueryClient,
  options: InvalidateResultOptions = {}
): void {
  const { orderId, samples = true, pendingEscalation = true } = options;
  const orderIdStr = orderId !== undefined ? String(orderId) : undefined;

  client.invalidateQueries({ queryKey: queryKeys.orders.all });
  if (orderIdStr) {
    client.invalidateQueries({ queryKey: queryKeys.orders.byId(orderIdStr) });
  }
  if (samples) {
    client.invalidateQueries({ queryKey: queryKeys.samples.all });
  }
  client.invalidateQueries({ queryKey: queryKeys.results.all });
  if (pendingEscalation) {
    client.invalidateQueries({ queryKey: queryKeys.results.pendingEscalation() });
  }
}

export interface InvalidateCriticalValueOptions {
  orderId?: string | number;
}

export function invalidateCriticalValueQueries(
  client: QueryClient,
  options: InvalidateCriticalValueOptions = {}
): void {
  client.invalidateQueries({ queryKey: queryKeys.criticalValues.all });
  invalidateOrderQueries(client, { orderId: options.orderId, samples: false, payments: false });
}

export function invalidateQualityIssueQueries(client: QueryClient): void {
  client.invalidateQueries({ queryKey: queryKeys.samples.all });
  client.invalidateQueries({ queryKey: queryKeys.orders.all });
  client.invalidateQueries({ queryKey: queryKeys.qualityIssues.all });
  client.invalidateQueries({ queryKey: queryKeys.recollectionRequests.all });
}

export function invalidateRecollectionQueries(client: QueryClient): void {
  client.invalidateQueries({ queryKey: queryKeys.recollectionRequests.all });
}

export function invalidateCollectionQueries(client: QueryClient): void {
  client.invalidateQueries({ queryKey: queryKeys.samples.all });
  client.invalidateQueries({ queryKey: queryKeys.orders.all });
}

export function invalidateCommandCenterQueries(client: QueryClient): void {
  client.invalidateQueries({ queryKey: queryKeys.orders.all });
  client.invalidateQueries({ queryKey: queryKeys.samples.all });
  client.invalidateQueries({ queryKey: queryKeys.commandCenter.all });
}

export interface InvalidateLabWorkflowOptions {
  orderId?: string | number;
  criticalValues?: boolean;
  pendingEscalation?: boolean;
}

export function invalidateLabWorkflowQueries(
  client: QueryClient,
  options: InvalidateLabWorkflowOptions = {}
): void {
  const { orderId, criticalValues = false, pendingEscalation = false } = options;
  invalidateOrderQueries(client, { orderId, samples: true, payments: false });
  invalidateCommandCenterQueries(client);
  if (criticalValues) {
    client.invalidateQueries({ queryKey: queryKeys.criticalValues.all });
  }
  if (pendingEscalation) {
    client.invalidateQueries({ queryKey: queryKeys.results.pendingEscalation() });
  }
}

export function invalidateSampleDetailQueries(
  client: QueryClient,
  sampleId?: string,
  orderId?: string
): void {
  if (sampleId) {
    client.invalidateQueries({ queryKey: queryKeys.samples.byId(sampleId) });
  }
  if (orderId) {
    client.invalidateQueries({ queryKey: queryKeys.samples.byOrder(orderId) });
  }
}

export function invalidatePendingEscalationQueries(client: QueryClient): void {
  client.invalidateQueries({ queryKey: queryKeys.results.pendingEscalation() });
}

export function invalidatePaymentDetailQueries(
  client: QueryClient,
  options: { paymentId?: string; orderId?: string }
): void {
  if (options.paymentId) {
    client.invalidateQueries({ queryKey: queryKeys.payments.byId(options.paymentId) });
  }
  if (options.orderId) {
    client.invalidateQueries({ queryKey: queryKeys.payments.byOrder(options.orderId) });
  }
}

export function useInvalidateQueryKey(queryKey: QueryKey) {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    return queryClient.invalidateQueries({ queryKey });
  };

  return { invalidateAll };
}
