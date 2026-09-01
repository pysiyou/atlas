/**
 * Shared cache invalidation helpers.
 * Use in mutation onSuccess/onSettled so all dependent queries refresh without page reload.
 */

import type { QueryClient, QueryKey } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './keys';

export interface InvalidateOrderOptions {
  orderId?: string | number;
  /** Invalidate samples (e.g. after order create/update/delete). Default true when orderId set. */
  samples?: boolean;
  /** Invalidate payments (e.g. after payment status change). */
  payments?: boolean;
}

/**
 * Invalidate order-related queries. Use after any order create/update/delete.
 */
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

export interface InvalidatePatientOptions {
  patientId?: string | number;
}

/**
 * Invalidate patient-related queries. Use after any patient create/update/delete.
 */
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

/**
 * Invalidate result-related and dependent queries. Use after result entry/validate/reject/resolve escalation.
 */
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
  client.invalidateQueries({ queryKey: ['labOperationLogs'] });
  client.invalidateQueries({ queryKey: ['labOperationLogsCount'] });
}

/**
 * Generic hook to invalidate queries by key prefix.
 */
export function useInvalidateQueryKey(queryKey: QueryKey) {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    return queryClient.invalidateQueries({ queryKey });
  };

  return { invalidateAll };
}
