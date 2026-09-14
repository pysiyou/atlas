/**
 * Payment API service — pure HTTP, no React.
 */
import { apiClient } from '@/lib/api/client';
import { WORKFLOW_QUERY_LIMIT } from '@/lib/api/constants';
import { paymentResponseSchema, parseApiResponse } from '@/lib/api/schemas/responses.schema';
import type { ApiPaymentResponse } from '@/lib/api/types';
import type { Payment, PaymentMethod } from '@/types';

export interface PaymentCreate {
  orderId: number | string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface PaymentFilters {
  orderId?: string;
  paymentMethod?: PaymentMethod;
  skip?: number;
  limit?: number;
}

function buildPaymentQueryParams(filters?: PaymentFilters): Record<string, string> {
  const params: Record<string, string> = {
    limit: String(filters?.limit ?? WORKFLOW_QUERY_LIMIT),
  };

  if (filters?.orderId) params.orderId = filters.orderId;
  if (filters?.paymentMethod) params.paymentMethod = filters.paymentMethod;
  if (filters?.skip !== undefined) params.skip = String(filters.skip);

  return params;
}

export function remainingPaymentAmount(
  totalPrice: number,
  payments: Array<{ amount: number }>
): number {
  const paid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  return Math.max(0, Math.round((totalPrice - paid) * 100) / 100);
}

export const paymentAPI = {
  getAll(filters?: PaymentFilters): Promise<Payment[]> {
    return apiClient.get<Payment[]>('/payments', buildPaymentQueryParams(filters));
  },

  getById(paymentId: string): Promise<Payment> {
    return apiClient.get<Payment>(`/payments/${paymentId}`);
  },

  getByOrder(orderId: string): Promise<Payment[]> {
    return apiClient.get<Payment[]>(`/payments/order/${orderId}`);
  },

  create(payment: PaymentCreate): Promise<Payment> {
    return apiClient
      .post<ApiPaymentResponse>('/payments', payment)
      .then(data => parseApiResponse(paymentResponseSchema, data, 'payment') as Payment);
  },
};
